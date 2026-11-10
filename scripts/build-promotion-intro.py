"""Sparse promotion drills: retained material or immediate mate.

All legal roots are enumerated. Material drills have only two kings and a pawn,
retain >=4 points after every legal reply, and contain no immediate mating root.
"""
import importlib.util,random,json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(1110126);items=[];audits=[];seen=set();names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
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
add(chess.Board('8/1P6/k7/8/1K6/8/8/8 w - - 0 1'),['b8=R','Ka7'],'material',[],'rook-avoids-stalemate')
for attempt in range(20000):
 b=chess.Board(None);b.set_piece_at(rng.choice(range(48,56)),chess.Piece(chess.PAWN,True))
 for symbol in 'Kk':b.set_piece_at(rng.choice([s for s in chess.SQUARES if not b.piece_at(s)]),chess.Piece.from_symbol(symbol))
 if len(items)%2:b=b.mirror()
 if not b.is_valid() or b.is_game_over() or b.board_fen() in seen:continue
 legal=list(b.legal_moves);mate=False;branches=[]
 for move in legal:
  child=b.copy();child.push(move)
  if child.is_checkmate():mate=True
  if not move.promotion or move.promotion not in [chess.QUEEN,chess.ROOK] or child.is_game_over():continue
  replies=list(child.legal_moves)
  if all(not (reply.to_square==move.to_square and child.is_capture(reply)) for reply in replies):branches.append([b.san(move),child.san(replies[0])])
 if not mate and branches:add(b,branches[0],'material',branches[1:],'safe-promotion')
 if len(items)==8:break
assert len(items)==8
# Knight promotion: quiet arrival and capture. Queen/rook/bishop do not check.
for fen in ['8/5P1k/8/5K2/6R1/2B5/8/8 w - - 0 1','5b2/4P2k/8/5K2/6R1/2B5/8/8 w - - 0 1']:
 # Canonical supporting pieces on g6/c3/f5; king h7.
 b=chess.Board('8/5P1k/6R1/5K2/8/2B5/8/8 w - - 0 1' if fen.startswith('8') else '5b2/4P2k/6R1/5K2/8/2B5/8/8 w - - 0 1')
 if len(items)%2:b=b.mirror()
 mateMoves=[]
 for move in b.legal_moves:
  c=b.copy();c.push(move)
  if c.is_checkmate():mateMoves.append(move)
 selected=next(x for x in mateMoves if x.promotion==chess.KNIGHT)
 assert all(x.promotion for x in mateMoves)
 add(b,[b.san(selected)],'checkmate',[[b.san(x)] for x in mateMoves if x!=selected],'knight-mate')
quotas={chess.QUEEN:8,chess.ROOK:3,chess.BISHOP:3};counts={x:0 for x in quotas}
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
m.save(m.DATA/'composed.json',[dict(id='promotion',title='Phong cấp',description='Chọn quân phong cấp và khai thác sức mạnh của quân mới. Mục tiêu của từng thế được ghi trước khi giải.',exercises=items)])
m.save(m.DATA/'beginner-review.json',audits);print('Beginner',len(items),counts)
