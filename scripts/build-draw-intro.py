"""Small composed drawing decisions, exact WDL roots and sample continuations."""
import chess,chess.syzygy,json,pathlib,hashlib
P=pathlib.Path(__file__).resolve().parent/'fixtures/draw-practice'
# level, FEN, line, distinct decision, Vietnamese explanation
SEEDS=[
('Beginner','k7/7K/8/8/8/8/6p1/3B4 w - - 0 1','Bf3+ Ka7 Bxg2','Checking bishop fork removes the last pawn','Bf3+ — Tượng từ d1 đến f3, vừa chiếu Vua vừa tấn công Tốt g2. Sau khi Vua tránh chiếu, Tượng bắt Tốt; Vua và một Tượng chống Vua là thế không thể có chiếu hết.'),
('Beginner','8/4N3/8/8/8/2p1k1K1/8/8 w - - 0 1','Nd5+ Kd4 Nxc3','Unblockable knight fork wins the last pawn with tempo','Nd5+ — Mã từ e7 đến d5, vừa chiếu Vua vừa tấn công Tốt c3. Vua phải tránh chiếu; Mã bắt Tốt để đưa về thế Vua và Mã chống Vua.'),
('Beginner','7K/1q1P1k2/8/8/8/8/8/8 w - - 0 1','d8=N+ Kg6 Nxb7','Knight underpromotion checks and forks the opposing queen','d8=N+ — Tốt từ d7 đến d8 và phong Mã, vừa chiếu Vua vừa tấn công Hậu b7. Sau khi Vua tránh chiếu, Mã bắt Hậu; không còn khả năng chiếu hết. Phong Hậu ở đây không giữ được hòa.'),
('Beginner','8/8/4k3/5pP1/K7/8/8/8 w - f6 0 2','gxf6 Kxf6','En passant removes an otherwise escaping enemy pawn','gxf6 — Tốt g5 đến f6, bắt qua đường Tốt Đen ở f5 vừa đi từ f7 đến f5. Sau Kxf6, bàn cờ chỉ còn hai Vua. Nếu Đen chưa bắt lại, Trắng vẫn giữ được hòa.'),
('Beginner','2k5/4P3/8/8/3K4/8/8/8 b - - 0 1','Kd7 e8=Q+ Kxe8','Approach the pawn with access to its promotion square','Kd7 — Vua từ c8 đến d7, vừa tấn công Tốt e7 vừa kiểm soát ô e8. Nếu Tốt phong cấp như phương án, Vua bắt quân mới để hòa.'),
('Beginner','4k3/8/4P3/3K4/8/8/8/8 b - - 0 1','Ke7','Take direct opposition while blocking the pawn','Ke7 — Vua từ e8 đến e7, đứng ngay trước Tốt e6. Giữ Vua trước Tốt để ngăn phong cấp; đây là thế giữ hòa, chưa phải ván cờ tự động kết thúc.'),
('Beginner','8/2K5/8/8/Bk6/2p5/8/8 w - - 0 1','Bc2','Bishop occupies the square immediately ahead of a pawn','Bc2 — Tượng từ a4 đến c2 để chặn Tốt c3. Tiếp tục giữ đường chéo chặn Tốt và tránh để Tượng bị bắt; kết thúc đoạn này chưa phải điều kiện tự động hòa.'),
('Beginner','8/7K/8/8/8/1Nk5/2p5/8 w - - 0 1','Nc1','Knight blocks promotion when checking is unnecessary','Nc1 — Mã từ b3 đến c1, chặn ngay ô phong cấp của Tốt c2. Giữ Mã an toàn và tiếp tục ngăn Tốt phong cấp; ván cờ chưa tự động kết thúc.'),
('Beginner','8/8/8/8/K7/6pB/7k/8 w - - 0 1','Bf1','Long diagonal controls the pawn advance from a distance','Bf1 — Tượng từ h3 đến f1 để khống chế g2. Khi Tốt g3 tiến, Tượng có thể bắt Tốt; cần giữ đường chéo này trong các nước tiếp theo.'),
('Beginner','K7/8/8/8/8/6k1/5p2/1N6 w - - 0 1','Nd2 f1=Q Nxf1','Knight guards promotion rather than occupying the pawn file','Nd2 — Mã từ b1 đến d2, khống chế ô phong cấp f1. Nếu Đen phong cấp, Mã bắt quân vừa xuất hiện; chỉ còn Vua và Mã chống Vua.'),
('Beginner','8/3B4/8/8/8/2K1k3/p7/8 w - - 0 1','Kb2 a1=Q+ Kxa1','Use the king when the bishop cannot control the promotion colour','Kb2 — Vua từ c3 đến b2 để chặn Tốt a2 phong cấp an toàn. Tượng d7 đi trên ô đen nên không kiểm soát a1; Vua phải đảm nhiệm việc này.'),
('Beginner','8/3q4/2k5/8/8/8/8/3Q3K w - - 0 1','Qxd7+ Kxd7','Equal queen exchange removes both sides mating material','Qxd7+ — Hậu từ d1 bắt Hậu d7 và chiếu. Khi Vua bắt lại, bàn cờ chỉ còn hai Vua nên hòa. Nếu Vua tránh bắt, Trắng vẫn không thua.'),
('Beginner','7k/5Kq1/8/8/8/8/8/6R1 w - - 0 1','Rxg7','Capture the checking queen creates immediate opposing stalemate','Rxg7 — Xe từ g1 bắt Hậu g7 để giải chiếu. Vua Đen h8 không bị chiếu nhưng cả g8, g7 và h7 đều bị khống chế: hòa do hết nước đi (pat).'),
('Beginner','8/3k4/K7/8/8/2P5/8/8 b - - 0 1','Kc6','Lateral king opposition stops the king escorting a pawn','Kc6 — Vua từ d7 đến c6, đối diện Vua a6 theo hàng ngang, với ô b6 ở giữa. Chặn đường Vua Trắng tiến sang hỗ trợ Tốt; vẫn phải phòng thủ đúng ở các nước sau.'),
('Beginner','2k5/8/P7/8/8/8/8/7K b - - 0 1','Kb8 a7+ Kxa7','Approach a rook pawn without entering the square it attacks','Kb8 — Vua từ c8 đến b8, giữ ô a8 trong tầm kiểm soát. Không thể đến b7 vì Tốt a6 khống chế ô đó. Nếu a7+, Vua bắt Tốt để hòa.'),
('Beginner','8/8/6kp/8/7P/8/5q2/7K w - - 0 1','h5+ Kg5','Checking pawn advance closes the final pawn move','h5+ — Tốt từ h4 đến h5, chiếu Vua và bị Tốt h6 chặn lại. Sau khi Vua Đen tránh chiếu, Trắng không bị chiếu và không còn nước hợp lệ: hòa do hết nước đi (pat).'),
]
def key(b):return ' '.join(b.fen().split()[:4])
def main():
 tb=chess.syzygy.open_tablebase('/tmp/draw-syzygy');records=[]
 for level,fen,line,aspect,solution in SEEDS:
  b=chess.Board(fen);assert b.is_valid();side=b.turn;moves=line.split();roots=[]
  for m in list(b.legal_moves):
   san=b.san(m);b.push(m)
   if len(b.piece_map())<=4:v=-tb.probe_wdl(b)
   else:
    # The only five-piece seed: every response to h5+ immediately stalemates White.
    assert san=='h5+';v=0
    for reply in list(b.legal_moves):b.push(reply);assert b.is_stalemate();b.pop()
   roots.append({'move':san,'wdl':v,'immediateMate':b.is_checkmate()});b.pop()
  assert not any(x['wdl']>0 for x in roots),(fen,roots)
  assert next(x for x in roots if x['move']==moves[0])['wdl']==0
  positions=[]
  for s in moves:
   if len(b.piece_map())<=4:assert tb.probe_wdl(b)==0
   positions.append({'fen':b.fen(en_passant='fen'),'wdl':0});b.push_san(s)
  assert len(b.piece_map())>4 or tb.probe_wdl(b)==0
  positions.append({'fen':b.fen(en_passant='fen'),'wdl':0})
  outcome='stalemate' if b.is_stalemate() else 'material' if b.is_insufficient_material() else 'fortress'
  category={'material':'insufficient-material','stalemate':'stalemate','fortress':'fortress'}[outcome]
  ident='draw-composed-'+hashlib.sha256(fen.encode()).hexdigest()[:16]
  row=dict(id=ident,gameId=ident,sourceKind='composed',level=level,fen=fen,moves=moves,aspect=aspect,solution=solution,category=category,outcome=outcome,solverDecisions=(len(moves)+1)//2,sacrifices=[],actualGamePlies=0,roots=roots,positions=positions)
  if ' f6 ' in fen:row['previousMove']={'fen':'8/5p2/4k3/6P1/K7/8/8/8 b - - 0 1','move':'f5'}
  records.append(row)
 tables=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(pathlib.Path('/tmp/draw-syzygy').glob('*.rtbw'))]
 (P/'intro-additions.json').write_text(json.dumps({'method':'Exact Syzygy WDL for every legal root and all sample positions; five-piece checking-pawn seed verified by enumerating every legal reply. WDL=0 does not mean automatic termination.','tableSource':'https://tablebase.lichess.ovh/tables/standard/3-4-5-wdl/','tables':tables,'records':records},ensure_ascii=False,indent=2)+'\n')
 print(len(records),'exactly verified composed introductory positions')
if __name__=='__main__':main()
