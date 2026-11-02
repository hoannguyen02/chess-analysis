"""Check objective separation, all-defence material certificates and local replay."""
import collections,json,unittest
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'src/lib/server'; AUDIT=ROOT/'scripts/fixtures/promotion-split'
def read(p):return json.loads(p.read_text())
def balance(b,c):
 values={chess.PAWN:100,chess.KNIGHT:320,chess.BISHOP:330,chess.ROOK:500,chess.QUEEN:900,chess.KING:0}
 return sum(values[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def verify(r,minimum=100,bound=None):
 b=chess.Board(r['fen']);solver=b.turn;baseline=balance(b,solver);seen=set();maxdepth=0
 def visit(left,used,promoted):
  nonlocal maxdepth
  key=b.fen(en_passant='fen')+'|'+str(left);node=r['nodes'][key]
  if 'gain' in node:
   assert promoted and b.turn==solver and not b.is_game_over(claim_draw=True)
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
if __name__=='__main__':unittest.main()
