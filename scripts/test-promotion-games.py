from mate_proof_store import MateProofStore
"""Promotion motif, objective, grade, provenance and legal proof regression checks."""
import collections,importlib.util,json,unittest
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion'
proof_store=MateProofStore(D)
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def read(p):return json.loads(p.read_text())
class PromotionPractice(unittest.TestCase):
 def test_levels_and_introductions(self):
  items=read(ROOT/'src/lib/server/promotion-mate-exercises.json')[0]['exercises'];counts=collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in items)
  self.assertEqual(dict(counts),{'Beginner':5,'A':20,'B':18,'C':17,'C*':21,'D':22})
  types=set()
  for e in items:
   b=chess.Board(e['fen']);self.assertTrue(b.is_valid())
   if e.get('beginner'):
    self.assertLessEqual(len(b.piece_map()),6)
    for move in e['moves']:
     parsed=b.parse_san(move)
     if parsed.promotion:types.add(parsed.promotion)
     b.push(parsed)
    if e['goal']=='checkmate':self.assertTrue(b.is_checkmate())
    else:self.assertEqual(e['goal'],'material');self.assertFalse(b.is_game_over());self.assertEqual(len(chess.Board(e['fen']).piece_map()),3)
  self.assertEqual(types,{chess.QUEEN,chess.BISHOP,chess.KNIGHT}) # Rook choices remain valid alternatives; no duplicate drill required.
 def test_mate_records_and_source_positions(self):
  rows=read(D/'master-published.json')['records']+read(D/'composed-published.json')
  for r in rows:
   proof=proof_store[r['gameId']];verify_certificate(proof)
   self.assertEqual(proof['fen'],r['fen']);self.assertEqual(proof['moves'],r['moves'])
   shape=m.inspect(chess.Board(r['fen']),[chess.Move.from_uci(u) for u in r['validation']['principalVariation']]);self.assertIsNotNone(shape);self.assertEqual(shape['level'],r['level']);self.assertTrue(shape['essentialPromotedSquares'])
   if r['level']=='D':self.assertGreater(r['solverMoves'],3);self.assertTrue(r['sacrifices'])
   elif r['level']=='C':self.assertTrue(r['sacrifices'])
   else:self.assertFalse(r['sacrifices'])
   if r.get('gameMoves'):
    b=chess.Board(r['gameFen'])
    for san in r['gameMoves'][:r['ply']]:b.push_san(san)
    self.assertEqual(b.fen(en_passant='fen'),r['fen']);self.assertTrue(r['source'].startswith('https://'))
 def test_necessary_knight_promotions_in_A_and_B(self):
  records=read(D/'composed-published.json')
  for level in ['A','B']:
   self.assertTrue(any(r['level']==level and any(p['piece']=='N' for p in r['promotions']) for r in records))
if __name__=='__main__':unittest.main()
