"""A composed knight promotion saves the king and wins a queen by a fork."""
import json,hashlib
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-split';b=chess.Board('8/2P5/1q1k4/8/8/8/4n1PP/7K w - - 0 1');assert b.is_valid()
values={1:100,2:320,3:330,4:500,5:900,6:0}
def mat(x):return sum(values[p.piece_type]*(1 if p.color else -1) for p in x.piece_map().values())
baseline=mat(b);nodes={};audit=[]
def key(x,left):return x.fen(en_passant='fen')+'|'+str(left)
root=b.copy();rootMove=root.parse_san('c8=N+');root.push(rootMove);nodes[key(b,2)]={'move':rootMove.uci()};nodes[key(root,1)]={'replies':[m.uci() for m in root.legal_moves]}
for reply in root.legal_moves:
 c=root.copy();c.push(reply);capture=c.parse_san('Nxb6');c.push(capture);beforeCapture=root.copy();beforeCapture.push(reply);nodes[key(beforeCapture,1)]={'move':capture.uci()};nodes[key(c,0)]={'replies':[m.uci() for m in c.legal_moves]}
 for defence in c.legal_moves:
  end=c.copy();end.push(defence);gain=mat(end)-baseline;assert gain>=800 and not end.is_game_over();nodes[key(end,0)]={'gain':gain}
# All other promotion choices allow the same immediate mate.
for piece in [chess.QUEEN,chess.ROOK,chess.BISHOP]:
 other=b.copy();move=chess.Move(chess.C7,chess.C8,promotion=piece);other.push(move);mate=other.parse_san('Qg1#');other.push(mate);assert other.is_checkmate();audit.append(dict(promotion=b.san(move),refutation='Qg1#'))
e=dict(title='Phong cấp Mã tạo chiếu và tấn công đôi',prompt='Chọn quân phong cấp để giành Hậu và tránh bị chiếu hết.',mode='interactive',goal='material',outcome='promotion',fen=b.fen(),moves=['c8=N+','Kc6','Nxb6','Kxb6'],promotionGain=dict(minimumGain=800,solverMoves=2),difficulty=dict(level='A',status='suggested',solverMoves=2,sacrificeCount=0,reason='Phong Mã tạo chiếu và tấn công Hậu; tính cả nước bắt lại.'),hints=['Nếu phong Hậu, Xe hoặc Tượng, Đen có Qg1#.','Tìm nước phong cấp vừa chiếu Vua vừa tấn công Hậu.'],solution='c8=N+ — Tốt từ c7 đến c8, phong Mã và chiếu. Mã đồng thời tấn công Hậu b6. Sau Kc6, Nxb6 giành Hậu; kể cả Kxb6, Trắng vẫn đổi được một Tốt lấy Hậu. Phong Hậu, Xe hoặc Tượng đều cho phép Qg1#.',source='Thế cờ biên soạn.')
(D/'underpromotion-fork.json').write_text(json.dumps(dict(exercise=e,certificate=dict(fen=b.fen(),solverMoves=2,nodes=nodes),otherPromotions=audit),ensure_ascii=False,indent=2)+'\n')
print('fork certified',len(nodes),'nodes')
