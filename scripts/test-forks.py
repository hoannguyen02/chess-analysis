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
  # New indexed leads need no invented legacy screen score/PV. Their complete
  # tactical and editorial evidence is validated by the shared bundle reader.
  approved={}
  for path in (ROOT/'scripts/fixtures/fork').glob('*.json'):
   data=json.loads(path.read_text())
   if isinstance(data,dict) and data.get('status')=='editorially-approved-bundle':
    approved.update({r['gameId']:r for r in builder.reviewed_bundle(data)})
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
    if r.get('validation'):
     pv=[chess.Move.from_uci(u) for u in r['validation']['principalVariation']]
    else:
     self.assertIn(r['gameId'],approved)
     self.assertEqual(r,{**approved[r['gameId']],'forkReplies':builder.reply_coverage(r)})
     walk=chess.Board(r['fen']);pv=[]
     for san in r['moves']+r.get('settlement',[]):
      move=walk.parse_san(san);pv.append(move);walk.push(move)
    # Historical D approvals can replay as E leads under today's move ranges.
    levels=['D','E'] if r['level']=='D' else [r['level']]
    result=builder.miner.inspect(chess.Board(r['fen']),pv,levels)
    if r['level']=='D':self.assertEqual(result['level'],'E' if result['solverMoves']>=6 else 'D')
    for field in ['moves','forkPly','forkSquare','targets','capturedSquare','gain','localGain']:self.assertEqual(result[field],r[field])
    if r['level']=='D' and r.get('editorialCopy'):
     # The geometry lead detector omits stationary and promoted-piece offers.
     # Reviewed D metadata must instead match every actual settled sacrifice.
     from fork_research import sacrifice_review
     proof=sacrifice_review(r)
     self.assertTrue(proof['accepted'])
     self.assertFalse(proof['unvalidatedClaims'])
     self.assertFalse(proof['unrecordedSacrifices'])
     self.assertEqual({(s['ply'],s['piece']) for s in r['sacrifices']},
                      {(s['offeredPly'],s['piece']) for s in proof['accepted']})
    else:self.assertEqual(result['sacrifices'],r['sacrifices'])
    self.assertEqual(builder.reply_coverage(r),r['forkReplies'])
    self.assertIn(r['moves'][-1],r['forkReplies'][r['moves'][-2]])
    if r.get('validation'):
     self.assertGreaterEqual(r['score'],150)
     self.assertGreaterEqual(r['score'],r['validation']['bestScore']-40)
     for d in r['validation']['defences']:self.assertGreaterEqual(d['score'],100)
 def test_rejects_plain_capture(self):
  b=chess.Board('7k/8/8/8/8/8/q7/R5K1 w - - 0 1')
  pv=[chess.Move.from_uci(u) for u in ['a1a2','h8g8','g1f1','g8f8','f1e1']]
  self.assertIsNone(builder.miner.inspect(b,pv))
 def test_reviewed_additions_keep_objectives_copy_and_complete_sources(self):
  bundle=json.loads((ROOT/'scripts/fixtures/fork/expansion-evidence.json').read_text())
  reviewed=builder.reviewed_bundle(bundle)
  levels={r['gameId']:r['level'] for r in reviewed}
  batches=bundle['publicationBatches']
  ab_batch=next(b for b in batches
                if (b.get('coverageChecklist') or {}).get('targetActiveCounts')=={'A':24,'B':24})
  self.assertCountEqual([levels[ident] for ident in ab_batch['recordIds']],['A']*4+['B']*5)
  d_batch=next(b for b in batches
               if (b.get('coverageChecklist') or {}).get('startingActiveD')==18
               and b['coverageChecklist'].get('targetActiveD')==24)
  self.assertEqual(len(d_batch['recordIds']),6)
  self.assertEqual(set(d_batch['recordIds']),set(d_batch['coverageChecklist']['newDIds']))
  self.assertTrue(all(levels[ident]=='D' for ident in d_batch['recordIds']))
  exercises={r['gameReference']['id']:r for r in json.loads((ROOT/'src/lib/server/fork-exercises.json').read_text())}
  sources=json.loads((ROOT/'src/lib/server/fork-game-sources.json').read_text())
  for r in reviewed:
   e=exercises[r['gameId']]
   self.assertEqual(e['goal'],'material')
   self.assertEqual(e['tacticPly'],r['forkPly'])
   self.assertEqual(e['solution'],r['editorialCopy']['solutionVi'])
   self.assertEqual(e['hints'],r['editorialCopy']['hintsVi'])
   self.assertEqual(sources[r['gameId']]['lines'],[r['gameMoves']])
   self.assertEqual(sources[r['gameId']]['headers'],r['headers'])
  changed=copy.deepcopy(bundle);changed['records'][0]['goal']='mate'
  with self.assertRaisesRegex(ValueError,'approval'):builder.reviewed_bundle(changed)
  changed=copy.deepcopy(bundle);changed['settings']['rootNodes']=12000
  with self.assertRaisesRegex(ValueError,'full-budget'):builder.reviewed_bundle(changed)

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

 def test_new_compositions_require_unique_one_move_but_legacy_rebuilds(self):
  from beginner_one_move import review_composed_beginner
  from beginner_tactics import approved_exercises, local_review
  bundle=json.loads((ROOT/'scripts/fixtures/fork/beginner.json').read_text())
  candidates={entry['review']['candidate']['root']:entry['review']['candidate']
              for entry in bundle['entries']}
  def review(root, moves):
   candidate={**candidates[root], 'goal':'material', 'level':'Beginner', 'moves':moves}
   return review_composed_beginner(candidate, local_review, 'forkWin')
  self.assertEqual(review('Ne2+', ['Ne2+'])['beginnerProof']['answer'],'Ne2+')
  self.assertIn('beginner-requires-one-learner-move',
                review('Ne2+', candidates['Ne2+']['moves'])['flags'])
  self.assertIn('beginner-objective-requires-exactly-one-sound-move',
                review('Rc1', ['Rc1'])['flags'])
  self.assertEqual(len(approved_exercises(bundle)),len(bundle['entries']))
if __name__=='__main__':unittest.main()
