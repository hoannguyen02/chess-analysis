"""Curated Beginner decisions; no quota padding by board transformations."""
import json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'scripts/fixtures/promotion-split'
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
old=json.loads((DATA/'original-mixed.json').read_text())[0]['exercises']
old=[e for e in old if e.get('promotionMaterial')]
items=[old[0],old[1]]
items[0]['id']='promotion-beginner-avoid-stalemate' # Preserve the stable identifier.
items[0].pop('beginner',None)
items[0]['difficulty']=dict(level='A',status='suggested',solverMoves=1,sacrificeCount=0,reason='Chọn quân phong cấp để tránh pat; nội dung từ cấp A.')
items[1]['id']='promotion-beginner-safe-advance'
items.append(dict(id='promotion-beginner-capture-defender',title='Bắt quân để phong cấp',prompt='Phong cấp và giữ lợi thế vật chất.',mode='interactive',goal='material',outcome='promotion',beginner=True,fen='1r5k/P7/8/8/8/8/8/K7 w - - 0 1',moves=['axb8=Q+','Kh7'],alternativeLines=[['axb8=R+','Kh7']],source='Thế cờ biên soạn.',hints=['So sánh a8 và axb8: Xe đen có thể bắt quân mới ở ô nào?','Bắt Xe trên b8 đồng thời phong cấp.'],solution='axb8=Q+ — Tốt từ a7 bắt Xe ở b8, phong cấp thành Hậu và chiếu Vua trên hàng 8. Nếu đi a8=Q, Đen có thể bắt Hậu bằng Rxa8+. Phong Xe trên b8 cũng đạt mục tiêu.',promotionMaterial=dict(minimumGain=4)))
values={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:0}
names={chess.PAWN:'Tốt',chess.KNIGHT:'Mã',chess.BISHOP:'Tượng',chess.ROOK:'Xe',chess.QUEEN:'Hậu'}
candidates=json.loads((DATA/'material-beginner-candidates.json').read_text())['candidates']
coverage={}
for candidate in candidates:
 if candidate['status']!='accepted':continue
 b=chess.Board(candidate['fen']);move=chess.Move.from_uci(candidate['uci']);san=b.san(move)
 origin=chess.square_name(move.from_square);destination=chess.square_name(move.to_square)
 captured=b.piece_at(move.to_square)
 description=f'Tốt từ {origin} '+(f'bắt {names[captured.piece_type]} ở {destination}' if captured else f'đến {destination}')+', phong cấp thành Hậu.'
 b.push(move)
 # Prefer a King reply for an introductory sample, without calling it forced.
 reply=sorted(b.legal_moves,key=lambda m:(b.piece_at(m.from_square).piece_type!=chess.KING,m.uci()))[0]
 items.append(dict(id=candidate['id'],title=candidate['title'],prompt='Phong cấp, giữ quân mới và giành lợi thế vật chất.',mode='interactive',goal='material',outcome='promotion',beginner=True,fen=candidate['fen'],moves=[san,b.san(reply)],alternativeLines=[],source='Thế cờ biên soạn.',hints=['Kiểm tra ô phong cấp và các quân có thể bắt quân mới.',candidate['reason']],solution=f'{san} — {description} '+candidate['reason'],promotionMaterial=dict(minimumGain=4,retainPromotedPiece=True)))
 coverage[candidate['id']]=candidate['reviewReason']
audits=[]
for e in items:
 b=chess.Board(e['fen']);assert b.is_valid();color=b.turn
 def material(x):return sum(values[p.piece_type]*(1 if p.color==color else -1) for p in x.piece_map().values())
 baseline=material(b);roots=[]
 for move in list(b.legal_moves):
  c=b.copy();san=b.san(move);capture=b.is_capture(move);c.push(move)
  assert not c.is_checkmate(),(e['id'],san)
  replies=[]
  for reply in list(c.legal_moves):
   d=c.copy();replysan=c.san(reply);d.push(reply)
   replies.append(dict(move=replysan,gain=material(d)-baseline,terminal=d.is_game_over(),retainsPromotion=bool(move.promotion and d.piece_at(move.to_square)==chess.Piece(move.promotion,color))))
  # A capture bypassing promotion must have an effective defensive reply.
  if not move.promotion and capture:assert replies and min(x['gain'] for x in replies)<=0,(e['id'],san)
  roots.append(dict(move=san,promotion=bool(move.promotion),capture=capture,replies=replies,terminal=c.is_game_over()))
 for line in [e['moves']]+e.get('alternativeLines',[]):
  r=next(r for r in roots if r['move']==line[0]);assert not r['terminal'] and r['replies']
  assert all(x['gain']>=4 and not x['terminal'] for x in r['replies'])
  if e['promotionMaterial'].get('retainPromotedPiece'):assert all(x['retainsPromotion'] for x in r['replies'])
  c=b.copy()
  for san in line:c.push_san(san)
 audits.append(dict(id=e['id'],fen=e['fen'],moves=e['moves'],roots=roots,decision=coverage.get(e['id'],'Previously reviewed introductory decision.')))
previous=json.loads((DATA/'material-intro.json').read_text())
reviewpath=DATA/'material-beginner-review.json'
exclusions=json.loads(reviewpath.read_text())['exclusions'] if reviewpath.exists() else [dict(fen=e['fen'],moves=e['moves'],reason='Equivalent unopposed safe promotion; shifted kings or reversed colors add no distinct decision.') for e in previous if e['fen'] not in {x['fen'] for x in items}]
save(DATA/'material-intro.json',items)
count=sum(bool(e.get('beginner')) for e in items)
save(reviewpath,dict(positions=audits,exclusions=exclusions,target=24,count=count,gap=max(0,24-count),candidateDecisions=[dict(id=c['id'],fen=c['fen'],status=c['status'],reason=c['reviewReason']) for c in candidates]))
print('material Beginner',sum(bool(e.get('beginner')) for e in items))
