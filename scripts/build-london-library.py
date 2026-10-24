"""Select 50 wins per color from screened master games; audit thematic positions.
Run after build-london.py. Selection is cached in library.json for base rebuilds.
"""
import collections, copy, hashlib, json, re
from pathlib import Path
import chess, chess.engine
ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/london'
path=ROOT/'src/lib/server/london-course.json'
course=json.loads(path.read_text())
# Preserve only the original, editorially annotated lessons.
course['games']=[g for g in course['games'] if g['id'] in {'ding-nepo-2023','carlsen-aronian-2019','keres-fischer-1959'}]
for l in course['lessons']: l['exercises']=[e for e in l['exercises'] if not e['id'].startswith('library-')]
expansion=json.loads((FIX/'expansion.json').read_text()) if (FIX/'expansion.json').exists() else {'games':[], 'lessons':[]}
course['lessons']=[l for l in course['lessons'] if l['id'].startswith('lesson-')]
seen={tuple(g['moves']) for g in course['games'] + expansion['games']}
candidates=json.loads((FIX/'library-candidates.json').read_text())
# Prefer stronger opposition; use the game signature as stable tie breaker.
def tempo_priority(g):
 event=g['event']
 if re.search(r'bullet|1m\+|speed',event,re.I):return 3
 if re.search(r'blitz|titled|tuesday|3m\+|5m\+',event,re.I):return 2
 if re.search(r'rapid|online|chess.com|chess24|banter',event,re.I):return 1
 return 0
candidates.sort(key=lambda g:(tempo_priority(g),-min(int(g.get('whiteElo') or 0),int(g.get('blackElo') or 0)),g['id']))
options=collections.defaultdict(list)
for g in candidates:
 if tuple(g['moves']) in seen:continue
 side=g['result']=='1-0'
 for ply,san in enumerate(g['moves']):
  if ply%2 != (0 if side else 1):continue
  b=chess.Board(g['fens'][ply]); m=b.parse_san(san); piece=b.piece_at(m.from_square)
  prev=chess.Board(g['fens'][ply-1]) if ply else None
  pm=prev.parse_san(g['moves'][ply-1]) if prev else None
  after=b.copy();after.push(m)
  n=None;why=''
  if ply<12 and ((side and san=='Bf4') or (not side and san=='e6')):n=1;why='Phát triển tượng và củng cố trung tâm.'
  if ply<30 and san=='O-O':n=2;why='Nhập thành và đưa xe vào cuộc.'
  if ply<30 and b.is_capture(m) and prev and prev.is_capture(pm) and m.to_square==pm.to_square:n=3;why='Bắt lại quân; xem cấu trúc và cột vừa thay đổi.'
  if ply<30 and ((side and san=='Bxd6' and b.piece_at(chess.D6)==chess.Piece(chess.BISHOP,False)) or (not side and san=='Bd6' and b.piece_at(chess.F4)==chess.Piece(chess.BISHOP,True))):n=4;why='Giải quyết sự đối đầu giữa tượng f4 và tượng d6.'
  oq=b.pieces(chess.QUEEN,not side)
  if ply<40 and piece.piece_type in [chess.ROOK,chess.KNIGHT,chess.BISHOP] and any(q in after.attacks(m.to_square) and q not in b.attacks(m.from_square) for q in oq):n=5;why='Đưa quân vào cuộc với nhịp tấn công hậu đối phương.'
  if side and san=='hxg3' and ply<36:n=6;why='Bắt lại trên g3, mở cột h cho xe.'
  if ply<40 and ((side and san=='Ne5' and b.piece_at(chess.D4)==chess.Piece(chess.PAWN,True)) or (not side and san=='c5' and b.piece_at(chess.D4)==chess.Piece(chess.PAWN,True))):n=7;why='Đặt mã vào e5.' if side else 'Dùng tốt c5 thách thức trung tâm d4.'
  if ply<50 and ((side and san=='a5') or (not side and san=='f6' and b.piece_at(chess.E5) and b.piece_at(chess.E5).color)):n=8;why='Giành không gian cánh hậu.' if side else 'Dùng tốt f6 đánh vào quân Trắng ở e5.'
  if ply<50 and ((side and san=='Nb3') or (not side and san=='c4' and b.piece_at(chess.D3)==chess.Piece(chess.BISHOP,True))):n=9;why='Chuyển mã sang cánh hậu.' if side else 'Tiến tốt c4 với nhịp tấn công tượng d3.'
  if ply<30 and b.piece_at(chess.G7)==chess.Piece(chess.BISHOP,False) and san==('e3' if side else 'e5'):n=10;why='Điều chỉnh trung tâm trước cách bố trí tượng g7.'
  if 12<ply<60 and piece.piece_type in [chess.BISHOP,chess.QUEEN] and b.is_attacked_by(not side,m.from_square) and not b.is_capture(m) and (chess.square_rank(m.to_square)-chess.square_rank(m.from_square))*(1 if side else -1)<0:n=11;why='Rút quân đang bị tấn công về vị trí mới.'
  if 35<ply<100 and b.gives_check(m) and prev and prev.is_capture(pm):n=13;why='Tính nước chiếu sau khi đối phương vừa bắt quân.'
  if ply>50 and ((piece.piece_type==chess.ROOK and chess.square_rank(m.to_square)==(6 if side else 1)) or (not b.queens and piece.piece_type in [chess.BISHOP,chess.KNIGHT])):n=15;why='Duy trì hoạt động quân trong giai đoạn chuyển hóa ưu thế.'
  if n:options[(n,side)].append((g,ply,why))
