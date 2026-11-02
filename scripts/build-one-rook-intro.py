"""Sparse king-and-rook lessons, with reproducible engine validation."""
import collections,json,random
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/one-rook-mate'
rng=random.Random(261026);groups={1:[],2:[],3:[]};audits=[];seen=set()
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for attempt in range(50000):
  board=chess.Board(None)
  for square,symbol in zip(rng.sample(range(64),3),'KkR'):board.set_piece_at(square,chess.Piece.from_symbol(symbol))
  if not board.is_valid() or board.is_game_over():continue
  if attempt%2:board=board.mirror()
  if board.board_fen() in seen:continue
  quick=engine.analyse(board,chess.engine.Limit(nodes=5000));mate=quick['score'].pov(board.turn).mate()
  if mate not in groups or len(groups[mate])>=(20 if mate==1 else 10):continue
  info=engine.analyse(board,chess.engine.Limit(nodes=150000))
  if info['score'].pov(board.turn).mate()!=mate:continue
  walk=board.copy();sans=[]
  for move in info['pv']:
   sans.append(walk.san(move));walk.push(move)
   if walk.is_checkmate():break
  if not walk.is_checkmate() or (len(sans)+1)//2!=mate:continue
  n=len(groups[mate])+1
  exercise=dict(title=f'Vua và Xe phối hợp · Bài {n}',prompt=f'Phối hợp Vua và Xe để chiếu hết trong {mate} nước.',mode='interactive',outcome='checkmate',goal='checkmate',fen=board.fen(),moves=sans,hints=['Vua hỗ trợ kiểm soát các ô thoát; Xe chiếu từ khoảng cách an toàn.','Kiểm tra xem Vua đối phương còn ô thoát hoặc có thể bắt Xe không.'],solution='Vua và Xe cùng khống chế các ô thoát để hoàn thành thế chiếu hết. Nhánh mẫu: '+' · '.join(sans)+'.')
  if mate==1:exercise['beginner']=True
  else:exercise['difficulty']=dict(level='A' if mate==2 else 'B',status='suggested',solverMoves=mate,sacrificeCount=0,reason='Phối hợp Vua và Xe, không hy sinh.')
  groups[mate].append(exercise);seen.add(board.board_fen());audits.append(dict(fen=board.fen(),mateIn=mate,nodes=150000,engine=engine.id,moves=sans))
  print({k:len(v) for k,v in groups.items()},flush=True)
  if all(len(v)>=(20 if k==1 else 10) for k,v in groups.items()):break
 else:raise RuntimeError('Insufficient introductory positions')
finally:engine.quit()
for name,data in [('composed.json',[dict(id='one-rook-mate',title='Chiếu hết bằng một Xe',description='Phối hợp Vua và Xe để chiếu hết. Ở mức nâng cao, khai thác các quân hỗ trợ và mở đường cho Xe kết thúc.',exercises=sum(groups.values(),[]))]),('validation.json',audits)]:
 (DATA/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
