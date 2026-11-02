"""Sparse mate-in-one compositions with an essential supporting rook."""
import importlib.util,json,random
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-queen-rook-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(271026);exercises=[];audits=[];seen=set();counts={True:0,False:0}
for attempt in range(100000):
 b=chess.Board(None)
 for sq,symbol in zip(rng.sample(range(64),4),'KkQR'):b.set_piece_at(sq,chess.Piece.from_symbol(symbol))
 if not b.is_valid() or b.is_game_over():continue
 if attempt%2:b=b.mirror()
 if counts[b.turn]>=10 or b.board_fen() in seen:continue
 alternatives=[];shape=None
 for move in list(b.legal_moves):
  candidate=m.inspect(b,[move])
  if candidate:alternatives.append(b.san(move));shape=candidate
 if not shape:continue
 counts[b.turn]+=1;seen.add(b.board_fen());n=len(exercises)+1
 exercises.append(dict(title=f'Hậu và Xe phối hợp · Bài {n}',prompt='Phối hợp Hậu và Xe để chiếu hết trong một nước.',mode='interactive',outcome='checkmate',goal='checkmate',beginner=True,fen=b.fen(),moves=shape['moves'],hints=['Tìm ô Hậu có thể chiếu, đồng thời được Xe bảo vệ hoặc được Xe hỗ trợ khóa đường thoát.','Kiểm tra mọi ô thoát và xem Vua đối phương có thể bắt Hậu không.'],solution='Hậu chiếu hết với Xe hỗ trợ ở '+shape['rookRoles'][0]['square']+'. Nhánh mẫu: '+shape['moves'][0]+'.'))
 audits.append(dict(fen=b.fen(),moves=shape['moves'],alternatives=alternatives,queenRoles=shape['queenRoles'],rookRoles=shape['rookRoles'],method='Exhaustive legal one-move enumeration; actual checkmate and essential-rook removal test.'))
 if len(exercises)==20:break
assert len(exercises)==20
m.save(m.DATA/'composed.json',[dict(id='queen-rook-mate',title='Chiếu hết bằng Hậu và Xe',description='Phối hợp Hậu và Xe để bảo vệ quân chiếu và khóa các ô thoát.',exercises=exercises)])
m.save(m.DATA/'validation.json',audits)
print(counts)
