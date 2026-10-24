"""Add independently sourced classical/Jobava topics without replacing existing work.
Requires python-chess and Stockfish. Cached output merges into base rebuilds.
"""
import collections, hashlib, json, re
from pathlib import Path
import chess, chess.engine
ROOT=Path(__file__).resolve().parents[1];FIX=ROOT/'scripts/fixtures/london'
course=json.loads((ROOT/'src/lib/server/london-course.json').read_text())
# Idempotent: remove only this script's previous expansion.
old=json.loads((FIX/'expansion.json').read_text()) if (FIX/'expansion.json').exists() else {'games':[],'lessons':[]}
old_games={g['id'] for g in old['games']};old_lessons={l['id'] for l in old['lessons']}
course['games']=[g for g in course['games'] if g['id'] not in old_games]
course['lessons']=[l for l in course['lessons'] if l['id'] not in old_lessons]
lessons=json.loads((FIX/'expansion-topics.json').read_text());byid={l['id']:l for l in lessons}
seen={tuple(g['moves']) for g in course['games']}
candidates=json.loads((FIX/'expansion-candidates.json').read_text())
def priority(g):
 e=g['event']
 speed=3 if re.search(r'bullet|1m\+|speed',e,re.I) else 2 if re.search(r'blitz|titled|tuesday|[35]m\+',e,re.I) else 1 if re.search(r'rapid|online|chess.com|chess24|banter',e,re.I) else 0
 return speed,-min(int(g.get('whiteElo') or 0),int(g.get('blackElo') or 0)),g['id']
candidates.sort(key=priority)
options=collections.defaultdict(list)
for g in candidates:
 if tuple(g['moves']) in seen:continue
 track=g['track']
 for ply,san in enumerate(g['moves']):
  if ply>100:break
  side=ply%2==0
  if g['result'] not in ('1/2-1/2','1-0' if side else '0-1'):continue
  b=chess.Board(g['fens'][ply]);m=b.parse_san(san);pc=b.piece_at(m.from_square)
  matches=[]
  def has(sq,piece,color):return b.piece_at(chess.parse_square(sq))==chess.Piece(piece,color)
  def add(id,why):matches.append((track+'-'+id,why))
  if track=='classical':
   if ply<30 and ((not side and san=='Qb6' and has('b2',chess.PAWN,True)) or (side and has('b6',chess.QUEEN,False) and has('b2',chess.PAWN,True))):add('qb6','Kiểm tra sức ép lên b2 và d4; chọn nước giữ thế cờ phối hợp.' if side else 'Đưa hậu lên b6 để gây sức ép lên b2 và trung tâm.')
   if ply<35 and ((not side and san=='Nh5' and has('f4',chess.BISHOP,True)) or (side and has('h5',chess.KNIGHT,False) and has('f4',chess.BISHOP,True) and pc.piece_type==chess.BISHOP)):add('nh5','Giải quyết đòn tấn công tượng f4 bằng mã h5.')
   if ply<30 and ((not side and san=='Bf5') or (side and has('f5',chess.BISHOP,False) and pc.piece_type in [chess.BISHOP,chess.KNIGHT])):add('bf5','Chọn cách phát triển khi Đen đưa tượng ra f5.' if side else 'Đưa tượng ra f5 trước khi khép chuỗi tốt.')
   if 10<ply<55 and ((side and san=='e4') or (not side and has('e4',chess.PAWN,True) and g['moves'][ply-1]=='e4')):add('e4','Tính việc mở trung tâm bằng e4.' if side else 'Chọn phản ứng trước nước e4 vừa được chơi.')
   if 14<ply<60 and ((side and san=='c4') or (not side and has('c4',chess.PAWN,True) and g['moves'][ply-1]=='c4')):add('c4','Đánh vào trung tâm bằng tốt c4.' if side else 'Điều chỉnh kế hoạch sau khi Trắng chuyển sang c4.')
   if g['result']=='1/2-1/2' and 35<ply<100 and not b.queens and not b.is_capture(m) and pc.piece_type!=chess.PAWN:add('draw','Giữ hoạt động quân và cân bằng trong thế không còn hậu.')
  else:
   if ply<10 and ((side and san in ['Nc3','Bf4']) or (not side and san in ['d5','Nf6'])):add('setup','Phát triển quân trong cấu trúc Jobava: d4, Nc3 và Bf4.' if side else 'Giữ trung tâm và phát triển trước đội hình Jobava.')
   if ply<18 and san in (['e3','Nf3','Bd3'] if side else ['e6','Bd6','Nf6']):add('development','Hoàn tất phát triển trước khi mở cuộc tấn công.')
   if ply<30 and ((side and san=='Nb5' and has('c7',chess.PAWN,False)) or (not side and san=='a6' and has('c3',chess.KNIGHT,True))):add('nb5','Tính sức ép của mã b5 lên c7.' if side else 'Kiểm soát ô b5 để hạn chế đường nhảy của mã c3.')
   if ply<24 and ((not side and san=='Bf5') or (side and has('f5',chess.BISHOP,False) and san in ['e3','Nf3','Bd3','Qd2','h3','h4'])):add('bf5','Phát triển trong thế Đen có tượng f5.' if side else 'Đưa tượng ra f5 và giữ lựa chọn ở trung tâm.')
   if ply<40 and ((side and san=='e4') or (not side and san=='c5' and has('d4',chess.PAWN,True))):add('center','Tính đòn mở trung tâm e4.' if side else 'Phản công vào d4 bằng tốt c5.')
   if ply<45 and b.is_castling(m):add('castling','Chọn thời điểm nhập thành và đưa xe vào cuộc.')
   if ply<30 and ((side and has('g7',chess.BISHOP,False) and san in ['e3','Qd2','Nf3','Bd3','e4','Bh6']) or (not side and ((san=='Bg7' and has('g6',chess.PAWN,False)) or (san=='e5' and has('g7',chess.BISHOP,False))))):add('g7','Phát triển và điều chỉnh trung tâm trước đường chéo g7.' if side else 'Phối hợp tượng g7 với trung tâm.')
   if ply<45 and ((side and pc.piece_type==chess.BISHOP and b.is_attacked_by(False,m.from_square) and not b.is_capture(m)) or (not side and san=='Nh5' and has('f4',chess.BISHOP,True))):add('retreat','Đưa tượng đang bị tấn công tới ô mới.' if side else 'Dùng mã h5 thách thức tượng f4.')
   if 25<ply<90 and b.gives_check(m):add('tactics','Tính nước chiếu và những đáp trả chính của đối thủ.')
   if 40<ply<100 and not b.queens and pc.piece_type in [chess.KING,chess.KNIGHT,chess.BISHOP,chess.ROOK] and not b.is_capture(m):add('endgame','Cải thiện hoạt động quân trong thế không còn hậu.')
  for id,why in matches:options[(id,side)].append((g,ply,why))
