"""Generate sparse Arabian mate introductions and enumerate every legal mate."""
import importlib.util,json,random
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-arabian-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(301026);items=[];audits=[];seen=set()
for attempt in range(20000):
 b=chess.Board(None);b.turn=chess.WHITE
 b.set_piece_at(chess.H8,chess.Piece(chess.KING,chess.BLACK));b.set_piece_at(chess.F6,chess.Piece(chess.KNIGHT,chess.WHITE))
 squares=rng.sample([s for s in chess.SQUARES if s not in [chess.H8,chess.F6]],2)
 b.set_piece_at(squares[0],chess.Piece(chess.KING,chess.WHITE));b.set_piece_at(squares[1],chess.Piece(chess.ROOK,chess.WHITE))
 # Every third exercise asks the rook to capture a blocker on its mating square.
 if attempt%3==0:
  target=rng.choice([chess.G8,chess.H7])
  if not b.piece_at(target):b.set_piece_at(target,chess.Piece(rng.choice([chess.BISHOP,chess.KNIGHT,chess.ROOK]),chess.BLACK))
 if not b.is_valid() or b.is_game_over():continue
 if len(items)%2:b=b.mirror()
 if len(items)%4>1:b=b.transform(chess.flip_horizontal)
 if b.board_fen() in seen:continue
 mates=[]
 for move in b.legal_moves:
  shape=m.inspect(b,[move])
  if shape:mates.append((move,shape))
 if not mates:continue
 move,shape=mates[0];seen.add(b.board_fen());n=len(items)+1
 piece=b.piece_at(move.from_square);end=shape['endFen'];rook=shape['rookRoles'][0]['square'];knight=shape['knightRoles'][0]['square']
 items.append(dict(title=f'Arabian Mate · Bài {n}',prompt='Phối hợp Xe và Mã để chiếu hết trong một nước.',mode='interactive',outcome='checkmate',goal='checkmate',beginner=True,fen=b.fen(),moves=shape['moves'],source='Thế cờ biên soạn.',hints=['Mã bảo vệ ô mà Xe có thể đến để chiếu.','Tìm nước chiếu của Xe, rồi kiểm tra mọi ô thoát của Vua.'],solution=f"{shape['moves'][0]} — Xe từ {chess.square_name(move.from_square)} đến {chess.square_name(move.to_square)}"+(', bắt quân và chiếu hết.' if b.is_capture(move) else ', chiếu hết.')+f' Mã ở {knight} bảo vệ Xe ở {rook} và khống chế ô thoát của Vua.'))
 audits.append(dict(id=f'arabian-beginner-{n}',fen=b.fen(),moves=shape['moves'],alternatives=[b.san(x[0]) for x in mates],roles=shape,method='Every legal starting move enumerated; actual checkmate; removal of either essential rook/knight breaks mate.'))
 if n==24:break
assert len(items)==24
m.DATA.mkdir(exist_ok=True)
m.save(m.DATA/'composed.json',[dict(id='arabian-mate',title='Chiếu hết kiểu Arabian',description='Xe chiếu hết Vua trong góc; Mã bảo vệ Xe và khống chế ô thoát.',exercises=items)])
m.save(m.DATA/'beginner-review.json',audits)
print('Beginner',len(items))
