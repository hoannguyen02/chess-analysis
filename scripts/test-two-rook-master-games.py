import collections,hashlib,importlib.util,json,sys,unittest
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
from two_rook_mate_research import compare_defences, preflight, start_board, verify_proof
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/two-rook-mate'
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-two-rook-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
EXPANSION=DATA/'expansion-evidence.json'
expansion=json.loads(EXPANSION.read_text()) if EXPANSION.exists() else {'reviewResults': []}
new_proofs={r['gameId']:r['mateProof'] for r in expansion['reviewResults']}
new_reviews={r['gameId']:r for r in expansion['reviewResults']}
class MasterMates(unittest.TestCase):
 def test_provenance_grading_and_two_rook_mate(self):
  records=json.loads((DATA/'master-published.json').read_text())['records'];self.assertTrue(records)
  self.assertEqual(len(records),len({r['gameId'] for r in records}))
  exercises={e['gameReference']['id']:e for e in json.loads((ROOT/'src/lib/server/two-rook-mate-exercises.json').read_text())[0]['exercises'] if e.get('gameReference')}
  sources=json.loads((ROOT/'src/lib/server/two-rook-mate-game-sources.json').read_text())
  for r in records:
   with self.subTest(game=r['gameId']):
    b=chess.Board(r['gameFen']);frames=[b.fen(en_passant='fen')]
    for san in r['gameMoves']:
     b.push_san(san);self.assertTrue(b.is_valid());frames.append(b.fen(en_passant='fen'))
    self.assertEqual(hashlib.sha256(' '.join(x.uci() for x in b.move_stack).encode()).hexdigest()[:16],r['gameId'])
    self.assertEqual(frames[r['ply']],r['fen']);self.assertEqual(frames[r['ply']-1],r['previousMove']['fen'])
    self.assertEqual(r['gameMoves'][r['ply']-1],r['previousMove']['move'])
    start=chess.Board(r['fen'])
    if r['gameId'] in new_proofs:
     self.assertFalse(preflight(r,True)['flags'])
     verify_proof(r,new_proofs[r['gameId']])
     self.assertEqual(exercises[r['gameId']]['tacticPly'],len(r['moves'])-1)
     self.assertEqual(exercises[r['gameId']]['difficulty']['sacrificeCount'],len(r['sacrifices']))
     if r['level']=='C':
      self.assertEqual(len(r['sacrifices']),1)
      self.assertFalse(any(root.get('matesWithoutSacrifice')
                           for root in new_reviews[r['gameId']]['analysis']['roots']))
     if r['level']=='C*':
      self.assertEqual(r['sacrifices'],[])
      self.assertIn(r['solverMoves'],(2,3))
      comparison=new_reviews[r['gameId']]['defenceComparison']
      self.assertTrue(comparison['sampleRequiresDepth'] and comparison['contrastingReplies'])
      self.assertEqual(comparison,compare_defences(start_board(r),r['solverMoves'],r['moves'],1000000))
    else:
     shape=m.inspect(start,[chess.Move.from_uci(x) for x in r['validation']['principalVariation']])
     self.assertIsNotNone(shape)
     for key,value in shape.items():self.assertEqual(r[key],value,key)
     self.assertEqual(r['solverMoves'],r['validation']['mate'])
     if r['validation'].get('mateCertificate'):
      proof=json.loads((DATA/r['validation']['mateCertificate']).read_text())
      self.assertEqual(proof['fen'],r['fen']);self.assertEqual(proof['moves'],r['moves'])
      self.assertGreater(verify_certificate(proof),0)
     for d in r['validation']['defences']:
      self.assertGreater(d['mate'],0)
      self.assertLessEqual(d['mate'],r['solverMoves']-(d['ply']+1)//2)
    end=chess.Board(r['endFen']);self.assertTrue(end.is_checkmate())
    for sq in end.pieces(chess.ROOK,start.turn):
     trial=end.copy();trial.remove_piece_at(sq);self.assertFalse(trial.is_checkmate())
    e=exercises[r['gameId']];self.assertEqual(e['goal'],'checkmate');self.assertEqual(e['moves'],r['moves']);self.assertEqual(e['gameReference']['collection'],'two-rook-mate')
    self.assertEqual(sources[r['gameId']]['lines'],[r['gameMoves']])
 def test_level_counts_and_master_provenance(self):
  exercises=json.loads((ROOT/'src/lib/server/two-rook-mate-exercises.json').read_text())[0]['exercises']
  counts=collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in exercises)
  self.assertEqual(counts['Beginner'],0)
  for e in exercises:
   if e.get('difficulty',{}).get('level') in ['C','C*','D']:self.assertIsNotNone(e.get('gameReference'))
  for level,minimum in [('A',0),('B',10),('C',22),('C*',22),('D',24)]:
   added=sum(r['level']==level for r in expansion.get('records',[]))
   real=[e for e in exercises if e.get('gameReference') and e['difficulty']['level']==level]
   self.assertEqual(len(real),minimum+added)
   if new_proofs:self.assertEqual(counts[level],len(real))
  urls={r['source'] for r in json.loads((DATA/'master-corpus-sources.json').read_text())}
  for r in json.loads((DATA/'master-published.json').read_text())['records']:
   if r['gameId'] in new_proofs:
    self.assertIn(r['source'],{ref['url'] for ref in r['sourceReferences']})
   else:self.assertIn(r['source'],urls)

 def test_composed_positions_are_archived_after_master_replacement(self):
  original=json.loads((DATA/'composed.json').read_text())[0]['exercises']
  current=json.loads((ROOT/'src/lib/server/two-rook-mate-exercises.json').read_text())[0]['exercises']
  self.assertEqual([] if new_proofs else original,[e for e in current if not e.get('gameReference')])
if __name__=='__main__':unittest.main()
