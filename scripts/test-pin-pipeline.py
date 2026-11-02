import importlib.util,json,unittest,hashlib
from pathlib import Path
import chess
import sys
sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-pins.py')
miner=importlib.util.module_from_spec(spec);spec.loader.exec_module(miner)
class Pins(unittest.TestCase):
 def test_research_records(self):
  records=json.loads((ROOT/'scripts/fixtures/pin/researched.json').read_text())['records']
  for level in miner.LEVELS:
   self.assertGreaterEqual(sum(r['level']==level for r in records),20,level)
  self.assertEqual(set(r['level'] for r in records),set(['A','B','C','C*','D']))
  self.assertEqual(len({r['fen'] for r in records}),len(records))
  seen=set()
  for r in records:
   with self.subTest(game=r['gameId']):
    self.assertNotIn(r['gameId'],seen);seen.add(r['gameId'])
    game=chess.Board(r['gameFen']);positions=[game.fen(en_passant='fen')]
    for san in r['gameMoves']:game.push_san(san);positions.append(game.fen(en_passant='fen'))
    self.assertEqual(hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16],r['gameId'])
    self.assertEqual(positions[r['ply']],r['fen'])
    self.assertEqual(positions[r['ply']-1],r['previousMove']['fen'])
    b=chess.Board(r['fen']);pv=[chess.Move.from_uci(u) for u in r['validation']['principalVariation']]
    result=miner.inspect(b,pv,[r['level']])
    for field in ['moves','level','solverMoves','pinSquare','pinner','motif','gain','localGain','sacrifices']:
     self.assertEqual(result[field],r[field])
    self.assertTrue(b.is_valid())
    for san in r['moves']:b.push_san(san)
    if r.get('goal')=='mate':self.assertTrue(b.is_checkmate())
    else:
     self.assertGreaterEqual(r['gain'],100)
     self.assertGreaterEqual(r['localGain'],100)
    self.assertGreaterEqual(r['score'],150)
    self.assertGreaterEqual(r['score'],r['validation']['bestScore']-40)
    for defence in r['validation']['defences']:self.assertGreaterEqual(defence['score'],100)
 def test_editorial_exclusions(self):
  excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/pin/excluded.json').read_text())}
  self.assertTrue({'03ebd38a036fc4bc','4cff63966870df00'}<=excluded)
  records=json.loads((ROOT/'scripts/fixtures/pin/researched.json').read_text())['records']
  exercises=json.loads((ROOT/'src/lib/server/pin-exercises.json').read_text())
  sources=json.loads((ROOT/'src/lib/server/pin-game-sources.json').read_text())
  self.assertFalse(excluded & {r['gameId'] for r in records})
  self.assertFalse(excluded & {e['gameReference']['id'] for e in exercises if 'gameReference' in e})
  self.assertFalse(excluded & set(sources))
 def test_beginner_pin_benefit_review(self):
  spec=importlib.util.spec_from_file_location('beginner_review',ROOT/'scripts/review-pin-beginners.py')
  review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
  records=json.loads((ROOT/'scripts/fixtures/pin/beginner-reviewed.json').read_text())
  published=json.loads((ROOT/'src/lib/server/pin-exercises.json').read_text())
  active={e['fen'] for e in published if e.get('source')=='original-composition'}
  evidence=json.loads((ROOT/'scripts/fixtures/pin/beginner-benefit-review.json').read_text())['records']
  self.assertEqual(len(evidence),22)
  self.assertEqual(active,{r['fen'] for r in evidence if r['decision']=='retain'})
  for r in records:
   if r['exercise']['fen'] in active:
    self.assertTrue(review.verify(r))
    self.assertTrue(review.verify_editorial(r))
  for fen in ['8/3q4/3N4/2krP1K1/8/8/8/8 b - - 0 1','8/2R1n3/8/3k4/4r3/5B2/5K2/8 w - - 0 1']:
   record=next(r for r in records if r['exercise']['fen']==fen)
   with self.assertRaisesRegex(AssertionError,'Simpler direct material gain'):
    review.verify_editorial(record)
   self.assertNotIn(fen,active)
 def test_new_beginner_pins_need_the_defender_restriction(self):
  records=json.loads((ROOT/'scripts/fixtures/pin/beginner-reviewed.json').read_text())
  new=[r for r in records if r['id'].startswith('pin-beginner-essential-')]
  self.assertEqual(len(new),10)
  self.assertEqual(sum(chess.Board(r['exercise']['fen']).turn for r in new),5)
  for r in new:
   e=r['exercise'];b=chess.Board(e['fen']);color=b.turn;p=e['pinSetup']
   self.assertEqual(len(b.piece_map()),6)
   root=b.parse_san(e['moves'][0]);front=chess.parse_square(p['front'])
   b.remove_piece_at(chess.parse_square(p['pinner']));b.push(root)
   self.assertIn(chess.Move(front,root.to_square),b.legal_moves)
   self.assertLess(r['counterfactual']['netCaptureTrade'],0)
   b=chess.Board(e['fen']);b.push_san(e['moves'][0])
   self.assertEqual({b.san(m) for m in b.legal_moves},{p['reply'] for p in r['defenceProbes']})
   self.assertTrue(all(p['materialGainAfterEightPlies']>=100 for p in r['defenceProbes']))
   start=chess.Board(e['fen'])
   expected={start.san(m) for m in start.legal_moves if start.is_capture(m) or start.gives_check(m)}
   self.assertEqual(expected,{p['root'] for p in r['rootProbes']})
   for probe in r['rootProbes']:
    if probe['root']!=e['moves'][0]:
     self.assertLessEqual(probe['worstMaterialAfterImmediateReply'],0)
 def test_relative_pin_geometry(self):
  b=chess.Board('q6k/8/n7/8/8/8/8/R5K1 w - - 0 1')
  self.assertEqual(miner.relative_pin(b,chess.BLACK,chess.A6),(chess.A1,chess.A8))
  # A queen in front of a knight is not pinned to a higher-value piece.
  b.set_piece_at(chess.A6,chess.Piece(chess.QUEEN,chess.BLACK))
  b.set_piece_at(chess.A8,chess.Piece(chess.KNIGHT,chess.BLACK))
  self.assertIsNone(miner.relative_pin(b,chess.BLACK,chess.A6))
 def test_equal_queen_exchange_is_not_a_sacrifice(self):
  records=json.loads((ROOT/'scripts/fixtures/pin/researched.json').read_text())['records']
  r=next(r for r in records if r['headers']['White']=='Napier, William Ewart' and r['moves']==['Qxe4','Qxe4','fxe4'])
  self.assertEqual(r['level'],'A')
  self.assertEqual(r['sacrifices'],[])
 def test_rejects_capture_without_pin(self):
  b=chess.Board('7k/8/8/8/8/8/q7/R5K1 w - - 0 1')
  self.assertIsNone(miner.inspect(b,[chess.Move.from_uci(u) for u in ['a1a2','h8g8','g1f1','g8f8']]))
if __name__=='__main__':unittest.main()
