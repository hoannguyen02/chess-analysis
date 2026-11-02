"""Sparse mate-in-one compositions with an essential rook and bishop."""
import importlib.util,json,random
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-rook-bishop-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(271026);exercises=[];audits=[];seen=set();counts={True:0,False:0}
for attempt in range(100000):
 b=chess.Board(None)
 for sq,symbol in zip(rng.sample(range(64),4),'KkRB'):b.set_piece_at(sq,chess.Piece.from_symbol(symbol))
 if not b.is_valid() or b.is_game_over():continue
 if attempt%2:b=b.mirror()
 if counts[b.turn]>=10 or b.board_fen() in seen:continue
 alternatives=[];shape=None
 for move in list(b.legal_moves):
  candidate=m.inspect(b,[move])
  if candidate:alternatives.append(b.san(move));shape=candidate
 if not shape:continue
 counts[b.turn]+=1;seen.add(b.board_fen());n=len(exercises)+1
 exercises.append(dict(title=f'Xe và Tượng phối hợp · Bài {n}',prompt='Phối hợp Xe và Tượng để chiếu hết trong một nước.',mode='interactive',outcome='checkmate',goal='checkmate',beginner=True,fen=b.fen(),moves=shape['moves'],hints=['Tìm nước chiếu của Xe hoặc Tượng; quân còn lại bảo vệ hoặc khóa đường thoát.','Kiểm tra mọi ô thoát và xem Vua đối phương có thể bắt quân chiếu không.'],solution='Xe ở '+shape['rookRoles'][0]['square']+' và Tượng ở '+shape['bishopRoles'][0]['square']+' phối hợp chiếu hết'+'. Nhánh mẫu: '+shape['moves'][0]+'.'))
 audits.append(dict(fen=b.fen(),moves=shape['moves'],alternatives=alternatives,bishopRoles=shape['bishopRoles'],rookRoles=shape['rookRoles'],method='Exhaustive legal one-move enumeration; actual checkmate and essential rook/bishop removal tests.'))
 if len(exercises)==20:break
assert len(exercises)==20
m.save(m.DATA/'composed.json',[dict(id='rook-bishop-mate',title='Chiếu hết bằng Xe và Tượng',description='Phối hợp Xe và Tượng để bảo vệ quân chiếu và khóa các ô thoát.',exercises=exercises)])
m.save(m.DATA/'validation.json',audits)
print(counts)
