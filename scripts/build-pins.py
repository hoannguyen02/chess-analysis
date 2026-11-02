"""Immediate material-winning beginner pins and audited master-game tactics."""
import chess, json, random, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
V={1:100,2:320,3:330,4:500,5:900,6:0}
N={3:'Tượng',4:'Xe',5:'Hậu'}
def material(b,c):return sum(V[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def aligned(b,attacker,front,back):
 return front in b.attacks(attacker) and bool(chess.between(attacker,back)&chess.BB_SQUARES[front])
def recognition_candidates():
 rng=random.Random(240126);groups=[]
 for kind in ['king','queen']:
  for pt in [4,3,5]:
   out=[]
   for attempt in range(200000):
    if len(out)==10:break
    squares=rng.sample(range(64),5 if kind=='queen' else 4)
    origin,own,front,back=squares[:4];enemy=squares[4] if kind=='queen' else back
    b=chess.Board(None)
    for sq,p,c in [(origin,pt,True),(own,6,True),(front,2,False),(back,5 if kind=='queen' else 6,False)]:b.set_piece_at(sq,chess.Piece(p,c))
    if kind=='queen':b.set_piece_at(enemy,chess.Piece(6,False))
    if not b.is_valid() or b.is_check() or aligned(b,origin,front,back):continue
    if any(b.is_capture(m) for m in b.legal_moves):continue
    lines=[]
    for move in list(b.legal_moves):
     if move.from_square!=origin or b.is_capture(move):continue
     a=b.copy();san=a.san(move);a.push(move)
     if a.is_check() or not aligned(a,move.to_square,front,back):continue
     if kind=='king' and not a.is_pinned(False,front):continue
     if any(m.to_square==move.to_square and a.is_capture(m) for m in a.legal_moves):continue
     lines.append([san])
    if not lines:continue
    out.append(dict(title=f'{N[pt]} tạo đòn ghim · {len(out)+1}',beginner=True,beginnerKind=kind,
     prompt=f'Dùng {N[pt].lower()} ghim Mã vào '+('Vua.' if kind=='king' else 'Hậu.'),
     mode='interactive',outcome='pin',fen=b.fen(),moves=lines[0],alternativeLines=lines[1:],
     hints=['Tìm đường thẳng hoặc đường chéo có Mã đứng trước '+('Vua.' if kind=='king' else 'Hậu.')],
     solution=('Mã bị ghim vào Vua: Mã không thể đi vì sẽ làm lộ chiếu.' if kind=='king' else 'Mã bị ghim vào Hậu. Mã vẫn được đi, nhưng có thể để mất Hậu phía sau. Tạo đòn ghim chưa có nghĩa là đã thắng quân.')))
   assert len(out)==10,(kind,pt,len(out))
   groups.append(out)
 return [groups[k*3+g][i] for k in range(2) for i in range(10) for g in range(3)]
def winning_lines(e):
 start=chess.Board(e['fen']);color=start.turn;baseline=material(start,color);result=[];rejected=[]
 for line in [e['moves']]+e['alternativeLines']:
  b=start.copy();first=b.parse_san(line[0]);b.push(first);branches=[];replies=list(b.legal_moves)
  if not replies:continue
  for reply in replies:
   a=b.copy();replysan=a.san(reply);a.push(reply);wins=[]
   for capture in list(a.legal_moves):
    if capture.from_square!=first.to_square or not a.is_capture(capture):continue
    z=a.copy();san=z.san(capture);z.push(capture)
    if z.is_stalemate():continue
    worst=material(z,color)
    for defence in list(z.legal_moves):
     d=z.copy();d.push(defence)
     worst=min(worst,material(d,color))
     if d.is_checkmate():worst=-100000
    if worst-baseline>=100:wins.append([line[0],replysan,san])
   if not wins:
    rejected.append([line[0],replysan]);break
   branches+=wins
  else:result+=branches
 return result,rejected

def intro():
 exercises=[];audit=[]
 excluded={r['fen']:r['reason'] for r in json.loads((ROOT/'scripts/fixtures/pin/beginner-excluded.json').read_text())}
 for candidate in recognition_candidates():
  lines,rejected=winning_lines(candidate)
  audit.append(dict(fen=candidate['fen'],title=candidate['title'],kind=candidate['beginnerKind'],accepted=bool(lines) and candidate['fen'] not in excluded,rejectedRoots=rejected,branches=len(lines),editorialExclusion=excluded.get(candidate['fen'])))
  if not lines or candidate['fen'] in excluded:continue
  candidate.update(title=candidate['title'].split(' · ')[0].replace('tạo đòn ghim','ghim và bắt quân'),
   goal='material',source='original-composition',prompt='Tạo đòn ghim rồi bắt quân ở nước tiếp theo.',moves=lines[0],alternativeLines=lines[1:],
   hints=['Ghim Mã vào Vua. Kiểm tra xem sau khi Vua đi, Mã có còn được bảo vệ không.'],
   solution='Ghim Mã, rồi bắt Mã ở nước tiếp theo. Quân bắt Mã không bị bắt lại.')
  exercises.append(candidate)
 (ROOT/'scripts/fixtures/pin/beginner-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 reviewed=json.loads((ROOT/'scripts/fixtures/pin/beginner-reviewed.json').read_text())
 import importlib.util
 spec=importlib.util.spec_from_file_location('pin_beginner_review',ROOT/'scripts/review-pin-beginners.py')
 review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
 for record in reviewed:
  if record['exercise']['fen'] in excluded:continue
  review.verify(record)
  review.verify_editorial(record)
  exercise=dict(record['exercise'])
  if record.get('publicationDifficulty'):
   exercise.pop('beginner',None)
   exercise.pop('beginnerKind',None)
   exercise['difficulty']=record['publicationDifficulty']
  exercises.append(exercise)
 creation_spec=importlib.util.spec_from_file_location('pin_creation_review',ROOT/'scripts/review-pin-creation.py')
 creation_review=importlib.util.module_from_spec(creation_spec);creation_spec.loader.exec_module(creation_review)
 for record in json.loads((ROOT/'scripts/fixtures/pin/beginner-creation.json').read_text()):
  if record['exercise']['fen'] in excluded:continue
  creation_review.verify(record)
  exercises.append(record['exercise'])
 assert len({e['fen'] for e in exercises})==len(exercises)
 # Keep the reviewed positions while mixing pinned pieces from the first lesson.
 order=json.loads((ROOT/'scripts/fixtures/pin/beginner-order.json').read_text())
 by_fen={e['fen']:e for e in exercises}
 assert len(order)==len(exercises) and {r['fen'] for r in order}==set(by_fen)
 return [by_fen[r['fen']] for r in order]

def masters():
 records=json.loads((ROOT/'scripts/fixtures/pin/researched.json').read_text())['records']
 excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/pin/excluded.json').read_text())}
 records=[r for r in records if r['gameId'] not in excluded]
 overrides=json.loads((ROOT/'scripts/fixtures/pin/level-overrides.json').read_text())
 records=[dict(r,level=overrides.get(r['gameId'],{}).get('level',r['level'])) for r in records]
 exercises=[];sources={};audit=[]
 levels=['A','B','C','C*','D']
 counts={level:sum(r['level']==level for r in records) for level in levels}
 assert all(count>=20 for count in counts.values()),f'Each level needs at least 20 real games: {counts}'
 assert len({r['gameId'] for r in records})==len(records),'Duplicate source game'
 assert len({r['fen'] for r in records})==len(records),'Duplicate exercise position'
 for r in sorted(records,key=lambda r:(levels.index(r['level']),r['solverMoves'],r['gameId'])):
  ident=r['gameId']
  idea=(f"Quân ở {r['pinSquare']} bị ghim vào Vua nên không thể bắt lại trên ô cần bảo vệ."
        if r['motif']=='pinned-defender' else f"Tăng sức ép và bắt quân bị ghim ở {r['pinSquare']}.")
  if r['motif']=='relative-capture':
   idea=f"Quân ở {r['pinSquare']} bị ghim vào quân có giá trị cao hơn ở {r['backSquare']}. Khai thác đòn ghim để thắng vật chất."
  hint=('Tìm quân đứng trước quân có giá trị cao hơn trên cùng đường tấn công.' if r['motif']=='relative-capture' else 'Tìm quân bị ghim vào Vua: quân đó có còn bắt lại hoặc bảo vệ được không?')
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],
   prompt='Khai thác đòn ghim để '+('chiếu hết.' if r.get('goal')=='mate' else 'thắng vật chất.'),mode='interactive',outcome='pin',
   fen=r['fen'],moves=r['moves'],alternativeLines=r['alternatives'],previousMove=r['previousMove'],
   source=r['source'],gameReference=dict(id=ident,kind='game',ply=r['ply'],branch=0,collection='pin'),
   difficulty=dict(level=r['level'],status='suggested',reason=overrides.get(ident,{}).get('reason','Cấp độ xét theo độ sâu tính toán, sự phối hợp quân và yêu cầu thí quân.'),solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices'])),
   hints=[hint],
   solution=idea))
  sources[ident]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
  audit.append({key:r.get(key) for key in ['gameId','pinSquare','pinner','backSquare','goal','motif','gain','localGain','settlement','validation']})
 return exercises,sources,audit
if __name__=='__main__':
 beginner=intro();games,sources,audit=masters()
 for name,data in [('pin-exercises',beginner+games),('pin-game-sources',sources),('pin-audit',audit)]:
  (ROOT/f'src/lib/server/{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print('Beginner',sum(bool(e.get('beginner')) for e in beginner),'Graded compositions',sum(not e.get('beginner') for e in beginner),'Master games',len(games),{l:sum(e['difficulty']['level']==l for e in games) for l in ['A','B','C','C*','D']})
