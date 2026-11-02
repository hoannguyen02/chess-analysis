"""Sparse back-rank mates with both rook and queen, and both solving colors."""
import importlib.util,json,random,sys
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/back-rank-mate'
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-back-rank-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(271026);exercises=[];audit=[];seen=set()
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for attempt in range(10000):
  n=len(exercises);piece=chess.ROOK if n%2==0 else chess.QUEEN;color=chess.WHITE if n%4<2 else chess.BLACK
  b=chess.Board(None);file=rng.choice([0,1,6,7]);b.set_piece_at(chess.square(file,7),chess.Piece(chess.KING,chess.BLACK))
  for f in range(max(0,file-1),min(7,file+1)+1):b.set_piece_at(chess.square(f,6),chess.Piece(chess.PAWN,chess.BLACK))
  for p in [chess.KING,piece]:
   sq=rng.choice([sq for sq in range(48) if b.piece_at(sq) is None]);b.set_piece_at(sq,chess.Piece(p,chess.WHITE))
  if color==chess.BLACK:b=b.mirror()
  if not b.is_valid() or b.is_game_over() or b.board_fen() in seen:continue
  info=engine.analyse(b,chess.engine.Limit(nodes=50000))
  if info['score'].pov(b.turn).mate()!=1:continue
  move=info['pv'][0];san=b.san(move);end=b.copy();end.push(move);motif=m.motif(end)
  if not motif:continue
  e=dict(title=f'Chiếu hết hàng cuối · Bài {n+1}',beginner=True,prompt='Tìm nước chiếu hết hàng cuối.',mode='interactive',outcome='checkmate',goal='checkmate',fen=b.fen(),moves=[san],hints=['Vua đối phương bị các Tốt chặn đường thoát.','Tìm ô trên hàng cuối mà Xe hoặc Hậu có thể chiếu an toàn.'],solution='Xe hoặc Hậu chiếu dọc hàng cuối; các Tốt chặn đường thoát của Vua. Nhánh mẫu: '+san+'.')
  exercises.append(e);seen.add(b.board_fen());audit.append(dict(fen=b.fen(),moves=[san],mateIn=1,nodes=50000,engine=engine.id,backRank=motif))
  if len(exercises)==20:break
 else:raise RuntimeError('Insufficient valid examples')
finally:engine.quit()
m.save(DATA/'composed.json',[dict(id='back-rank-mate',title='Chiếu hết hàng cuối',description='Khai thác Vua bị các quân của mình chặn đường thoát: đưa Xe hoặc Hậu vào hàng cuối để chiếu hết.',exercises=exercises)])
m.save(DATA/'validation.json',audit)
