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
items[0]['id']='promotion-beginner-avoid-stalemate'
items[1]['id']='promotion-beginner-safe-advance'
items.append(dict(id='promotion-beginner-capture-defender',title='Bắt quân để phong cấp',prompt='Phong cấp và giữ lợi thế vật chất.',mode='interactive',goal='material',outcome='promotion',beginner=True,fen='1r6/P7/7k/8/8/8/8/K7 w - - 0 1',moves=['axb8=Q','Kg5'],alternativeLines=[['axb8=R','Kg5']],source='Thế cờ biên soạn.',hints=['So sánh a8 và axb8: Xe đen có thể bắt quân mới ở ô nào?','Bắt Xe trên b8 đồng thời phong cấp.'],solution='axb8=Q — Tốt từ a7 bắt Xe ở b8 và phong cấp thành Hậu. Nếu đi a8=Q, Đen có thể bắt Hậu bằng Rxa8+. Phong Xe trên b8 cũng đạt mục tiêu.',promotionMaterial=dict(minimumGain=4)))
values={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:0}
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
   replies.append(dict(move=replysan,gain=material(d)-baseline,terminal=d.is_game_over()))
  if not move.promotion:assert not capture
  roots.append(dict(move=san,promotion=bool(move.promotion),capture=capture,replies=replies,terminal=c.is_game_over()))
 for line in [e['moves']]+e.get('alternativeLines',[]):
  r=next(r for r in roots if r['move']==line[0]);assert not r['terminal'] and r['replies']
  assert all(x['gain']>=4 and not x['terminal'] for x in r['replies'])
  c=b.copy()
  for san in line:c.push_san(san)
 audits.append(dict(id=e['id'],fen=e['fen'],moves=e['moves'],roots=roots))
previous=json.loads((DATA/'material-intro.json').read_text())
reviewpath=DATA/'material-beginner-review.json'
exclusions=json.loads(reviewpath.read_text())['exclusions'] if reviewpath.exists() else [dict(fen=e['fen'],moves=e['moves'],reason='Equivalent unopposed safe promotion; shifted kings or reversed colors add no distinct decision.') for e in previous if e['fen'] not in {x['fen'] for x in items}]
save(DATA/'material-intro.json',items)
save(reviewpath,dict(positions=audits,exclusions=exclusions,target=24,count=len(items)))
print('material Beginner',len(items))
