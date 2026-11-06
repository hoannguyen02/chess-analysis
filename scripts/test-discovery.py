import hashlib,importlib.util,json,sys,unittest
from pathlib import Path
import chess
from review_store import read_review_reference
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build-discovery.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class Discovery(unittest.TestCase):
 def test_two_additions_each_to_b_and_c_speed_trial(self):
  from discovery_management import apply as apply_management
  trial=json.loads((ROOT/'scripts/fixtures/research-benchmark/discovery-b-c-extension-20261105.json').read_text())
  records=json.loads((ROOT/'scripts/fixtures/discovery/published.json').read_text())['records']
  by_id={r['gameId']:r for r in records}
  all_new=set(trial['added']['B']+trial['added']['C'])
  self.assertEqual(len(all_new),4)
  for level,ids in trial['added'].items():
   self.assertEqual(len(ids),2)
   for ident in ids:
    self.assertEqual(by_id[ident]['level'],level)
    self.assertEqual(len(by_id[ident]['sacrifices']),0 if level=='B' else 1)
  final=json.loads((ROOT/'scripts/fixtures/discovery/level-c-expansion-20261105.json').read_text())
  historic_ids=set(trial['before']['sourceIds'])|all_new
  historic=apply_management([r for r in records if r['gameId'] in historic_ids],final['managementAtPublication'])
  for level in ['B','C']:self.assertEqual(sum(r['level']==level for r in historic),24)
  oldids=set(trial['before']['sourceIds'])
  for name in ['discovery-exercises.json','discovery-game-sources.json']:
   path=ROOT/'src/lib/server'/name;data=json.loads(path.read_text())
   old=[e for e in data if e['gameReference']['id'] in oldids] if isinstance(data,list) else {k:v for k,v in data.items() if k in oldids}
   self.assertEqual(hashlib.sha256((json.dumps(old,ensure_ascii=False,indent=2)+'\n').encode()).hexdigest(),trial['before']['fileHashes'][str(path.relative_to(ROOT))])
  b=chess.Board(by_id['eef5583eeab818c6']['fen'])
  for san in ['Ke3','Bg2','Rg5+']:b.push_san(san)
  self.assertNotIn(chess.Move.from_uci('h3g5'),b.legal_moves)
  b.remove_piece_at(chess.E5)
  self.assertIn(chess.Move.from_uci('h3g5'),b.legal_moves)
  b=chess.Board(by_id['51b6258a7c5e5a7b']['fen'])
  for san in by_id['51b6258a7c5e5a7b']['moves']:b.push_san(san)
  self.assertNotIn(chess.Move.from_uci('f7e6'),b.legal_moves)
  b.remove_piece_at(chess.B8)
  self.assertIn(chess.Move.from_uci('f7e6'),b.legal_moves)
  for ident,reply,gain in [('043fa99a6866848c','Bxe7',180),('765f315a6674451f','gxf4',220)]:
   b=chess.Board(by_id[ident]['fen']);side=b.turn;base=builder.miner.material(b,side)
   for san in by_id[ident]['moves']:b.push_san(san)
   b.push_san(reply)
   self.assertEqual(builder.miner.material(b,side)-base,gain)
  b=chess.Board(by_id['043fa99a6866848c']['fen'])
  for san in ['Qd4','hxg6','Nxg6+']:b.push_san(san)
  self.assertEqual(len(b.checkers()),2)
  self.assertTrue(all(b.piece_type_at(m.from_square)==chess.KING for m in b.legal_moves))
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
    for field in ['moves','discoveryPly','sliderSquare','targetSquare','moverSquare','kind','goal','gain','localGain']:self.assertEqual(result[field],r[field])
    # A mover-only heuristic misses an accepted offer of a stationary piece.
    # Preserve its inference and independently replay the editorial correction.
    if r.get('sacrificeReview'):
     evidence=r['sacrificeReview']
     self.assertEqual(result['sacrifices'],evidence['automaticSacrifices'])
     self.assertEqual(r['level'],'C');self.assertEqual(len(r['sacrifices']),1)
     before=chess.Board(r['fen'])
     for san in r['moves'][:evidence['acceptedCapturePly']]:before.push_san(san)
     capture=before.parse_san(r['moves'][evidence['acceptedCapturePly']])
     self.assertTrue(before.is_capture(capture))
     self.assertEqual(chess.square_name(capture.to_square),evidence['capturedSquare'])
     self.assertEqual(before.piece_at(capture.to_square).symbol().upper(),evidence['capturedPiece'])
     side=chess.Board(r['fen']).turn
     material=builder.miner.material(before,side)
     before.push(capture)
     self.assertLess(builder.miner.material(before,side),material-75)
    else:self.assertEqual(result['sacrifices'],r['sacrifices'])
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
  for path in fixtures.glob('level-*-expansion-*.json'):
   expansion=json.loads(path.read_text())
   if 'evidenceFile' not in expansion:continue
   evidence=read_review_reference(fixtures/expansion['evidenceFile'])
   analyses.update({r['gameId']:r for r in evidence['analyses']})
   shortcuts.update({r['gameId']:r for r in evidence['shortcuts']})
   shorter.update({r['gameId']:r for r in expansion['shorterMateProofs']})
  reviews={r['gameId']:r for r in c['reviews']}
  self.assertEqual(len(original),120)
  self.assertTrue(all(r['gameId'] in reviews for r in original))
  for level,order in c['order'].items():
   self.assertEqual([r['gameId'] for r in records if r['level']==level],order)
   self.assertEqual(len(order),c['counts'][level])
   self.assertEqual(c['gaps'][level],max(0,24-c.get('effectiveCounts',c['counts'])[level]))
   self.assertLessEqual(len(order),c.get('sourceCountLimits',{}).get(level,24))
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
  for path in fixtures.glob('level-*-expansion-*.json'):
   expansion=json.loads(path.read_text());proofs.update({p['gameId']:p for p in expansion.get('mateProofs',[])})
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
  snapshot=saved['ownerDecisions']
  self.assertEqual(coverage.report(published,snapshot),saved)
  for level in ['B','C','C*','D']:
   from discovery_management import apply as apply_management
   self.assertEqual(saved['levels'][level]['count'],sum(r['level']==level for r in apply_management(published,snapshot)))
   self.assertEqual(saved['levels'][level]['missingPositions'],24-saved['levels'][level]['count'])
 def test_five_new_level_b_positions(self):
  fixtures=ROOT/'scripts/fixtures/discovery'
  batch=json.loads((fixtures/'level-b-expansion-20261104.json').read_text())
  evidence=read_review_reference(fixtures/batch['evidenceFile'])
  published=json.loads((fixtures/'published.json').read_text())['records']
  exercises=json.loads((ROOT/'src/lib/server/discovery-exercises.json').read_text())
  level=[r for r in published if r['level']=='B']
  self.assertGreaterEqual(len(level),24)
  self.assertEqual([r['gameId'] for r in level][:24],batch['baseOrder']+batch['order'])
  self.assertEqual(len(batch['records']),5)
  self.assertEqual(len({r['gameId'] for r in batch['records']}),5)
  canon=lambda value:hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
  self.assertEqual(canon([e for e in exercises if e['gameReference']['id'] in batch['preservedNonBIds']]),batch['preservedNonBExerciseSha256'])
  self.assertEqual(canon([e for e in exercises if e['difficulty']['level']=='B'][:19]),batch['preservedBExerciseSha256'])
  self.assertEqual(hashlib.sha256((ROOT/'src/lib/server/discovery-beginner-exercises.json').read_bytes()).hexdigest(),batch['preservedBeginnerSha256'])
  timelines={r['gameId']:r for r in evidence['timelines']}
  for r in batch['records']:
   self.assertEqual(r['level'],'B');self.assertEqual(r['solverMoves'],3);self.assertFalse(r['sacrifices'])
   self.assertFalse(timelines[r['gameId']]['flags'])
   self.assertTrue(r['sourceReferences'])
   for source in r['sourceReferences']:
    self.assertEqual(len(source['sha256']),64);self.assertTrue(source['url'].startswith('https://'));self.assertTrue(source['retrieved'])
   self.assertTrue(any(r['headers'].get(side+'Title') in ['FM','IM','GM'] for side in ['White','Black']))
   self.assertEqual(r['continuationType'],'played' if r['gameMoves'][r['ply']:r['ply']+len(r['moves'])]==r['moves'] else 'analysis')
  # This discovered check must prevent the real Nxh3+ countercheck and Bishop capture.
  r=next(r for r in batch['records'] if r['gameId']=='044835b0f98dd68c')
  b=chess.Board(r['fen'])
  for san in ['Rg7+','Kh8','Rxg6+']:b.push_san(san)
  self.assertNotIn(chess.Move.from_uci('g5h3'),b.legal_moves)
  b.remove_piece_at(chess.D4)
  self.assertIn(chess.Move.from_uci('g5h3'),b.legal_moves)
  self.assertEqual(b.san(chess.Move.from_uci('g5h3')),'Nxh3+')
 def test_nine_new_active_b_positions_and_saved_management(self):
  from discovery_management import apply as apply_management
  fixtures=ROOT/'scripts/fixtures/discovery'
  batch=json.loads((fixtures/'level-b-expansion-20261105.json').read_text())
  rows=json.loads((fixtures/'published.json').read_text())['records']
  historical=[r for r in rows if r['gameId'] in batch['preservedSourceIds']+batch['order']]
  active=apply_management(historical,batch['managementAtPublication'])
  self.assertEqual([r['gameId'] for r in active if r['level']=='B'],batch['baseActiveOrder']+batch['order'])
  self.assertEqual(len(batch['baseActiveOrder']),15);self.assertEqual(len(batch['order']),9)
  self.assertEqual({level:sum(r['level']==level for r in active) for level in batch['expectedEffectiveCounts']},batch['expectedEffectiveCounts'])
  # The publication snapshot is immutable; later owner decisions are expected
  # to change current counts and must never be reset to satisfy an old test.
  current=apply_management(rows)
  for entry in json.loads((ROOT/'src/lib/server/practice-adjustments.json').read_text()):
   if entry['reference']['scope']!='/discovered-attack':continue
   matches=[r for r in current if ' '.join(r['fen'].split()[:4])==' '.join(entry['reference']['fen'].split()[:4])]
   if entry['removed'] or entry.get('destinationScope','/discovered-attack')!='/discovered-attack':self.assertFalse(matches)
   elif entry.get('level'):
    self.assertTrue(all(r['level']==entry['level'] for r in matches))
  data=json.loads((ROOT/'src/lib/server/discovery-exercises.json').read_text())
  old=[e for e in data if e['gameReference']['id'] in batch['preservedSourceIds']]
  self.assertEqual(hashlib.sha256(json.dumps(old,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),batch['preservedSourceExercisesSha256'])
  self.assertEqual(hashlib.sha256((ROOT/'src/lib/server/discovery-beginner-exercises.json').read_bytes()).hexdigest(),batch['preservedBeginnerSha256'])
  self.assertEqual(len({r['gameId'] for r in batch['records']}),9)
  self.assertFalse({'bb8a2206e82c4bf6','3e2ceb3919bb1a37'} & {r['gameId'] for r in rows})
  for r in batch['records']:
   self.assertEqual(r['level'],'B');self.assertFalse(r['sacrifices']);self.assertEqual(r['solverMoves'],3)
   self.assertTrue(r['sourceReferences']);self.assertTrue(r['masterCredential'])
   for ref in r['sourceReferences']:self.assertEqual(len(ref['sha256']),64)
   # A declined offer in the sample line must not conceal a B-level sacrifice.
   b=chess.Board(r['fen'])
   for ply,san in enumerate(r['moves']):
    move=b.parse_san(san);capture=b.is_capture(move);b.push(move)
    if ply%2==0 and not capture:
     takes=[m for m in b.legal_moves if b.is_capture(m) and m.to_square==move.to_square]
     if r['gameId']=='8bc8a1916e336e16' and ply==0:
      self.assertEqual([b.san(m) for m in takes],['Rxg3+'])
      b2=b.copy();b2.push(takes[0]);b2.push_san('hxg3')
      start=chess.Board(r['fen'])
      self.assertEqual(builder.miner.material(b2,start.turn),builder.miner.material(start,start.turn))
     else:self.assertFalse(takes,(r['gameId'],san))
  # The equal exchanges clear two blockers before the final pawn gain.
  r=next(r for r in batch['records'] if r['gameId']=='92b22f0f4da6a18f')
  b=chess.Board(r['fen']);side=b.turn;base=builder.miner.material(b,side)
  for san in r['moves'][:-1]:b.push_san(san)
  self.assertEqual(builder.miner.material(b,side),base)
  self.assertIn(chess.Move.from_uci('d1d6'),b.legal_moves)
  # Both initial King choices enter the Rook rank and lose the target Rook.
  r=next(r for r in batch['records'] if r['gameId']=='ae9d43b1c118dddb')
  b=chess.Board(r['fen']);b.push_san('Bf7+')
  self.assertEqual({b.san(m) for m in b.legal_moves},{'Kg7','Kh7'})
  for reply in list(b.legal_moves):
   branch=b.copy();branch.push(reply);branch.push_san('Bb3+')
   self.assertTrue(branch.is_check())
   for defence in list(branch.legal_moves):
    end=branch.copy();end.push(defence)
    self.assertEqual(end.piece_at(chess.C2),chess.Piece(chess.ROOK,chess.BLACK))
    end.push_san('Bxc2')
    self.assertFalse(any(m.to_square==chess.C2 and end.is_capture(m) for m in end.legal_moves))
  # The Bishop preparation makes the Knight clearance a check instead of a Queen loss.
  r=next(r for r in batch['records'] if r['gameId']=='309400c511b2bc0f')
  b=chess.Board(r['fen']);b.push_san('Nd3');self.assertIn('Qxg3',[b.san(m) for m in b.legal_moves])
  b=chess.Board(r['fen']);b.push_san('Bb3+')
  self.assertEqual([b.san(m) for m in b.legal_moves],['Kc1'])
  b.push_san('Kc1');b.push_san('Nd3+')
  self.assertEqual([b.san(m) for m in b.legal_moves],['Kb1'])
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