print('Available positions:',{(id,'white' if s else 'black'):len(v) for (id,s),v in options.items()},flush=True)
audit={'engine':'','rootNodes':1000000,'continuation':'root principal variation','exercises':[]};games=[];counts=collections.Counter()
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
 engine.configure({'Threads':2,'Hash':128});audit['engine']=engine.id['name']
 for cycle in range(4):
  # Scarce strategic themes before abundant development/checking examples.
  for l in sorted(lessons,key=lambda l:min(len(options[(l['id'],s)]) for s in [True,False])):
   for side in [True,False]:
    bucket=options[(l['id'],side)]
    # Reserve the last round for drawn examples where the theme has them.
    if cycle==3:bucket.sort(key=lambda x:x[0]['result']!='1/2-1/2')
    while bucket:
     g,ply,why=bucket.pop(0)
     if tuple(g['moves']) in seen:continue
     b=chess.Board(g['fens'][ply]);m=b.parse_san(g['moves'][ply])
     infos=engine.analyse(b,chess.engine.Limit(nodes=1000000),multipv=3)
     score=lambda i:i['score'].pov(side).score(mate_score=100000)
     chosen=next((i for i in infos if i['pv'][0]==m),None)
     if chosen is None or score(infos[0])-score(chosen)>50:continue
     if g['result']=='1/2-1/2' and abs(score(chosen))>80:continue
     if score(chosen)<-100:continue
     length=1 if l['level'] in ['A','B'] else 3 if l['level'] in ['C','C*'] else 5
     bb=b.copy();line=[]
     for mm in chosen['pv'][:length]:line.append(bb.san(mm));bb.push(mm)
     if len(line)%2==0:line.pop()
     id='expansion-'+g['id'];label='Ván hòa' if g['result']=='1/2-1/2' else 'Trắng thắng' if g['result']=='1-0' else 'Đen thắng'
     e=dict(id=id,gameId=g['id'],side='white' if side else 'black',ply=ply,fen=b.fen(),prompt=why,explanation=f"{g['moves'][ply]}: {why} {l['takeaway']}",hints=[l['takeaway'],f"Xem quân ở {chess.square_name(m.from_square)}.",f"Một lựa chọn: {g['moves'][ply]}."],lines=[line])
     l['exercises'].append(e);g['summary']=f"{label} · {l['title']}. {why}";games.append(g);seen.add(tuple(g['moves']));counts[(g['track'],g['result'])]+=1
     audit['exercises'].append(dict(id=id,fen=b.fen(),bestScoreLearner=score(infos[0]),checks=[dict(rootScoreLearner=score(chosen),depth=chosen['depth'])],lines=[line],pgnSha256=hashlib.sha256(g['pgn'].encode()).hexdigest()))
     print(len(games),l['id'],e['side'],g['white'],g['black'],g['result'],g['moves'][ply],flush=True)
     break
# Fail instead of publishing empty concepts or unreachable colors.
for l in lessons:
 for side in ['white','black']:
  assert any(e['side']==side for e in l['exercises']), (l['id'],side)
assert len(games)>=100, len(games)
assert sum(g['result']=='1/2-1/2' for g in games)>=10
(FIX/'expansion.json').write_text(json.dumps(dict(games=games,lessons=lessons),ensure_ascii=False,indent=2)+'\n')
(FIX/'expansion-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
course['games'].extend(games);course['lessons'].extend(lessons)
(ROOT/'src/lib/server/london-course.json').write_text(json.dumps(course,ensure_ascii=False,indent=2)+'\n')
print('Added:',len(games),dict(counts),flush=True)

from london_coverage import write_coverage
write_coverage(json.loads((ROOT / "src/lib/server/london-course.json").read_text()))
