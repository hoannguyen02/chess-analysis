import copy,hashlib,importlib.util,json,sys,unittest
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

class BeginnerForks(unittest.TestCase):
 def test_composed_collection_and_all_starting_moves(self):
  from beginner_tactics import local_review, approved_exercises, fork_targets
  bundle=json.loads((ROOT/'scripts/fixtures/fork/beginner.json').read_text())
  exercises=json.loads((ROOT/'src/lib/server/fork-beginner-exercises.json').read_text())
  self.assertEqual(len(exercises),len(bundle['entries']))
  self.assertEqual(approved_exercises(bundle),exercises)
  self.assertEqual(len({e['id'] for e in exercises}),len(exercises))
  pieces=set();sides=set();checking=set()
  for entry in bundle['entries']:
   e,r=entry['exercise'],entry['review'];board=chess.Board(e['fen'])
   self.assertTrue(board.is_valid());self.assertFalse(board.is_game_over())
   self.assertNotIn('gameReference',e);self.assertNotIn('difficulty',e)
   self.assertTrue(e['beginner']);self.assertEqual(e['goal'],'material')
   self.assertEqual(e['source'],'original-composition')
   replay=local_review(r['candidate'])
   self.assertFalse(replay['flags'],e['id'])
   self.assertEqual(replay['roots'],r['roots'])
   self.assertEqual(replay['lines'],r['lines'])
   self.assertEqual({root['move'] for root in r['engineRoots']},{board.san(m) for m in board.legal_moves})
   self.assertEqual({root['move'] for root in r['roots']},{board.san(m) for m in board.legal_moves})
   for row in r['engineRoots']:
    position=board.copy()
    for san in row['pv']:position.push_san(san)
   primary=board.parse_san(e['moves'][0]);pieces.add(board.piece_at(primary.from_square).symbol().upper())
   sides.add(board.turn);board.push(primary);checking.add(board.is_check())
   for line in [e['moves'],*e['alternativeLines']]:
    start=chess.Board(e['fen']);move=start.parse_san(line[0])
    self.assertGreaterEqual(len(fork_targets(start,move)),2)
  # This is the retained verified composition subset. The new owner-reviewed
  # Beginner FEN bank is separately authored, can be solutionless, and does not
  # inherit this tactical-approval claim or an artificial per-piece quota.
  self.assertTrue(pieces);self.assertTrue(sides);self.assertTrue(checking)

 def test_shortcuts_mates_and_changed_approvals_fail_closed(self):
  from beginner_tactics import local_review, approved_exercises
  mate=local_review({'fen':'7k/5Q2/6K1/8/8/8/8/8 w - - 0 1','root':'Qg7#'})
  self.assertIn('shorter-mate-available',mate['flags'])
  bundle=json.loads((ROOT/'scripts/fixtures/fork/beginner.json').read_text())
  for field in ['status','candidateHash','verificationVersion']:
   bad=copy.deepcopy(bundle);bad['entries'][0]['review'][field]='changed'
   with self.subTest(field=field),self.assertRaises(ValueError):approved_exercises(bad)
  bad=copy.deepcopy(bundle);bad['entries'][0]['exercise']['moves']=['Ka1']
  with self.assertRaises(ValueError):approved_exercises(bad)
  bad=copy.deepcopy(bundle);bad['entries'][0]['decision']['reviewer']=''
  with self.assertRaises(ValueError):approved_exercises(bad)

 def test_rebuild_preserves_existing_games_and_compositions(self):
  import subprocess
  names=['src/lib/server/fork-exercises.json','src/lib/server/fork-game-sources.json',
         'scripts/fixtures/fork/published.json','src/lib/server/fork-beginner-exercises.json',
         'src/lib/server/practice-adjustments.json','src/lib/server/manual-tactics.json']
  before=[(ROOT/name).read_bytes() for name in names]
  subprocess.run([sys.executable,str(ROOT/'scripts/build-forks.py')],check=True,capture_output=True)
  self.assertEqual([(ROOT/name).read_bytes() for name in names],before)
if __name__=='__main__':unittest.main()
