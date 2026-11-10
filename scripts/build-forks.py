"""Publish reviewed real-game forks with a concrete payoff against every fork reply."""
import glob,importlib.util,json,sys
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('forks',ROOT/'scripts/collect-forks.py')
miner=importlib.util.module_from_spec(spec);spec.loader.exec_module(miner)
N={'P':'Tốt','N':'Mã','B':'Tượng','R':'Xe','Q':'Hậu','K':'Vua'}

def reviewed_bundle(data):
 """Validate durable additions; legacy retained records keep their old path."""
 if data.get('status')!='editorially-approved-bundle':return data.get('records',[])
 from fork_research import early_gate,record_hash
 from research_workflow import SETTINGS
 from research_editorial import _evidence
 from tactic_research import digest
 if data.get('topic')!='fork' or any(data.get('settings',{}).get(k,0)<v for k,v in SETTINGS.items()):
  raise ValueError('Fork additions require full-budget topic-specific review')
 decisions={r['gameId']:r for r in data['reviews']}
 evidence={r['gameId']:r for r in data['reviewResults']}
 batch_settings={}
 for batch in data.get('publicationBatches',[]):
  for ident in batch['recordIds']:
   if ident in batch_settings:raise ValueError('Conflicting publication batch ownership')
   batch_settings[ident]=batch['settings']
 records=[]
 for original in data['records']:
  ident=original['gameId'];r=dict(original);decision=decisions[ident];result=evidence[ident]
  settings=batch_settings.get(ident,data['settings'])
  if any(settings.get(k,0)<v for k,v in SETTINGS.items()):
   raise ValueError(f'{ident}: full-budget record-specific review required')
  if (decision.get('decision')!='keep' or result.get('status')!='needs-editorial-review'
      or result.get('flags') or decision.get('recordHash')!=record_hash(original)
      or result.get('recordHash')!=record_hash(original)):
   raise ValueError(f'{ident}: stale or missing tactical/editorial approval')
  if (decision.get('fullRecordSha256')!=digest(original)
      or decision.get('evidenceSha256')!=digest(_evidence(result))):
   raise ValueError(f'{ident}: changed candidate or tactical evidence binding')
  gate=early_gate(original,True)
  if gate['flags'] or gate['coverage']!=result.get('preflight',{}).get('coverage'):
   raise ValueError(f'{ident}: changed fork payoff, source or level')
  b=chess.Board(r['fen'])
  if {x['move'] for x in result.get('analysis',{}).get('roots',[])}!={b.san(m) for m in b.legal_moves}:
   raise ValueError(f'{ident}: every legal starting move must be compared')
  if len(result.get('timeline',{}).get('timeline',[]))!=r['solverMoves']:
   raise ValueError(f'{ident}: complete defensive/recovery timeline required')
  for key in ['reason','distinctness','solutionVi','hintsVi','reviewer']:
   if not decision.get(key):raise ValueError(f'{ident}: editorial {key} required')
  r['editorialCopy']={k:decision[k] for k in ['solutionVi','hintsVi']}
  records.append(r)
 return records
def reply_coverage(record):
 start=chess.Board(record['fen']);b=start.copy();color=b.turn
 for san in record['moves'][:record['forkPly']]:b.push_san(san)
 baseline=max(miner.material(start,color),miner.material(b,color))
 first=b.parse_san(record['moves'][record['forkPly']]);b.push(first)
 replies={}
 for reply in list(b.legal_moves):
  a=b.copy();san=a.san(reply);a.push(reply);wins=[]
  for capture in list(a.legal_moves):
   if capture.from_square!=first.to_square or chess.square_name(capture.to_square) not in record['targets'] or not a.is_capture(capture):continue
   z=a.copy();csan=z.san(capture);z.push(capture)
   if z.is_stalemate():continue
   worst=miner.material(z,color)
   for response in list(z.legal_moves):
    d=z.copy();d.push(response)
    worst=min(worst,miner.material(d,color))
    if d.is_checkmate():worst=-100000
   if worst-baseline>=100:wins.append(csan)
  if not wins:return None
  replies[san]=wins
 return replies or None

def main():
 records={};rejected=[];positions=set()
 excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/fork/excluded.json').read_text())}
 for path in sorted(glob.glob(str(ROOT/'scripts/fixtures/fork/*.json'))):
  if Path(path).name=='published.json':continue
  data=json.loads(Path(path).read_text())
  if not isinstance(data,dict) or 'records' not in data:continue
  for r in reviewed_bundle(data):
   if r['gameId'] in records or r['gameId'] in excluded or r['fen'] in positions:continue
   coverage=reply_coverage(r)
   if not coverage or r['moves'][-1] not in coverage.get(r['moves'][-2],[]):
    rejected.append(r['gameId']);continue
   r['forkReplies']=coverage;records[r['gameId']]=r;positions.add(r['fen'])
 ordered=sorted(records.values(),key=lambda r:(miner.LEVELS.index(r['level']),r['solverMoves'],r['gameId']))
 counts={level:sum(r['level']==level for r in ordered) for level in miner.LEVELS}
 assert all(count>=20 for count in counts.values()),f'Each fork level needs at least 20 distinct real games: {counts}'
 assert len({r['fen'] for r in ordered})==len(ordered),'Duplicate starting positions'
 exercises=[];sources={}
 for r in ordered:
  ref=dict(id=r['gameId'],kind='game',ply=r['ply'],branch=0,collection='fork')
  # Save each verified response at the fork so exploration can replay its payoff.
  prefix=r['moves'][:r['forkPly']+1]
  alternatives=[prefix+[reply,capture] for reply,captures in r['forkReplies'].items() for capture in captures]
  alternatives=[line for line in alternatives if line!=r['moves']]
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],prompt='Tạo đòn tấn công đôi rồi bắt quân để thắng vật chất.',mode='interactive',outcome='fork',fen=r['fen'],moves=r['moves'],alternativeLines=alternatives,previousMove=r['previousMove'],source=r['source'],gameReference=ref,difficulty=dict(level=r['level'],status='suggested',reason='Cấp độ xét theo độ sâu tính toán, sự phối hợp quân và yêu cầu thí quân.',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices'])),hints=['Tìm hai mục tiêu mà cùng một quân có thể tấn công. Kiểm tra nước đáp và khả năng bắt lại.'],solution=f"{N[r['forkPiece']]} ở {r['forkSquare']} tấn công đồng thời các mục tiêu ở "+', '.join(r['targets'])+'. Sau nước đáp, bắt quân để thu lợi về vật chất.'))
  if r.get('editorialCopy'):
   exercises[-1].update(goal=r['goal'],tacticPly=r['forkPly'],
    hints=r['editorialCopy']['hintsVi'],solution=r['editorialCopy']['solutionVi'])
  sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
 for name,data in [('fork-exercises',exercises),('fork-game-sources',sources)]:
  (ROOT/f'src/lib/server/{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 beginner=ROOT/'scripts/fixtures/fork/beginner.json'
 if beginner.exists():
  from beginner_tactics import approved_exercises
  items=approved_exercises(json.loads(beginner.read_text()))
  (ROOT/'src/lib/server/fork-beginner-exercises.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'scripts/fixtures/fork/published.json').write_text(json.dumps(dict(records=ordered,rejected=sorted(set(rejected)-records.keys())),ensure_ascii=False,indent=2)+'\n')
 print(len(ordered),'games',{l:sum(r['level']==l for r in ordered) for l in miner.LEVELS})
if __name__=='__main__':main()
