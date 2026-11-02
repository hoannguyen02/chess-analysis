import hashlib,importlib.util,json,sys,unittest
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build-discovery.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class Discovery(unittest.TestCase):
 def test_editorial_reviews_are_preserved(self):
  fixtures=ROOT/'scripts/fixtures/discovery'
  published=json.loads((fixtures/'published.json').read_text())['records']
  published_ids={r['gameId'] for r in published}
  overrides=json.loads((fixtures/'level-overrides.json').read_text())
  for override in overrides:
   matches=[r for r in published if r['gameId']==override['gameId']]
   if matches:
    self.assertEqual(matches[0]['fen'],override['fen'])
    self.assertEqual(matches[0]['level'],override['level'])
    self.assertIn('inferredLevel',matches[0])
  exclusions=json.loads((fixtures/'excluded.json').read_text())
  excluded_ids={r['gameId'] for r in exclusions}
  self.assertEqual(len(excluded_ids),len(exclusions))
  self.assertFalse(published_ids & excluded_ids)
  latest={r['gameId']:r for r in json.loads((fixtures/'level-a-curation.json').read_text())['reviews']}
  latest.update({r['gameId']:r for r in json.loads((fixtures/'upper-curation.json').read_text())['reviews']})
  for filename in ['level-a-review.json','advanced-level-review.json']:
   review=json.loads((fixtures/filename).read_text())
   entries=review['reviews']
   self.assertEqual(len(entries),review['reviewed'])
   self.assertEqual(len({r['gameId'] for r in entries}),len(entries))
   for r in entries:
    with self.subTest(review=filename,game=r['gameId']):
     self.assertIn(r['decision'],['keep','remove'])
     self.assertTrue(r['reason'])
     decision=latest.get(r['gameId'],r)['decision']
     self.assertEqual(r['gameId'] in published_ids,decision=='keep')
     self.assertEqual(r['gameId'] in excluded_ids,decision=='remove')
  advanced=json.loads((fixtures/'advanced-level-review.json').read_text())['reviews']
  for level,total in [('B',55),('C',39),('C*',25),('D',21)]:
   self.assertEqual([r['originalExerciseNumber'] for r in advanced if r['originalLevel']==level],list(range(1,total+1)))
  for name in ['discovery-exercises','discovery-game-sources']:
   data=json.loads((ROOT/f'src/lib/server/{name}.json').read_text())
   ids={e['gameReference']['id'] for e in data} if isinstance(data,list) else set(data)
   self.assertEqual(ids,published_ids)
 def test_published_games(self):
  records=json.loads((ROOT/'scripts/fixtures/discovery/published.json').read_text())['records']
  for level in builder.miner.LEVELS:
   self.assertGreater(sum(r['level']==level for r in records),0,level)
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
    result=builder.miner.inspect(chess.Board(r['fen']),[chess.Move.from_uci(u) for u in r['validation']['principalVariation']],[r.get('inferredLevel',r['level'])])
    for field in ['moves','discoveryPly','sliderSquare','targetSquare','moverSquare','kind','goal','gain','localGain','sacrifices']:self.assertEqual(result[field],r[field])
    self.assertEqual(builder.reply_coverage(r),r['coverage'])
    if r['coverage']['mode']=='capture':self.assertIn(r['moves'][-1],r['coverage']['replies'][r['moves'][-2]])
    self.assertGreaterEqual(r['score'],150)
    self.assertGreaterEqual(r['score'],r['validation']['bestScore']-40)
    for d in r['validation']['defences']:self.assertGreaterEqual(d['score'],100)
 def test_level_a_curated_coverage(self):
  fixtures=ROOT/'scripts/fixtures/discovery'
  curation=json.loads((fixtures/'level-a-curation.json').read_text())
  candidates=json.loads((fixtures/'level-a-candidates.json').read_text())['candidates']
  analysis={r['gameId']:r for r in json.loads((fixtures/'level-a-curation-analysis.json').read_text())['reviews']}
  records=[r for r in json.loads((fixtures/'published.json').read_text())['records'] if r['level']=='A']
  exercises=[e for e in json.loads((ROOT/'src/lib/server/discovery-exercises.json').read_text()) if e['difficulty']['level']=='A']
  self.assertEqual(len(curation['reviews']),39)
  self.assertEqual(len(candidates),39)
  self.assertEqual(len(analysis),39)
  self.assertEqual(sum(r['decision']=='remove' for r in curation['reviews']),15)
  self.assertEqual(len(records),24)
  self.assertEqual([r['gameId'] for r in records],curation['order'])
  originals={r['gameId']:r for r in candidates}
  movers=set();sliders=set();sides=set();kinds=set();mate_count=0;quiet=False
  for r,e in zip(records,exercises):
   self.assertEqual(r['fen'],originals[r['gameId']]['fen'])
   self.assertEqual(r['moves'],originals[r['gameId']]['moves'])
   self.assertLessEqual(r['solverMoves'],2)
   self.assertEqual(r['sacrifices'],[])
   b=chess.Board(r['fen']);m=b.parse_san(r['moves'][0]);a=b.copy();a.push(m)
   movers.add(b.piece_at(m.from_square).piece_type)
   sliders.add(b.piece_at(chess.parse_square(r['sliderSquare'])).piece_type)
   sides.add(b.turn);kinds.add(r['kind']);quiet|=not a.is_check()
   self.assertEqual(e['goal'],'checkmate' if r['goal']=='mate' else 'material')
   if r['goal']=='mate':
    mate_count+=1;self.assertTrue(a.is_checkmate());self.assertEqual(e['outcome'],'checkmate')
    expected=[]
    for move in b.legal_moves:
     after=b.copy();after.push(move)
     if after.is_checkmate():expected.append(b.san(move))
    self.assertEqual({line[0] for line in [e['moves'],*e['alternativeLines']]},set(expected))
   else:
    for root in analysis[r['gameId']]['roots']:
     self.assertFalse(root['forcedMateInTwo'])
     self.assertFalse(root['safeImmediateGain'] and not root['discovery'])
    if len(r['moves'])==1:
     a.remove_piece_at(chess.parse_square(r['sliderSquare']))
     self.assertTrue(any(move.to_square==m.to_square for move in a.legal_moves),r['gameId'])
  self.assertEqual(movers,{chess.PAWN,chess.KNIGHT,chess.BISHOP,chess.ROOK,chess.QUEEN})
  self.assertEqual(sliders,{chess.BISHOP,chess.ROOK,chess.QUEEN})
  self.assertEqual(sides,{chess.WHITE,chess.BLACK})
  self.assertEqual(kinds,{'check','attack'})
  self.assertEqual(mate_count,4);self.assertTrue(quiet)
  import subprocess
  paths=[ROOT/'src/lib/server/discovery-exercises.json', ROOT/'src/lib/server/discovery-game-sources.json', fixtures/'published.json']
  before=[path.read_bytes() for path in paths]
  subprocess.run([sys.executable,str(ROOT/'scripts/build-discovery.py')],check=True,capture_output=True)
  self.assertEqual([path.read_bytes() for path in paths],before)
 def test_upper_curation_and_mate_proofs(self):
  fixtures=ROOT/'scripts/fixtures/discovery'
  c=json.loads((fixtures/'upper-curation.json').read_text())
  records=json.loads((fixtures/'published.json').read_text())['records']
  exercises=json.loads((ROOT/'src/lib/server/discovery-exercises.json').read_text())
  original=json.loads((fixtures/'upper-candidates.json').read_text())['candidates']
  analyses={r['gameId']:r for name in ['upper-curation-analysis.json','upper-research-review.json'] for r in json.loads((fixtures/name).read_text())['reviews']}
  shortcuts={r['gameId']:r for name in ['upper-shortcut-review.json','upper-research-shortcuts.json'] for r in json.loads((fixtures/name).read_text())['reviews']}
  shorter={r['gameId']:r for r in json.loads((fixtures/'upper-shorter-mates.json').read_text())['proofs']}
  reviews={r['gameId']:r for r in c['reviews']}
  self.assertEqual(len(original),120)
  self.assertTrue(all(r['gameId'] in reviews for r in original))
  for level,order in c['order'].items():
   self.assertEqual([r['gameId'] for r in records if r['level']==level],order)
   self.assertEqual(len(order),c['counts'][level])
   self.assertEqual(c['gaps'][level],24-len(order))
   self.assertLessEqual(len(order),24)
   for e in [e for e in exercises if e['difficulty']['level']==level]:
    review=reviews[e['gameReference']['id']]
    self.assertEqual(review['decision'],'keep')
    self.assertEqual(e['fen'],review['fen']);self.assertEqual(e['moves'],review['moves'])
    self.assertEqual(e['goal'],review['goal'])
    self.assertEqual(e['solution'],review['solutionVi'])
    ident=review['gameId']
    if e['goal']=='material':
     self.assertFalse(shortcuts[ident]['shortcuts'])
     self.assertFalse([flag for flag in analyses[ident]['flags'] if not flag.startswith('user-level-override')])
     self.assertFalse([root for root in analyses[ident]['roots'] if root['mateScore'] is not None and root['mateScore']>0])
    else:
     self.assertEqual(shorter[ident]['status'],'refuted-within-limit')
     self.assertEqual(shorter[ident]['solverMoves'],e['difficulty']['solverMoves']-1)
    if level in ['B','C*']:self.assertEqual(e['difficulty']['sacrificeCount'],0)
    if level in ['C','D']:self.assertGreater(e['difficulty']['sacrificeCount'],0)
    if level=='D':self.assertGreater(e['difficulty']['solverMoves'],3)
  proofs={p['gameId']:p for p in json.loads((fixtures/'upper-mate-proofs.json').read_text())['proofs']}
  for r in records:
   if r['level']=='A' or r['goal']!='mate':continue
   proof=proofs[r['gameId']];self.assertEqual(proof['status'],'proved')
   side=chess.Board(r['fen']).turn
   def verify(b,left):
    node=proof['tree'][b.fen()+'|'+str(left)]
    if b.is_checkmate():
     self.assertNotEqual(b.turn,side);self.assertTrue(node['mate']);return
    self.assertFalse(b.is_stalemate())
    if b.turn==side:
     self.assertGreater(left,0);move=chess.Move.from_uci(node['move']);self.assertIn(move,b.legal_moves)
     after=b.copy();after.push(move);verify(after,left-1)
    else:
     self.assertEqual(set(node['replies']),{m.uci() for m in b.legal_moves})
     for move in list(b.legal_moves):
      after=b.copy();after.push(move);verify(after,left)
   verify(chess.Board(r['fen']),r['solverMoves'])
 def test_second_pass_decisions_and_coverage(self):
  fixtures=ROOT/'scripts/fixtures/discovery'
  review=json.loads((fixtures/'second-pass-curation.json').read_text())
  candidates=json.loads((fixtures/'second-pass-candidates.json').read_text())['candidates']
  analysis={r['gameId']:r for r in json.loads((fixtures/'second-pass-analysis.json').read_text())['reviews']}
  published=json.loads((fixtures/'published.json').read_text())['records']
  ids={r['gameId'] for r in published}
  excluded={r['gameId'] for r in json.loads((fixtures/'excluded.json').read_text())}
  self.assertEqual(review['reviewed'],95)
  self.assertEqual({r['gameId'] for r in review['reviews']},{r['gameId'] for r in candidates})
  self.assertEqual(set(analysis),{r['gameId'] for r in candidates})
  for row in review['reviews']:
   self.assertEqual(row['gameId'] in ids,row['decision']=='keep')
   if row['decision']=='remove':self.assertIn(row['gameId'],excluded)
   else:self.assertFalse(analysis[row['gameId']]['flags'])
  for r in published:
   if r['level']=='C*':self.assertGreaterEqual(r['solverMoves'],5)
  spec=importlib.util.spec_from_file_location('coverage',ROOT/'scripts/discovery-coverage-report.py')
  coverage=importlib.util.module_from_spec(spec);spec.loader.exec_module(coverage)
  saved=json.loads((fixtures/'second-pass-coverage.json').read_text())
  self.assertEqual(coverage.report(published),saved)
  for level in ['B','C','C*','D']:
   self.assertEqual(saved['levels'][level]['count'],review['counts'][level])
   self.assertEqual(saved['levels'][level]['missingPositions'],24-review['counts'][level])
 def test_user_rejected_muradli_aronian_stays_unpublished(self):
  ident='9f0cc28d5b4447d5'
  fixtures=ROOT/'scripts/fixtures/discovery'
  records=json.loads((fixtures/'published.json').read_text())['records']
  self.assertNotIn(ident,{r['gameId'] for r in records})
  exclusions=json.loads((fixtures/'excluded.json').read_text())
  entry=next(r for r in exclusions if r['gameId']==ident)
  self.assertEqual(entry['fen'],'r4rk1/pp3p2/8/2Pp1bp1/3Qn2p/2P1P3/PB2B1qP/2RKR3 b - - 3 23')
  self.assertIn('User exclusion',entry['reason'])
 def test_revealed_slider(self):
  b=chess.Board('k7/8/8/8/2q5/8/B7/R6K w - - 0 1')
  move=b.parse_san('Bxc4+');a=b.copy();a.push(move)
  self.assertEqual(builder.miner.discoveries(b,move,a),[(chess.A1,chess.A8,'check')])
 def test_rejects_direct_check(self):
  b=chess.Board('k7/8/8/8/8/8/8/1R5K w - - 0 1')
  move=b.parse_san('Ra1+');a=b.copy();a.push(move)
  self.assertEqual(builder.miner.discoveries(b,move,a),[])
 def test_rejects_plain_capture(self):
  b=chess.Board('7k/8/8/8/8/8/q7/R5K1 w - - 0 1')
  pv=[chess.Move.from_uci(u) for u in ['a1a2','h8g8','g1f1','g8f8','f1e1']]
  self.assertIsNone(builder.miner.inspect(b,pv))
if __name__=='__main__':unittest.main()
