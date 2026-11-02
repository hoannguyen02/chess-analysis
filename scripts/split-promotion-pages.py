from mate_proof_store import MateProofStore
"""Separate promotion objectives without relabeling mate lines as material wins.

Material candidates are prefixes of verified all-defence strategies, regraded
at the earlier payoff. They are published only if every certified defence retains
a positive material gain after promotion and a direct mate is not the sole payoff.
"""
import collections,copy,hashlib,importlib.util,json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion';OUT=ROOT/'src/lib/server';AUDIT=ROOT/'scripts/fixtures/promotion-split'
proof_store=MateProofStore(D)
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def read(p):return json.loads(p.read_text())
def save(p,d):m.save(p,d)
def mat(b,c):return m.material(b,c)
def safe_capture_reply(b,move,c,baseline):
 child=b.copy();child.push(move);return not child.is_game_over() and mat(child,c)>=baseline+100
legacy=read(AUDIT/'original-mixed.json')[0]['exercises'];basic=read(AUDIT/'material-intro.json')
accepted={a['gameId'] for a in read(D/'composed-reviewed.json') if a['decision']=='accepted'}
records=read(D/'master-published.json')['records']+[r for r in read(D/'composed-candidates.json') if r['gameId'] in accepted and r['gameId'] in proof_store];sources=read(OUT/'promotion-game-sources.json');materials=list(basic);materialRecords=[];under=[];underSources={};fps=set()
for e in basic:
 b=chess.Board(e['fen']);move=b.parse_san(e['moves'][0]);q=b.copy();q.push(chess.Move(move.from_square,move.to_square,promotion=chess.QUEEN))
 if move.promotion!=chess.QUEEN and q.is_stalemate():under.append(copy.deepcopy(e))
# Essential one-move knight promotions already have exhaustive legal mate review.
for e in legacy:
 if e.get('beginner') and e['goal']=='checkmate':
  b=chess.Board(e['fen']);move=b.parse_san(e['moves'][0])
  if move.promotion==chess.KNIGHT:
   q=b.copy();q.push(chess.Move(move.from_square,move.to_square,promotion=chess.QUEEN))
   if not q.is_checkmate():under.append(copy.deepcopy(e))
