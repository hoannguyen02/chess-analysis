"""Generate sparse Anastasia mate introductions and enumerate every legal mate."""
import importlib.util,json,random
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-anastasia-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(301026);items=[];audits=[];seen=set()
for attempt in range(20000):
 b=chess.Board(None);b.turn=chess.WHITE
 b.set_piece_at(chess.H7,chess.Piece(chess.KING,chess.BLACK));b.set_piece_at(chess.E7,chess.Piece(chess.KNIGHT,chess.WHITE))
 b.set_piece_at(chess.G7,chess.Piece(chess.PAWN,chess.BLACK))
 squares=rng.sample([s for s in chess.SQUARES if s not in [chess.H7,chess.E7,chess.G7]],2)
 b.set_piece_at(squares[0],chess.Piece(chess.KING,chess.WHITE));b.set_piece_at(squares[1],chess.Piece(chess.ROOK,chess.WHITE))
 # Every third exercise asks the rook to capture a blocker on its mating square.
 if attempt%3==0:
  target=rng.choice([chess.G8,chess.H7])
  if not b.piece_at(target):b.set_piece_at(target,chess.Piece(rng.choice([chess.BISHOP,chess.KNIGHT,chess.ROOK]),chess.BLACK))
 if not b.is_valid() or b.is_game_over():continue
 if len(items)%2:b=b.mirror()
 if len(items)%4>1:b=b.transform(chess.flip_horizontal)
 if b.board_fen() in seen:continue
 mates=[];bypass=False
 for move in b.legal_moves:
  shape=m.inspect(b,[move])
  child=b.copy();child.push(move)
  if child.is_checkmate() and not shape:bypass=True
  if shape and b.piece_type_at(move.from_square)==chess.ROOK:mates.append((move,shape))
 if not mates or bypass:continue
 move,shape=mates[0];seen.add(b.board_fen());n=len(items)+1
 piece=b.piece_at(move.from_square);end=shape['endFen'];rook=shape['rookRoles'][0]['square'];knight=shape['knightRoles'][0]['square']
 items.append(dict(title=f'Anastasia Mate · Bài {n}',prompt='Phối hợp Xe và Mã để chiếu hết trong một nước.',mode='interactive',outcome='checkmate',goal='checkmate',beginner=True,fen=b.fen(),moves=shape['moves'],source='Thế cờ biên soạn.',hints=['Mã khống chế hai ô thoát; Tốt đối phương chắn ô còn lại.','Tìm nước chiếu của Xe, rồi kiểm tra mọi ô thoát của Vua.'],solution=f"{shape['moves'][0]} — Xe từ {chess.square_name(move.from_square)} đến {chess.square_name(move.to_square)}"+(', bắt quân và chiếu hết.' if b.is_capture(move) else ', chiếu hết.')+f" Mã ở {knight} khống chế hai ô thoát; Tốt ở {shape['blockerSquare']} chắn đường thoát còn lại."))
 audits.append(dict(id=f'anastasia-beginner-{n}',fen=b.fen(),moves=shape['moves'],alternatives=[b.san(x[0]) for x in mates],roles=shape,method='Every legal starting move enumerated; actual checkmate; removal of either essential rook/knight breaks mate.'))
 if n==24:break
assert len(items)==24
m.DATA.mkdir(exist_ok=True)
m.save(m.DATA/'composed.json',[dict(id='anastasia-mate',title='Chiếu hết kiểu Anastasia',description='Xe chiếu dọc mép bàn cờ; Mã khóa hai ô thoát và Tốt đối phương chắn ô còn lại.',exercises=items)])
m.save(m.DATA/'beginner-review.json',audits)
print('Beginner',len(items))