audit={'engine':'','rootNodes':1000000,'continuation':'principal variation from the same root search','exercises':[]}
counts=collections.Counter(g['result'] for g in course['games']); selected=[];exercises=[]
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
 engine.configure({'Threads':2,'Hash':128});audit['engine']=engine.id['name']
 while min(counts['1-0'],counts['0-1'])<50:
  changed=False
  # Distribute across themes rather than taking the first 100 opening positions.
  for n in [10,11,13,15,5,6,9,8,7,4,3,2,1]:
   for side in [True,False]:
    result='1-0' if side else '0-1'
    if counts[result]>=50:continue
    bucket=options[(n,side)]
    while bucket:
     g,ply,why=bucket.pop(0)
     if tuple(g['moves']) in seen:continue
     b=chess.Board(g['fens'][ply]);move=b.parse_san(g['moves'][ply])
     infos=engine.analyse(b,chess.engine.Limit(nodes=1000000),multipv=3)
     score=lambda i:i['score'].pov(side).score(mate_score=100000)
     best=score(infos[0]);chosen=next((i for i in infos if i['pv'][0]==move),None)
     if chosen is None or best-score(chosen)>50 or (n==15 and score(chosen)<150):continue
     lesson=course['lessons'][n-1];length=1 if lesson['level'] in ['A','B'] else 3 if lesson['level'] in ['C','C*'] else 5
     line=[];bb=b.copy()
     for mm in chosen['pv'][:length]:line.append(bb.san(mm));bb.push(mm)
     if len(line)%2==0:line.pop()
     ex=dict(id='library-'+g['id'],side='white' if side else 'black',gameId=g['id'],ply=ply,fen=b.fen(),prompt=why,explanation=f"{g['moves'][ply]}: {why}",hints=[why,f"Xem quân ở {chess.square_name(move.from_square)}.",f"Một lựa chọn: {g['moves'][ply]}."],lines=[line])
     lesson['exercises'].append(ex);exercises.append({'lessonId':lesson['id'],**ex})
     g['summary']=f"{'Trắng' if side else 'Đen'} thắng · {lesson['title']}. {why}"
     selected.append(g);course['games'].append(g);seen.add(tuple(g['moves']));counts[result]+=1;changed=True
     audit['exercises'].append(dict(id=ex['id'],fen=b.fen(),bestScoreLearner=best,checks=[dict(rootScoreLearner=score(chosen),depth=chosen['depth'])],lines=[line],playedMove=g['moves'][ply],pgnSha256=hashlib.sha256(g['pgn'].encode()).hexdigest()))
     print(dict(counts),lesson['id'],g['white'],g['black'],ply,g['moves'][ply],flush=True)
     break
  if not changed:raise RuntimeError(f'Insufficient verified games: {counts}')
(FIX/'library.json').write_text(json.dumps(dict(games=selected,exercises=exercises),ensure_ascii=False,indent=2)+'\n')
(FIX/'library-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
course['games'].extend(expansion['games'])
course['lessons'].extend(expansion['lessons'])
path.write_text(json.dumps(course,ensure_ascii=False,indent=2)+'\n')

from london_coverage import write_coverage
write_coverage(json.loads((ROOT / "src/lib/server/london-course.json").read_text()))
