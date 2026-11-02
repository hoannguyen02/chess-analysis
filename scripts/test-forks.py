import hashlib,importlib.util,json,sys,unittest
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build-forks.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class Forks(unittest.TestCase):
 def test_published_games(self):
  records=json.loads((ROOT/'scripts/fixtures/fork/published.json').read_text())['records']
  for level in builder.miner.LEVELS:
   self.assertGreaterEqual(sum(r['level']==level for r in records),20,level)
  self.assertEqual(len({r['gameId'] for r in records}),len(records))
  self.assertEqual(len({r['fen'] for r in records}),len(records))
  self.assertEqual({r['level'] for r in records},set(builder.miner.LEVELS))
  for r in records:
   with self.subTest(game=r['gameId']):
    game=chess.Board(r['gameFen']);positions=[game.fen(en_passant='fen')]
    for san in r['gameMoves']:game.push_san(san);positions.append(game.fen(en_passant='fen'))
    self.assertEqual(hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16],r['gameId'])
    self.assertEqual(positions[r['ply']],r['fen'])
    self.assertEqual(positions[r['ply']-1],r['previousMove']['fen'])
    result=builder.miner.inspect(chess.Board(r['fen']),[chess.Move.from_uci(u) for u in r['validation']['principalVariation']],[r['level']])
    for field in ['moves','forkPly','forkSquare','targets','capturedSquare','gain','localGain','sacrifices']:self.assertEqual(result[field],r[field])
    self.assertEqual(builder.reply_coverage(r),r['forkReplies'])
    self.assertIn(r['moves'][-1],r['forkReplies'][r['moves'][-2]])
    self.assertGreaterEqual(r['score'],150)
    self.assertGreaterEqual(r['score'],r['validation']['bestScore']-40)
    for d in r['validation']['defences']:self.assertGreaterEqual(d['score'],100)
 def test_rejects_plain_capture(self):
  b=chess.Board('7k/8/8/8/8/8/q7/R5K1 w - - 0 1')
  pv=[chess.Move.from_uci(u) for u in ['a1a2','h8g8','g1f1','g8f8','f1e1']]
  self.assertIsNone(builder.miner.inspect(b,pv))
if __name__=='__main__':unittest.main()