for r in records:
 start=chess.Board(r['fen']);color=start.turn;baseline=mat(start,color);proof=proof_store[r['gameId']];nodes=proof['nodes'];trim={}
 def visit(b,left):
  key=b.fen(en_passant='fen')+'|'+str(left)
  promoted=any(move.promotion for i,move in enumerate(b.move_stack) if i%2==0)
  gain=mat(b,color)-baseline
  if promoted and gain>=100 and b.turn==color and not b.is_game_over(claim_draw=True):trim[key]={'gain':gain};return True
  if b.is_game_over(claim_draw=True):return False
  node=nodes.get(key)
  if not node:return False
  ucis=[node['move']] if 'move' in node else node.get('replies',[])
  for uci in ucis:
   child=b.copy();child.push_uci(uci)
   if not visit(child,left-(b.turn==color)):return False
  trim[key]=copy.deepcopy(node);return bool(ucis)
 if visit(start.copy(),r['solverMoves']):
  def distance(b,left):
   node=trim[b.fen(en_passant='fen')+'|'+str(left)]
   if 'gain' in node:return 0
   ucis=[node['move']] if 'move' in node else node['replies'];depths=[]
   for uci in ucis:
    c=b.copy();c.push_uci(uci);depths.append((b.turn==color)+distance(c,left-(b.turn==color)))
   return max(depths)
  def distance_after(b,left,u):
   c=b.copy();c.push_uci(u);return distance(c,left-(b.turn==color))
  walk=start.copy();sans=[];left=r['solverMoves']
  while 'gain' not in trim[walk.fen(en_passant='fen')+'|'+str(left)]:
   node=trim[walk.fen(en_passant='fen')+'|'+str(left)];uci=node['move'] if 'move' in node else max(node['replies'],key=lambda u:distance_after(walk,left,u));move=chess.Move.from_uci(uci);sans.append(walk.san(move));own=walk.turn==color;walk.push(move);left-=own
  # No artificial depth: only actual prefix moves and sacrifices enter grading.
  pvs=[start.parse_san(sans[0])];b=start.copy();pvs=[]
  for san in sans:pvs.append(b.parse_san(san));b.push(pvs[-1])
  sacs=[s for s in r['sacrifices'] if s['ply']<len(sans)];own=(len(sans)+1)//2
  check=start.copy();coordinated=set();quiet=False
  for i,move in enumerate(pvs):
   if i%2==0:coordinated.add(check.piece_type_at(move.from_square));quiet|=not check.is_capture(move) and not check.gives_check(move)
   check.push(move)
  if sacs:level='C' if own<=3 and len(sacs)==1 else 'D' if own>3 and (len(sacs)>1 or any(s['piece']=='Q' for s in sacs) or (own>=5 and len(coordinated)>=3 and quiet)) else None
  else:level='A' if own<=2 else 'B' if own==3 else 'C*' if own in [5,6] else None
  bypass=False
  for alternative in start.legal_moves:
   if alternative.promotion:continue
   child=start.copy();child.push(alternative)
   if child.is_checkmate():bypass=True;break
   if start.is_capture(alternative) and mat(child,color)>baseline:
    replies=list(child.legal_moves)
    if replies and all(safe_capture_reply(child,reply,color,baseline) for reply in replies):bypass=True;break
  if level and not bypass:
   fp=json.dumps([level,[('promotion' if '=' in s else s[0], 'x' in s,'+' in s) for s in sans]])
   if fp not in fps:
    fps.add(fp);e=next((copy.deepcopy(e) for e in legacy if e['fen']==r['fen']),None)
    if e is None:e=dict(title='Phong cấp · Thế biên soạn',fen=r['fen'],source='Thế cờ biên soạn, đã điều chỉnh vị trí quân.',mode='interactive')
    if e:
     e.update(goal='material',outcome='promotion',moves=sans,promotionGain=dict(minimumGain=100,solverMoves=own),prompt='Phong cấp để giành vật chất, tính cả các nước bắt lại.',solution='Phong cấp và giữ phần vật chất giành được trước các nước đáp. Phương án: '+' · '.join(sans)+'.',difficulty=dict(level=level,status='suggested',solverMoves=own,sacrificeCount=len(sacs),reason='Phân mức ở thời điểm giữ được lợi thế vật chất, không dùng độ dài phương án chiếu hết.'))
     if not e.get('gameReference'):e['title']='Phong cấp giành vật chất · '+level+' · Thế biên soạn'
     materials.append(e);materialRecords.append(dict(gameId=r['gameId'],fen=r['fen'],level=level,moves=sans,solverMoves=r['solverMoves'],gain=mat(walk,color)-baseline,nodes=trim))
 # Underpromotion is not inferred merely from SAN: reject equivalent queen mates.
 if any(p['piece']!='Q' for p in r['promotions']):
  # Narrow, auditable case: promotion is the final mating move, queen does not mate.
  b=start.copy();needed=False
  for san in r['moves']:
   move=b.parse_san(san)
   if b.turn==color and move.promotion and move.promotion!=chess.QUEEN:
    q=b.copy();q.push(chess.Move(move.from_square,move.to_square,promotion=chess.QUEEN));child=b.copy();child.push(move)
    if child.is_checkmate() and not q.is_checkmate():needed=True
   b.push(move)
  if needed:
   e=next((copy.deepcopy(e) for e in legacy if e['fen']==r['fen']),None)
   if e:
    if e.get('gameReference'):e['gameReference']['collection']='underpromotion';underSources[r['gameId']]=sources[r['gameId']]
    under.append(e)
