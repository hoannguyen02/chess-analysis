import collections,hashlib,importlib.util,json,sys,unittest
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/queen-mate'
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-queen-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MasterMates(unittest.TestCase):
 def test_provenance_grading_and_queen_mate(self):
  records=json.loads((DATA/'master-published.json').read_text())['records'];self.assertTrue(records)
  self.assertEqual(len(records),len({r['gameId'] for r in records}))
  exercises={e['gameReference']['id']:e for e in json.loads((ROOT/'src/lib/server/queen-mate-exercises.json').read_text())[0]['exercises'] if e.get('gameReference')}
  sources=json.loads((ROOT/'src/lib/server/queen-mate-game-sources.json').read_text())
  for r in records:
   with self.subTest(game=r['gameId']):
    b=chess.Board(r['gameFen']);frames=[b.fen(en_passant='fen')]
    for san in r['gameMoves']:
     b.push_san(san);self.assertTrue(b.is_valid());frames.append(b.fen(en_passant='fen'))
    self.assertEqual(hashlib.sha256(' '.join(x.uci() for x in b.move_stack).encode()).hexdigest()[:16],r['gameId'])
    self.assertEqual(frames[r['ply']],r['fen']);self.assertEqual(frames[r['ply']-1],r['previousMove']['fen'])
    self.assertEqual(r['gameMoves'][r['ply']-1],r['previousMove']['move'])
    start=chess.Board(r['fen']);shape=m.inspect(start,[chess.Move.from_uci(x) for x in r['validation']['principalVariation']])
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
    for sq in end.pieces(chess.QUEEN,start.turn):
     trial=end.copy();trial.remove_piece_at(sq);self.assertFalse(trial.is_checkmate())
    e=exercises[r['gameId']];self.assertEqual(e['goal'],'checkmate');self.assertEqual(e['moves'],r['moves']);self.assertEqual(e['gameReference']['collection'],'queen-mate')
    self.assertEqual(sources[r['gameId']]['lines'],[r['gameMoves']])
 def test_level_counts_and_master_provenance(self):
  exercises=json.loads((ROOT/'src/lib/server/queen-mate-exercises.json').read_text())[0]['exercises']
  counts=collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in exercises)
  for level in ['Beginner','A','B','C','C*','D']:
   self.assertGreaterEqual(counts[level],12 if level=='D' else 20,level);self.assertLessEqual(counts[level],30,level)
  for e in exercises:
   if e.get('difficulty',{}).get('level') in ['C','C*','D']:self.assertIsNotNone(e.get('gameReference'))
  self.assertEqual(sum(bool(e.get('gameReference')) and e['difficulty']['level']=='B' for e in exercises),20)
  urls={r['source'] for r in json.loads((DATA/'master-corpus-sources.json').read_text())}
  for r in json.loads((DATA/'master-published.json').read_text())['records']:self.assertIn(r['source'],urls)

 def test_approved_composed_positions_are_preserved(self):
  original=json.loads((DATA/'composed.json').read_text())[0]['exercises']
  current=json.loads((ROOT/'src/lib/server/queen-mate-exercises.json').read_text())[0]['exercises']
  self.assertEqual(original,[e for e in current if not e.get('gameReference')])
if __name__=='__main__':unittest.main()
