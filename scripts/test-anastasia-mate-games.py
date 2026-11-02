from mate_proof_store import MateProofStore
"""Anastasia Mate provenance, legal payoff, motif and all-defence certificates."""
import collections,importlib.util,json,unittest
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/anastasia-mate'
proof_store=MateProofStore(D)
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-anastasia-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AnastasiaPractice(unittest.TestCase):
 def test_pattern_requires_own_pawn_and_two_knight_escapes(self):
  b=chess.Board('8/4N1pk/8/8/8/3R4/8/K7 w - - 0 1');move=b.parse_san('Rh3#')
  shape=m.inspect(b,[move]);self.assertIsNotNone(shape);self.assertEqual(shape['blockerSquare'],'g7')
  without=b.copy();without.remove_piece_at(chess.G7);self.assertIsNone(m.inspect(without,[move]))
  other=chess.Board('7k/1R6/5N2/8/8/8/8/K7 w - - 0 1');self.assertIsNone(m.inspect(other,[other.parse_san('Rh7#')]))
  mirrored=b.mirror();self.assertIsNotNone(m.inspect(mirrored,[chess.Move(chess.square_mirror(move.from_square),chess.square_mirror(move.to_square))]))
 def test_introductions(self):
  items=json.loads((D/'composed.json').read_text())[0]['exercises'];self.assertEqual(len(items),24)
  self.assertEqual({chess.Board(e['fen']).turn for e in items},{True,False})
  for e in items:
   b=chess.Board(e['fen']);self.assertTrue(b.is_valid());shape=m.inspect(b,[b.parse_san(e['moves'][0])]);self.assertIsNotNone(shape)
   self.assertEqual(e['goal'],'checkmate');self.assertLessEqual(len(b.piece_map()),6)
 def test_complete_levels_and_composed_proofs(self):
  items=json.loads((ROOT/'src/lib/server/anastasia-mate-exercises.json').read_text())[0]['exercises']
  counts=collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in items)
  self.assertEqual(dict(counts),{x:24 for x in ['Beginner','A','B','C','C*','D']})
  fingerprints=set()
  for r in json.loads((D/'composed-published.json').read_text()):
   proof=proof_store[r['gameId']];verify_certificate(proof)
   self.assertEqual(proof['fen'],r['fen']);self.assertEqual(proof['moves'],r['moves'])
   b=chess.Board(r['fen']);shape=m.inspect(b,[chess.Move.from_uci(u) for u in r['validation']['principalVariation']]);self.assertEqual(shape['level'],r['level'])
   if r['level']=='D':self.assertGreater(r['solverMoves'],3);self.assertTrue(r['sacrifices'])
   if r['level']=='C':self.assertTrue(r['sacrifices'])
   if r['level'] in ['A','B','C*']:self.assertFalse(r['sacrifices'])
   audit=next(x for x in json.loads((D/'composed-reviewed.json').read_text()) if x['gameId']==r['gameId'])
   self.assertEqual(audit['decision'],'accepted');self.assertNotIn(audit['fingerprint'],fingerprints);fingerprints.add(audit['fingerprint'])
 def test_sources_and_proofs(self):
  for r in json.loads((D/'master-published.json').read_text())['records']:
   proof=proof_store[r['gameId']];verify_certificate(proof)
   b=chess.Board(r['gameFen'])
   for san in r['gameMoves'][:r['ply']]:b.push_san(san)
   self.assertEqual(b.fen(en_passant='fen'),r['fen'])
   shape=m.inspect(b,[b.parse_san(r['moves'][0])] if len(r['moves'])==1 else [chess.Move.from_uci(u) for u in r['validation']['principalVariation']])
   self.assertIsNotNone(shape)
   self.assertTrue(r['source'].startswith('https://'))
if __name__=='__main__':unittest.main()
