"""Publish locally verified discovered attacks, retaining complete source games."""
import glob,importlib.util,json,sys
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('discovery',ROOT/'scripts/collect-discovery.py')
miner=importlib.util.module_from_spec(spec);spec.loader.exec_module(miner)
def reply_coverage(record):
 start=chess.Board(record['fen']);b=start.copy();color=b.turn
 for san in record['moves'][:record['discoveryPly']]:b.push_san(san)
 baseline=max(miner.material(start,color),miner.material(b,color))
 b.push_san(record['moves'][record['discoveryPly']])
 if record['goal']=='mate':return {'mode':'mate','replies':{}} if b.is_checkmate() else None
 def safe(board):
  if board.is_stalemate():return False
  if miner.material(board,color)-baseline<100:return False
  for response in list(board.legal_moves):
   d=board.copy(stack=False);d.push(response)
   if d.is_checkmate() or miner.material(d,color)-baseline<100:return False
  return True
 if record['payoffPly']==record['discoveryPly']:
  return {'mode':'immediate','replies':{}} if safe(b) else None
 replies={};slider=chess.parse_square(record['sliderSquare']);mover=chess.parse_square(record['moverSquare']);target=chess.parse_square(record['targetSquare'])
 for reply in list(b.legal_moves):
  a=b.copy(stack=False);san=a.san(reply);a.push(reply);wins=[]
  for capture in list(a.legal_moves):
   if capture.from_square not in [slider,mover] or not a.is_capture(capture):continue
   if record['kind']=='attack':
    if capture.from_square==slider and capture.to_square!=target:continue
    if capture.from_square==mover and reply.from_square!=target:continue
   z=a.copy(stack=False);csan=z.san(capture);z.push(capture)
   if safe(z):wins.append(csan)
  if not wins:return None
  replies[san]=wins
 if record['moves'][-1] not in replies.get(record['moves'][-2],[]):return None
 return {'mode':'capture','replies':replies}

def mate_lines(proof):
 assert proof['status']=='proved'
 start=chess.Board(proof['fen']);side=start.turn;lines=[]
 def walk(board,left,path):
  node=proof['tree'][board.fen()+'|'+str(left)]
  if board.is_checkmate():
   assert board.turn!=side
   lines.append(path);return
  moves=[node['move']] if board.turn==side else node['replies']
  if board.turn!=side:assert set(moves)=={m.uci() for m in board.legal_moves}
  for uci in moves:
   move=chess.Move.from_uci(uci);assert move in board.legal_moves
   after=board.copy();san=board.san(move);after.push(move)
   walk(after,left-int(board.turn==side),path+[san])
 walk(start,proof['solverMoves'],[])
 return lines