# Existing researched liquidations: keep only won pawn endings with a passed pawn.
passed=[];passedSources={};passedReview=[]
for e in read(OUT/'simplification-exercises.json'):
 if 'exercises' in e:continue
 if e.get('goal')!='win':continue
 b=chess.Board(e['fen']);color=b.turn;start=b.copy()
 for san in e['moves']:b.push_san(san)
 pawns=[]
 for square in b.pieces(chess.PAWN,color):
  f=chess.square_file(square);rank=chess.square_rank(square)
  if not any(abs(chess.square_file(p)-f)<=1 and ((chess.square_rank(p)>rank) if color else (chess.square_rank(p)<rank)) for p in b.pieces(chess.PAWN,not color)):pawns.append(chess.square_name(square))
 if not pawns:continue
 e=copy.deepcopy(e);e['prompt']='Đổi quân để khai thác lợi thế của Tốt thông trong tàn cuộc.';e['solution']='Sau phương án đổi quân, Tốt thông ở '+', '.join(pawns)+' góp phần tạo thế thắng. '+e['solution']
 if e.get('gameReference'):
  ident=e['gameReference']['id'];e['gameReference']['collection']='passed-pawn-simplification';passedSources[ident]=read(OUT/'simplification-game-sources.json')[ident]
 passed.append(e);passedReview.append(dict(fen=e['fen'],moves=e['moves'],endFen=b.fen(),passedPawns=pawns,source='existing reviewed simplification endpoint and tablebase evidence'))
# Publish only endpoints whose passed pawns are essential to the tablebase win.
importancePath=AUDIT/'passed-pawn-importance.json'
if importancePath.exists():
 accepted={r['fen'] for r in read(importancePath) if r['accepted']}
 passed=[e for e in passed if e['fen'] in accepted]
# Handle either existing data wrapper format.
if not passed:
 raw=read(OUT/'simplification-exercises.json')
 if raw and 'exercises' in raw[0]:raise RuntimeError('Expected flat simplification data; adapt wrapper explicitly')
limited=[];counts=collections.Counter()
for e in materials:
 level='Beginner' if e.get('beginner') else e['difficulty']['level']
 if counts[level]<24:limited.append(e);counts[level]+=1
materials=limited
save(OUT/'promotion-exercises.json',[dict(id='promotion',title='Phong cấp giành vật chất',description='Khai thác phong cấp để giành vật chất; kiểm tra các nước bắt lại.',exercises=materials)])
if (AUDIT/'underpromotion-fork.json').exists():under.append(read(AUDIT/'underpromotion-fork.json')['exercise'])
save(OUT/'underpromotion-exercises.json',[dict(id='underpromotion',title='Phong cấp thành Xe, Tượng hoặc Mã',description='Tìm lý do cụ thể để chọn quân khác Hậu: tránh pat, tạo nước chiếu hoặc đạt mục tiêu chiến thuật.',exercises=under)])
save(OUT/'underpromotion-game-sources.json',underSources)
save(OUT/'passed-pawn-simplification-exercises.json',[dict(id='passed-pawn-simplification',title='Đổi quân khai thác Tốt thông',description='Tốt thông không còn Tốt đối phương ở cùng cột hoặc hai cột liền kề phía trước. Tìm cách đổi quân để khai thác Tốt thông.',exercises=passed)])
save(OUT/'passed-pawn-simplification-game-sources.json',passedSources)
save(AUDIT/'material-certificates.json',materialRecords);save(AUDIT/'passed-pawn-review.json',passedReview)
for name,rows in [('material',materials),('underpromotion',under),('passed pawn',passed)]:print(name,len(rows),collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in rows))

mate=read(AUDIT/'mate-intro.json')+[copy.deepcopy(e) for e in legacy if not e.get('beginner') and e['goal']=='checkmate']
for e in mate:
 if e.get('gameReference'):e['gameReference']['collection']='promotion-mate'
save(OUT/'promotion-mate-exercises.json',[dict(id='promotion-mate',title='Phong cấp chiếu hết',description='Phong cấp và phối hợp quân để chiếu hết.',exercises=mate)])
save(OUT/'promotion-mate-game-sources.json',sources)
print('mate',len(mate),collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in mate))

# Apply the complete family review, including durable duplicate exclusions.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/'scripts/publish-underpromotion-expansion.py')],check=True)
subprocess.run([sys.executable,str(ROOT/'scripts/curate-promotion-family.py')],check=True)
