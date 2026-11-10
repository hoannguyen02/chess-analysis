"""Generate deterministic A/B composed KRR-v-K lessons with Stockfish.
No source games are invented. Saved alternative lines end in actual checkmate.
Beginner positions are authored separately through the shared UI.
"""
import json,random,sys,subprocess
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'scripts/fixtures/two-rook-mate/expansion-evidence.json').exists():
 subprocess.run([sys.executable,str(ROOT/'scripts/build-two-rook-master-games.py')],check=True)
 sys.exit(0)

def publish(categories):
 exercises=[e for c in categories for e in c['exercises']
            if not e.get('gameReference') and not e.get('beginner') and len(e['moves'])>1]
 for e in exercises:
  own=(len(e['moves'])+1)//2
  level='A' if own==2 else 'B'
  e['difficulty']=dict(level=level,status='suggested',solverMoves=own,sacrificeCount=0,
   reason='Phối hợp trực tiếp hai Xe, không hy sinh.' if level=='A' else 'Phối hợp ngắn hai Xe qua các nước đáp của Vua, không hy sinh.')
 data=[dict(id='two-rook-mate',title='Chiếu hết bằng hai Xe',description='Phối hợp hai Xe để hạn chế đường thoát và chiếu hết Vua đối phương. Giữ Xe ngoài tầm bắt của Vua.',exercises=exercises)]
 (ROOT/'scripts/fixtures/two-rook-mate/composed.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'src/lib/server/two-rook-mate-exercises.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 if (ROOT/'scripts/fixtures/two-rook-mate/master-researched.json').exists():
  subprocess.run([sys.executable,str(ROOT/'scripts/build-two-rook-master-games.py')],check=True)

if '--regrade' in sys.argv:
 publish(json.loads((ROOT/'src/lib/server/two-rook-mate-exercises.json').read_text()))
 sys.exit(0)

random.seed(240102)
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
engine.configure({'Threads':2,'Hash':128})
groups={2:[],3:[]};seen=set();audit=[]
def line(board,pv):
 b=board.copy();out=[];used=set()
 for move in pv:
  if b.turn==board.turn:
   if b.piece_at(move.from_square).piece_type!=chess.ROOK:return None
   used.add(move.from_square)
  out.append(b.san(move));b.push(move)
  if len(b.piece_map())!=4:return None
  if b.is_checkmate():return out
 return None
try:
 for attempt in range(20000):
  b=chess.Board(None);squares=random.sample(range(64),4)
  wk,bk,r1,r2=squares
  if chess.square_distance(wk,bk)<4:continue
  for sq,p in [(wk,'K'),(bk,'k'),(r1,'R'),(r2,'R')]:b.set_piece_at(sq,chess.Piece.from_symbol(p))
  if not b.is_valid() or b.is_game_over():continue
  # Include both sides to move, not merely different board orientations.
  if attempt%2:b=b.mirror()
  key=b.board_fen()
  if key in seen:continue
  quick=engine.analyse(b,chess.engine.Limit(nodes=12000))
  mate=quick['score'].pov(b.turn).mate()
  if mate not in [2,3,4]:continue
  group=min(mate,3)
  if len(groups[group])>=20:continue
  infos=engine.analyse(b,chess.engine.Limit(nodes=150000),multipv=4)
  if infos[0]['score'].pov(b.turn).mate()!=mate:continue
  lines=[]
  for info in infos:
   distance=info['score'].pov(b.turn).mate()
   if distance is None or distance<=0 or distance>mate:continue
   moves=line(b,info.get('pv',[]))
   if moves and moves not in lines:lines.append(moves)
  if not lines:continue
  # Both rooks must participate in the main line.
  walk=b.copy();identities={sq:sq for sq in b.pieces(chess.ROOK,b.turn)};used=set()
  for san in lines[0]:
   m=walk.parse_san(san)
   if walk.turn==b.turn:
    identity=identities.pop(m.from_square);used.add(identity);identities[m.to_square]=identity
   walk.push(m)
  if len(used)!=2:continue
  n=len(groups[group])+1
  exercise=dict(title=('Chiếu hết trong '+str(mate)+' nước')+' · Bài '+str(n),prompt='Phối hợp hai Xe để chiếu hết Vua đối phương trong '+str(mate)+' nước.',mode='interactive',outcome='checkmate',goal='checkmate',fen=b.fen(),moves=lines[0],alternativeLines=lines[1:],hints=['Một Xe hạn chế đường thoát, Xe còn lại chiếu Vua.','Giữ Xe ngoài tầm bắt của Vua và kiểm tra tất cả các ô thoát.'],solution='Hai Xe phối hợp khống chế đường thoát và chiếu hết. Nhánh mẫu: '+' · '.join(lines[0])+'.')
  groups[group].append(exercise);seen.add(key)
  audit.append(dict(fen=b.fen(),mateIn=mate,engine=engine.id,nodes=150000,lines=lines))
  print(attempt,{k:len(v) for k,v in groups.items()},flush=True)
  if all(len(v)==20 for v in groups.values()):break
 else:raise RuntimeError('Not enough validated positions')
finally:engine.quit()
categories=[]
for k,title,description in [(2,'Phối hợp hai nước','Phối hợp hai Xe để dồn Vua ra biên rồi chiếu hết trong hai nước.'),(3,'Chiếu bậc thang','Hai Xe lần lượt thu hẹp vùng di chuyển của Vua. Tính trước ba đến bốn nước, chú ý tránh để Vua bắt Xe.')]:
 categories.append(dict(id='two-rook-mate-'+str(k),title=title,description=description,exercises=groups[k]))
publish(categories)
(ROOT/'scripts/fixtures/two-rook-mate/validation.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