def main():
 records={};positions=set();excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/discovery/excluded.json').read_text())}
 candidates=[]
 for path in sorted(glob.glob(str(ROOT/'scripts/fixtures/discovery/*.json'))):
  if Path(path).name=='published.json':continue
  data=json.loads(Path(path).read_text())
  if isinstance(data,dict):candidates.extend(data.get('records',[]))
 # A game can contain several motifs. Retain its more demanding verified lesson,
 # without counting the same source game in several levels.
 for r in sorted(candidates,key=lambda r:(-miner.LEVELS.index(r['level']),r['gameId'],r['ply'])):
  if r['gameId'] in records or r['gameId'] in excluded or r['fen'] in positions:continue
  coverage=reply_coverage(r)
  if not coverage:continue
  r['coverage']=coverage;records[r['gameId']]=r;positions.add(r['fen'])
 overrides=json.loads((ROOT/'scripts/fixtures/discovery/level-overrides.json').read_text())
 for override in overrides:
  assert override['level'] in miner.LEVELS,override
  r=records.get(override['gameId'])
  if r is not None:
   assert r['fen']==override['fen'],override['gameId']
   r['inferredLevel']=r['level'];r['level']=override['level']
   r['levelOverrideReason']=override['reason']
 curation_path=ROOT/'scripts/fixtures/discovery/level-a-curation.json'
 curation=json.loads(curation_path.read_text()) if curation_path.exists() else None
 if curation:
  allowed=set(curation['order'])
  records={key:r for key,r in records.items() if r['level']!='A' or key in allowed}
  assert {r['gameId'] for r in records.values() if r['level']=='A'}==allowed
  assert len(allowed)==24
  a_order={key:i for i,key in enumerate(curation['order'])}
 upper_path=ROOT/'scripts/fixtures/discovery/upper-curation.json'
 upper=json.loads(upper_path.read_text()) if upper_path.exists() else None
 if upper:
  for review in upper['reviews']:
   if review['decision']=='keep' and review['level']!=review['originalLevel']:
    r=records[review['gameId']]
    r.setdefault('inferredLevel',r['level']);r['level']=review['level']
    r['editorialLevelReason']=review['gradingReason']
  for level,ids in upper['order'].items():
   allowed=set(ids)
   records={key:r for key,r in records.items() if r['level']!=level or key in allowed}
   assert {r['gameId'] for r in records.values() if r['level']==level}==allowed,(level,allowed-{*records})
   assert 0<len(ids)<=upper['targetPerLevel']
  upper_order={key:i for ids in upper['order'].values() for i,key in enumerate(ids)}
 ordered=sorted(records.values(),key=lambda r:(miner.LEVELS.index(r['level']),a_order[r['gameId']] if curation and r['level']=='A' else upper_order[r['gameId']] if upper else r['solverMoves'],r['gameId']))
 counts={l:sum(r['level']==l for r in ordered) for l in miner.LEVELS}
 # Editorial quality takes priority over the original collection quota.
 assert all(n>0 for n in counts.values()),counts
 assert {r['kind'] for r in ordered}=={'check','attack'}
 exercises=[];sources={}
 proofs_path=ROOT/'scripts/fixtures/discovery/upper-mate-proofs.json'
 proofs={p['gameId']:p for p in json.loads(proofs_path.read_text())['proofs']} if upper else {}
 for r in ordered:
  prefix=r['moves'][:r['discoveryPly']+1]
  alternatives=[prefix+[reply,capture] for reply,captures in r['coverage']['replies'].items() for capture in captures]
  name='chiếu mở' if r['kind']=='check' else 'tấn công mở'
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],discoveryKind=r['kind'],prompt=f"Khai thác {name} để "+('chiếu hết.' if r['goal']=='mate' else 'thắng vật chất.'),mode='interactive',outcome='discovery',fen=r['fen'],moves=r['moves'],alternativeLines=[line for line in alternatives if line!=r['moves']],previousMove=r['previousMove'],source=r['source'],gameReference=dict(id=r['gameId'],kind='game',ply=r['ply'],branch=0,collection='discovery'),difficulty=dict(level=r['level'],status='suggested',reason=('Điều chỉnh mức độ theo đánh giá bài tập.' if 'levelOverrideReason' in r else 'Cấp độ xét theo độ sâu tính toán, sự phối hợp quân và yêu cầu thí quân.'),solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices'])),hints=['Tìm quân đang che đường của Xe, Tượng hoặc Hậu. Khi quân đó đi, quân phía sau sẽ tấn công mục tiêu nào?'],solution=f"Di chuyển quân chắn để mở đường cho quân ở {r['sliderSquare']} "+('chiếu Vua.' if r['kind']=='check' else f"tấn công quân ở {r['targetSquare']}.")))
  selected_curation=curation if r['level']=='A' else upper
  if selected_curation:
   exercise=exercises[-1]
   exercise['goal']='checkmate' if r['goal']=='mate' else 'material'
   review=next(row for row in selected_curation['reviews'] if row['gameId']==r['gameId'])
   assert r['fen']==review['fen'] and r['moves']==review['moves'],r['gameId']
   exercise['solution']=review['solutionVi']
   exercise['hints']=review['hintsVi']
   exercise['difficulty']['sacrificeCount']=review.get('sacrificeCount',len(r['sacrifices']))
   board=chess.Board(r['fen'])
   if r['goal']=='mate':
    exercise['outcome']='checkmate'
    if r['level']!='A':
     proof=proofs[r['gameId']]
     assert proof['fen']==r['fen'] and proof['moves']==r['moves']
     exercise['alternativeLines']=[line for line in mate_lines(proof) if line!=r['moves']]
    for move in list(board.legal_moves):
     after=board.copy();after.push(move)
     if after.is_checkmate() and [board.san(move)]!=r['moves']:
      exercise['alternativeLines'].append([board.san(move)])
  sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
 for name,data in [('discovery-exercises',exercises),('discovery-game-sources',sources)]:
  (ROOT/f'src/lib/server/{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'scripts/fixtures/discovery/published.json').write_text(json.dumps(dict(records=ordered),ensure_ascii=False,indent=2)+'\n')
 print(len(ordered),counts,{kind:sum(r['kind']==kind for r in ordered) for kind in ['check','attack']})
if __name__=='__main__':main()
