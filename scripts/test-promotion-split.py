"""Check objective separation, all-defence material certificates and local replay."""
import collections,json,unittest
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'src/lib/server'; AUDIT=ROOT/'scripts/fixtures/promotion-split'
def read(p):return json.loads(p.read_text())
def balance(b,c):
 values={chess.PAWN:100,chess.KNIGHT:320,chess.BISHOP:330,chess.ROOK:500,chess.QUEEN:900,chess.KING:0}
 return sum(values[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def verify_safety(board,node,solver,baseline,minimum,left=2):
 assert balance(board,solver)-baseline>=minimum
 if node.get('settled'):
  assert (board.is_checkmate() and board.turn!=solver) or (board.turn==solver and not board.is_check() and not board.is_game_over(claim_draw=True))
  return
 assert not board.is_game_over(claim_draw=True)
 own=board.turn==solver
 if own:
  assert left>0 and board.is_check()
  branches={node['move']:node['child']}
 else:
  branches=node['replies'];assert set(branches)=={m.uci() for m in board.legal_moves}
 for u,child in branches.items():
  m=chess.Move.from_uci(u);assert m in board.legal_moves
  nxt=board.copy();nxt.push(m);verify_safety(nxt,child,solver,baseline,minimum,left-int(own))
def verify(r,minimum=100,bound=None):
 b=chess.Board(r['fen']);solver=b.turn;baseline=balance(b,solver);seen=set();maxdepth=0
 def visit(left,used,promoted):
  nonlocal maxdepth
  key=b.fen(en_passant='fen')+'|'+str(left);node=r['nodes'][key]
  if 'gain' in node:
   assert promoted or r.get('allowUnrealizedThreat')
   assert (b.is_checkmate() and b.turn!=solver) if node.get('mate') else (b.turn==solver and not b.is_game_over(claim_draw=True))
   if 'checkSafety' in node:verify_safety(b,node['checkSafety'],solver,baseline,minimum)
   assert balance(b,solver)-baseline>=minimum
   maxdepth=max(maxdepth,used);return
  if key in seen:return
  seen.add(key);own=b.turn==solver
  if own:
   assert left>0 and 'move' in node
   moves=[chess.Move.from_uci(node['move'])]
  else:
   assert set(node['replies'])=={m.uci() for m in b.legal_moves}
   moves=[chess.Move.from_uci(u) for u in node['replies']]
  for m in moves:
   assert m in b.legal_moves
   b.push(m);visit(left-int(own),used+int(own),promoted or bool(own and m.promotion));b.pop()
 visit(r['solverMoves'],0,False)
 if bound is not None:assert maxdepth<=bound
class Split(unittest.TestCase):
 def test_level_a_expansion_preserves_approved_positions_and_source_games(self):
  bundle=read(AUDIT/'material-a-expansion.json')
  published=[e for e in read(DATA/'promotion-exercises.json')[0]['exercises'] if e.get('difficulty',{}).get('level')=='A']
  review=read(AUDIT/'material-a-editorial-review.json')
  self.assertEqual(len(published),review['actualCount'])
  self.assertEqual(len(review['reviews']),24)
  self.assertEqual(review['gap'],24-len(published))
  self.assertEqual(len(bundle['records']),8)
  expected={r['exercise']['fen'] for r in review['reviews'] if r['status']=='retained'}|{r['exercise']['fen'] for r in review['replacements']}
  self.assertEqual({e['fen'] for e in published},expected)
  for r in review['reviews']:
   if r['status']!='retained':self.assertNotIn(r['exercise']['fen'],expected)
  for r in review['replacements']:
   e=r['exercise'];verify(r['certificate'],e['promotionGain']['minimumGain'],2)
   self.assertEqual({x['uci'] for x in r['roots']},{m.uci() for m in chess.Board(e['fen']).legal_moves})
   for node in r['certificate']['nodes'].values():
    if 'gain' in node:self.assertIn('checkSafety',node)
  game_ids=set()
  for r in bundle['records']:
   e=r['exercise'];b=chess.Board(e['fen'])
   verify(r['certificate'],e['promotionGain']['minimumGain'],2)
   self.assertEqual({x['uci'] for x in r['rootReview']},{m.uci() for m in b.legal_moves})
   self.assertEqual(e['difficulty']['sacrificeCount'],0)
   g=r.get('sourceGame')
   if not g:continue
   self.assertNotIn(g['gameId'],game_ids);game_ids.add(g['gameId'])
   self.assertEqual(r['archive']['source'],g['source'])
   self.assertRegex(r['archive']['sha256'],r'^[a-f0-9]{64}$')
   board=chess.Board(g['gameFen'])
   for ply,san in enumerate(g['gameMoves']):
    if ply==g['ply']:self.assertEqual(board.fen(en_passant='fen'),e['fen'])
    if ply==g['ply']-1:self.assertEqual(dict(fen=board.fen(en_passant='fen'),move=san),g['previousMove'])
    board.push_san(san)
  self.assertEqual(len(game_ids),3)
 def test_followup_a_mechanisms_and_refutations(self):
  rows={e.get('id'):e for e in read(DATA/'promotion-exercises.json')[0]['exercises']}
  def board(suffix):return chess.Board(rows['promotion-a-master-'+suffix]['fen'])
  b=board('3758bfad170039f0');self.assertEqual(b.piece_at(chess.E1),chess.Piece(chess.KING,chess.WHITE))
  b.push_san('Rd1+');self.assertTrue(b.is_check());self.assertNotIn(chess.Move.from_uci('e1d1'),b.legal_moves)
  b=board('b26391c1f9174baa')
  for san in ['Nb1','Rxb1','axb1=Q+']:b.push_san(san)
  self.assertEqual(b.piece_at(chess.B1),chess.Piece(chess.QUEEN,chess.BLACK))
  b=board('bd38e1825a7c2cf0')
  for san in ['Rf4','Rf3']:b.push_san(san)
  self.assertFalse(b.is_check());b.push_san('Rxf3')
  b=board('1feb26cc76391e36');b.push_san('g1=Q+');self.assertIn(chess.Move.from_uci('f2g1'),b.legal_moves)
  b=board('1feb26cc76391e36')
  for san in ['Kh2','b7','g1=Q+']:b.push_san(san)
  self.assertNotIn(chess.Move.from_uci('f2g1'),b.legal_moves)
  review=read(AUDIT/'material-a-editorial-review.json')
  rejected=review['followupResearch']['rejectedAfterDetailedReview'][0]
  self.assertNotIn(rejected['exercise']['id'],rows)
 def test_new_real_game_c_and_d_positions_have_complete_proofs_and_sources(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  published=read(DATA/'promotion-exercises.json')[0]['exercises']
  byid={e['id']:e for e in published}
  expected={'promotion-c-twic-2cbfdfb39ae52d12':('C',2,2),'promotion-d-twic-50ff2f332addb371':('D',5,4),'promotion-c-twic-1661-tasdogen-rook-offer':('C',2,2),'promotion-c-nepo-queen-offer-capture-promotion':('C',2,2)}
  for r in review['advancedAdditions']:
   e=r['exercise']
   if e['id'] not in expected:continue
   level,moves,proof_moves=expected[e['id']]
   self.assertIn(e['id'],byid);self.assertEqual(e['difficulty']['level'],level)
   self.assertEqual(e['difficulty']['solverMoves'],moves)
   self.assertEqual(e['promotionGain']['solverMoves'],moves)
   self.assertEqual(e['difficulty']['sacrificeCount'],1)
   verify(r['certificate'],e['promotionGain']['minimumGain'],proof_moves)
   b=chess.Board(e['fen'])
   self.assertEqual({x['uci'] for x in r['rootReview']},{m.uci() for m in b.legal_moves})
   g=r['sourceGame'];self.assertEqual(e['gameReference']['id'],g['gameId'])
   self.assertRegex(g['archive']['sha256'],r'^[a-f0-9]{64}$')
   self.assertEqual(g['ply'],e['gameReference']['ply'])
   board=chess.Board(g['gameFen'])
   for ply,san in enumerate(g['gameMoves']):
    if ply==g['ply']:self.assertEqual(board.fen(en_passant='fen'),e['fen'])
    if ply==g['ply']-1:self.assertEqual({'fen':board.fen(en_passant='fen'),'move':san},e['previousMove'])
    board.push_san(san)
  self.assertEqual({e['id'] for e in published}&set(expected),set(expected))
 def test_nepo_queen_offer_covers_capture_promotion_and_declined_sacrifice(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  rows={e['id']:e for e in read(DATA/'promotion-exercises.json')[0]['exercises']}
  eid='promotion-c-nepo-queen-offer-capture-promotion';e=rows[eid]
  self.assertEqual(e['difficulty']['level'],'C')
  self.assertEqual(e['moves'],['Qe8+','Rxe8','fxe8=Q+','Kg7'])
  b=chess.Board(e['fen']);self.assertEqual(b.piece_at(chess.F8),chess.Piece(chess.KING,chess.BLACK));self.assertEqual(b.piece_at(chess.D8),chess.Piece(chess.ROOK,chess.BLACK))
  b.push_san('Qe8+');self.assertEqual({b.san(m) for m in b.legal_moves},{'Rxe8','Kg7'})
  b.push_san('Rxe8');b.push_san('fxe8=Q+');self.assertTrue(b.is_check())
  branch=chess.Board(e['fen']);branch.push_san('Qe8+');branch.push_san('Kg7');branch.push_san('f8=Q+');self.assertTrue(branch.is_check())
  addition=next(r for r in review['advancedAdditions'] if r['exercise']['id']==eid)
  self.assertEqual(addition['actualContinuation'],['Qe8+'])
  self.assertEqual(addition['sourceGame']['gameMoves'][addition['sourceGame']['ply']:],['Qe8+'])
  self.assertEqual(len(review['promotionFilterPilot']['resignationBeforePromotionReview']['rejections']),10)
  self.assertTrue(any(eid in x for x in review['advancedLevelScopeReview']['coverageChecklist']['C']['covered']))
 def test_rejected_routine_b_promotions_stay_excluded(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  exclusions=review['levelBExclusions'];self.assertEqual(len(exclusions),2)
  published=read(DATA/'promotion-exercises.json')[0]['exercises']
  approved={r['exercise']['fen'] for r in review['advancedAdditions'] if r['exercise']['difficulty']['level']=='B'}
  self.assertEqual(len(approved),10)
  self.assertEqual({e['fen'] for e in published if e.get('difficulty',{}).get('level')=='B'},approved)
  for r in review['advancedAdditions']:
   if r['exercise']['difficulty']['level']!='B':continue
   e=r['exercise'];b=chess.Board(e['fen'])
   self.assertFalse(b.is_check())
   self.assertEqual(e['difficulty']['solverMoves'],3)
   self.assertEqual(e['difficulty']['sacrificeCount'],0)
   self.assertEqual({x['uci'] for x in r['rootReview']},{m.uci() for m in b.legal_moves})
   self.assertTrue(r['sourceGame']['archive']['sha256'])
   self.assertEqual(e['gameReference']['id'],r['sourceGame']['gameId'])
   verify(r['certificate'],e['promotionGain']['minimumGain'],3)
  for r in exclusions:
   self.assertEqual(r['status'],'rejected');self.assertTrue(r['reason'])
   self.assertNotIn(r['fen'],{e['fen'] for e in published})
   b=chess.Board(r['fen'])
   for san in r['moves']:b.push_san(san)
  for r in review['advancedExclusions']:
   self.assertEqual(r['status'],'rejected');self.assertNotIn(r['fen'],{e['fen'] for e in published})
  for r in review['nonGameAdvancedExclusions']:
   self.assertEqual(r['status'],'source-ineligible');self.assertNotIn(r['fen'],{e['fen'] for e in published})
  for r in review['realGameExpansionReview']['reviewedExclusions']:
   self.assertEqual(r['status'],'excluded-from-B')
   self.assertNotIn(r['fen'],approved)
  for r in review['advancedLevelScopeReview']['reviewedLeads']:
   self.assertNotIn(r['fen'],{e['fen'] for e in published})
  sources=read(DATA/'promotion-game-sources.json')
  for e in published:
   if e.get('difficulty',{}).get('level') in ('B','C','C*','D'):
    ref=e.get('gameReference');self.assertIsNotNone(ref)
    self.assertEqual(ref['kind'],'game');self.assertIn(ref['id'],sources)
 def test_capture_minor_promotion_avoids_pat_after_check(self):
  rows={e['id']:e for e in read(DATA/'promotion-exercises.json')[0]['exercises'] if e.get('id')}
  e=rows['promotion-a-capture-minor-avoid-pat'];b=chess.Board(e['fen'])
  self.assertTrue(b.is_check());self.assertEqual(balance(b,b.turn),-300)
  for san in ['bxc8=Q','bxc8=R']:
   child=b.copy();child.push_san(san);self.assertTrue(child.is_stalemate())
  for san in ['bxc8=B','bxc8=N+']:
   child=b.copy();child.push_san(san);self.assertFalse(child.is_stalemate())
   self.assertEqual({m.uci() for m in child.legal_moves},{'a7a8','a7b8'})
  self.assertEqual(e['difficulty']['level'],'A')
 def test_check_evasion_candidate_is_excluded_at_the_next_game_turn(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  rejected=next(r for r in review['followupResearch']['rejectedAfterUserReview'] if r['exercise']['id']=='promotion-a-master-801d89d858fe67f2')
  e=rejected['exercise'];b=chess.Board(e['fen']);self.assertTrue(b.is_check())
  b.push_san('Kh1');b.push_san('Be3')
  self.assertEqual(b.turn,chess.WHITE);self.assertFalse(b.is_check())
  self.assertIn(b.parse_san('c8=Q+'),b.legal_moves)
  published={e.get('id') for e in read(DATA/'promotion-exercises.json')[0]['exercises']}
  self.assertNotIn(e['id'],published)
 def test_introductory_exchange_endpoints_keep_opposing_king_on_last_rank(self):
  ids={'promotion-beginner-capture-defender','promotion-beginner-capture-rook-checker','promotion-beginner-blocked-forward'}
  rows=[e for e in read(DATA/'promotion-exercises.json')[0]['exercises'] if e.get('id') in ids]
  self.assertEqual(len(rows),3)
  for e in rows:
   b=chess.Board(e['fen']);m=b.parse_san(e['moves'][0])
   self.assertTrue(e['beginner']);self.assertTrue(b.is_capture(m));self.assertTrue(m.promotion)
   self.assertEqual(chess.square_rank(b.king(not b.turn)),chess.square_rank(m.to_square))
   b.push(m);self.assertTrue(b.is_check());self.assertFalse(b.is_checkmate())
 def test_beginner_decisions_and_all_direct_replies(self):
  published=[e for e in read(DATA/'promotion-exercises.json')[0]['exercises'] if e.get('beginner')]
  candidates=read(AUDIT/'material-beginner-candidates.json')['candidates']
  review=read(AUDIT/'material-beginner-review.json')
  self.assertEqual(len(published),14)
  self.assertEqual(review['gap'],24-len(published))
  self.assertEqual(len({e['fen'] for e in published}),len(published))
  ids={e['id'] for e in published}
  for c in candidates:
   self.assertEqual(c['id'] in ids,c['status']=='accepted')
   b=chess.Board(c['fen'])
   self.assertEqual({r['move'] for r in c['engineScreen']['roots']},{b.san(m) for m in b.legal_moves})
   if c.get('mechanismCheck'):
    check=c['mechanismCheck'];move=b.parse_uci(c['uci'])
    self.assertTrue(b.is_capture(move))
    self.assertEqual(chess.square_rank(b.king(not b.turn)),chess.square_rank(move.to_square))
    b.push(move);self.assertEqual(b.fen(),check['afterPromotion'])
    recapture=chess.Move.from_uci(check['forbiddenRecapture'])
    self.assertNotIn(recapture,b.legal_moves)
    b.remove_piece_at(chess.parse_square(check['removeSupportingPiece']))
    self.assertEqual(b.fen(),check['withoutSupport']);self.assertIn(recapture,b.legal_moves)
  for e in published:
   b=chess.Board(e['fen']);color=b.turn;baseline=balance(b,color)
   for m in list(b.legal_moves):
    child=b.copy();child.push(m)
    self.assertFalse(child.is_checkmate(),(e['id'],m))
    if not m.promotion and b.is_capture(m):
     gains=[]
     for reply in child.legal_moves:
      end=child.copy();end.push(reply);gains.append(balance(end,color)-baseline)
     self.assertTrue(gains and min(gains)<=0,(e['id'],m))
   m=b.parse_san(e['moves'][0]);self.assertTrue(m.promotion);b.push(m)
   self.assertFalse(b.is_game_over())
   for reply in list(b.legal_moves):
    child=b.copy();child.push(reply)
    self.assertFalse(child.is_game_over())
    self.assertGreaterEqual(balance(child,color)-baseline,400)
    self.assertEqual(child.piece_at(m.to_square),chess.Piece(m.promotion,color))
 def test_material_certificates(self):
  rows=read(DATA/'promotion-exercises.json')[0]['exercises'];certs={r['fen']:r for r in read(AUDIT/'material-certificates.json')}
  for e in rows:
   self.assertEqual(e['goal'],'material');self.assertNotEqual(e['outcome'],'checkmate')
   if e.get('promotionGain'):verify(certs[e['fen']],e['promotionGain']['minimumGain'],e['promotionGain']['solverMoves'])
 def test_underpromotion_fork(self):
  r=read(AUDIT/'underpromotion-fork.json');e=r['exercise'];verify(r['certificate'],800,2)
  for piece in ['q','r','b']:
   b=chess.Board(e['fen']);b.push_uci('c7c8'+piece);b.push_san('Qg1#');self.assertTrue(b.is_checkmate())
 def test_all_pages_legal_objectives_and_local_replay(self):
  for slug in ['promotion','underpromotion','passed-pawn-simplification','promotion-mate']:
   sources=read(DATA/(slug+'-game-sources.json'))
   for e in read(DATA/(slug+'-exercises.json'))[0]['exercises']:
    b=chess.Board(e['fen']);self.assertTrue(b.is_valid())
    for san in e['moves']:b.push_san(san)
    if slug=='promotion-mate':self.assertEqual(e['goal'],'checkmate');self.assertTrue(b.is_checkmate())
    if slug=='passed-pawn-simplification':self.assertEqual(e['goal'],'win')
    ref=e.get('gameReference')
    if ref:
     self.assertEqual(ref['collection'],slug);source=sources[ref['id']];g=chess.Board(source['fen'])
     for san in source['lines'][0][:ref['ply']]:g.push_san(san)
     self.assertEqual(g.fen(en_passant='fen'),e['fen'])
     for san in source['lines'][0][ref['ply']:]:g.push_san(san)
 def test_passed_pawns_are_not_incidental_to_endpoint_win(self):
  rows=read(AUDIT/'passed-pawn-importance.json');accepted={r['fen']:r for r in rows if r['accepted']}
  for e in read(DATA/'passed-pawn-simplification-exercises.json')[0]['exercises']:
   r=accepted[e['fen']];self.assertTrue(r['passedPawns'])
   solver=chess.Board(e['fen']).turn;end=chess.Board(r['endFen'])
   category=r['withoutPassersCategory'];stillwins=category in ['win','cursed-win'] if end.turn==solver else category in ['loss','blessed-loss']
   self.assertFalse(stillwins)
 def test_giri_pawn_race_and_necessary_root_choice_are_preserved(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  record=next(r for r in review['advancedAdditions'] if r['exercise']['id']=='promotion-b-giri-nihal-rook-exchange-pawn-race')
  e=record['exercise'];b=chess.Board(e['fen'])
  self.assertEqual(b.turn,chess.BLACK);self.assertFalse(b.is_check())
  self.assertEqual(e['moves'],['Rxb7+','Kxb7','f2','b6','f1=Q','Kc8'])
  self.assertEqual(record['actualContinuation'],e['moves'][:-1])
  self.assertEqual(record['verifiedAnalysisContinuation'],['Kc8'])
  self.assertEqual(record['sourceGame']['ply'],155)
  self.assertEqual(record['sourceGame']['previousMove']['move'],'Rxb7')
  self.assertEqual({r['uci'] for r in record['rootReview']},{m.uci() for m in b.legal_moves})
  self.assertGreater(next(r['cp'] for r in record['rootReview'] if r['san']=='Rxb7+'),400)
  self.assertLess(next(r['cp'] for r in record['rootReview'] if r['san']=='f2'),0)
  verify(record['certificate'],e['promotionGain']['minimumGain'],3)
  checklist=review['advancedLevelScopeReview']['coverageChecklist']['B']
  self.assertIn(e['id'],next(r['coveredBy'] for r in checklist if r['aspect']=='Checking rook exchange before a pawn race'))
  excluded=next(r for r in review['advancedLevelScopeReview']['reviewedLeads'] if r['gameId']=='f532c4f8d5111b5c')
  self.assertEqual(excluded['status'],'excluded-stronger-promotion-alternative')
  direct=chess.Board(excluded['fen'])
  for san in excluded['competingLine']['moves']:direct.push_san(san)
  self.assertEqual(excluded['competingLine']['materialGain'],400)
  self.assertNotIn(excluded['fen'],{x['fen'] for x in read(DATA/'promotion-exercises.json')[0]['exercises']})
  self.assertEqual(excluded['sourceGame']['archive']['sha256'],'4d26460db840c7e749c85f30fceb17783956fe396941465f18b68009e3c722cd')
  rejected={r['gameId']:r for r in review['advancedLevelScopeReview']['reviewedLeads'] if r.get('status')=='excluded-already-winning'}
  for game_id in ('603065f0a76bfde3','f5d0bf1b87627194'):
   r=rejected[game_id];self.assertIn('sacrifice',r['reason'])
   self.assertEqual(r['certificateReview']['status'],'passed-bounded-material-certificate')
   self.assertEqual(r['allRootScreen']['nodesPerLegalMove'],600000)
   b=chess.Board(r['fen']);self.assertEqual({x['uci'] for x in r['allRootScreen']['roots']},{m.uci() for m in b.legal_moves})
   source=r['sourceGame'];self.assertEqual(len(source['archiveSha256']),64)
   b=chess.Board(source['gameFen'])
   for san in source['moves'].split()[:source['ply']]:b.push_san(san)
   self.assertEqual(b.fen(en_passant='fen'),r['fen'])
   self.assertNotIn(r['fen'],{x['fen'] for x in read(DATA/'promotion-exercises.json')[0]['exercises']})
 def test_twic_rook_attack_opens_promotion_file(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  e=next(x for x in read(DATA/'promotion-exercises.json')[0]['exercises'] if x['id']=='promotion-b-twic1668-kolla-wiegmann-rook-attack')
  self.assertEqual(e['difficulty']['level'],'B');self.assertEqual(e['moves'],['Rb4','Rxb4','cxb4','h2','b8=Q+','Kg7'])
  b=chess.Board(e['fen']);self.assertEqual(b.turn,chess.WHITE);self.assertFalse(b.is_check());self.assertEqual(balance(b,b.turn),0)
  record=next(r for r in review['advancedAdditions'] if r['exercise']['id']==e['id'])
  self.assertEqual(record['startingBalance'],0);self.assertEqual(record['sourceGame']['archive']['sha256'],'d455919e2736370933e89e106c114a348807cc26acae4bd4b9b78ade35bcdf4e')
  self.assertEqual(record['sourceGame']['ply'],96);self.assertEqual(record['sourceGame']['previousMove']['move'],'Rb1')
  self.assertEqual(record['actualContinuation'],e['moves']+['Qxh2'])
  self.assertEqual({r['uci'] for r in record['rootReview']},{m.uci() for m in b.legal_moves})
  self.assertEqual(max(record['rootReview'],key=lambda r:r['cp'])['san'],'Rb4')
  self.assertGreater(next(r['cp'] for r in record['rootReview'] if r['san']=='Rb4'),500)
  self.assertLess(next(r['cp'] for r in record['rootReview'] if r['san']=='b8=Q+'),0)
  self.assertFalse(any(r['mate'] and r['mate']>0 for r in record['rootReview']))
  verify(record['certificate'],e['promotionGain']['minimumGain'],3)
  checklist=review['advancedLevelScopeReview']['coverageChecklist']['B']
  self.assertIn(e['id'],next(x['coveredBy'] for x in checklist if x['aspect']=='Attack the rook that can stop promotion; pawn recapture clears the promotion file'))
  source=read(DATA/'promotion-game-sources.json')[record['sourceGame']['gameId']]
  self.assertEqual(source['kind'],'game')
  b=chess.Board(source['fen'])
  for san in source['lines'][0][:record['sourceGame']['ply']]:b.push_san(san)
  self.assertEqual(b.fen(en_passant='fen'),e['fen'])
 def test_level_b_promotion_rule_covers_defended_squares_and_distinct_gaps(self):
  review=read(AUDIT/'material-a-editorial-review.json')
  scope=review['advancedLevelScopeReview'];rule=scope['levelBEditorialRule']
  self.assertIn('non-sacrificial',rule['definition'])
  self.assertTrue(any('Compare straight advance' in item for item in rule['include']))
  self.assertTrue(any('capture-promotion' in item and 'defended' in item for item in rule['exclude']))
  checklist=scope['coverageChecklist']['B']
  gaps={item['aspect'] for item in checklist if item.get('status')=='gap'}
  self.assertIn('Block a defender’s line without a material sacrifice',gaps)
  self.assertIn('Compare a straight advance with capture-promotion when the promotion square is defended or the new piece can be captured',gaps)
  published={e['id'] for e in read(DATA/'promotion-exercises.json')[0]['exercises']}
  for item in checklist:
   for exercise_id in item.get('coveredBy',[]):self.assertIn(exercise_id,published)
if __name__=='__main__':unittest.main()
