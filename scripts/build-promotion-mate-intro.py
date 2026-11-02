"""Sparse promotion drills: retained material or immediate mate.

All legal roots are enumerated. Material drills have only two kings and a pawn,
retain >=4 points after every legal reply, and contain no immediate mating root.
"""
import importlib.util,random,json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(1110126);items=[e for e in json.load(open(ROOT/'scripts/fixtures/promotion-split/original-mixed.json'))[0]['exercises'] if e.get('beginner') and e['goal']=='checkmate'];audits=[];seen={chess.Board(e['fen']).board_fen() for e in items};names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
def add(b,moves,goal,alternatives,kind):
 n=len(items)+1;move=b.parse_san(moves[0]);piece=names[chess.piece_symbol(move.promotion).upper()]
 e=dict(title=f'Phong cấp · Bài {n}',prompt='Phong cấp ngay và giữ lợi thế vật chất.' if goal=='material' else 'Phong cấp để chiếu hết trong một nước.',mode='interactive',goal=goal,outcome='promotion' if goal=='material' else 'checkmate',beginner=True,fen=b.fen(),moves=moves,alternativeLines=alternatives,source='Thế cờ biên soạn.',hints=['Kiểm tra ô phong cấp và các quân có thể bắt quân mới.','Xét Hậu, Xe, Tượng và Mã; chọn quân đạt mục tiêu của bài.'],solution=f'{moves[0]} — Tốt từ {chess.square_name(move.from_square)} đến {chess.square_name(move.to_square)}'+(', bắt quân' if b.is_capture(move) else '')+f', phong cấp thành {piece}'+(', chiếu hết.' if goal=='checkmate' else '. Quân mới không bị bắt trong nước đáp.'))
 if goal=='material':
  e['promotionMaterial']=dict(minimumGain=4)
  queen=chess.Move(move.from_square,move.to_square,promotion=chess.QUEEN)
  q=b.copy()
  if queen in q.legal_moves:
   q.push(queen)
   if q.is_stalemate():e['solution']+=' Phong Hậu dẫn đến hòa do hết nước đi (pat); phong Xe giữ được lợi thế vật chất.'
 items.append(e)
 audit=dict(id=f'promotion-beginner-{n}',fen=b.fen(),moves=moves,alternatives=alternatives,kind=kind,method='All legal roots and all direct defensive replies enumerated.')
 if goal=='material':
  options=[];values={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:0};color=b.turn
  def material(x):return sum(values[p.piece_type]*(1 if p.color==color else -1) for p in x.piece_map().values())
  baseline=material(b)
  for candidate in b.legal_moves:
   if not candidate.promotion:continue
   child=b.copy();san=b.san(candidate);child.push(candidate);replies=[]
   for reply in child.legal_moves:
    tail=child.copy();replySan=tail.san(reply);tail.push(reply);replies.append(dict(move=replySan,fen=tail.fen(),gain=material(tail)-baseline,gameOver=tail.is_game_over()))
   options.append(dict(move=san,stalemate=child.is_stalemate(),insufficientMaterial=child.is_insufficient_material(),replies=replies))
  audit['promotionOptions']=options
 audits.append(audit);seen.add(b.board_fen())
quotas={chess.QUEEN:8,chess.ROOK:0,chess.BISHOP:0};counts={x:0 for x in quotas}
for attempt in range(100000):
 b=chess.Board(None);b.set_piece_at(rng.choice(range(48,56)),chess.Piece(chess.PAWN,True))
 for symbol in rng.choice(['KkR','KkB','KkN','KkRB','KkRN','KkNp']):
  squares=[s for s in chess.SQUARES if not b.piece_at(s) and (symbol.lower()!='p' or chess.square_rank(s) not in [0,7])];b.set_piece_at(rng.choice(squares),chess.Piece.from_symbol(symbol))
 if len(items)%2:b=b.mirror()
 if not b.is_valid() or b.is_game_over() or b.board_fen() in seen:continue
 mates=[];bypass=False
 for move in b.legal_moves:
  c=b.copy();c.push(move)
  if c.is_checkmate():
   if not move.promotion:bypass=True
   else:mates.append(move)
 if bypass:continue
 selected=next((x for x in mates if x.promotion in quotas and counts[x.promotion]<quotas[x.promotion]),None)
 if not selected:continue
 counts[selected.promotion]+=1;add(b,[b.san(selected)],'checkmate',[[b.san(x)] for x in mates if x!=selected],'promotion-mate')
 if len(items)==24:break
assert len(items)==24

for i,e in enumerate(items):e['title']='Phong cấp chiếu hết · Bài '+str(i+1)
m.save(ROOT/'scripts/fixtures/promotion-split/mate-intro.json',items)
print('mate Beginner',len(items))
