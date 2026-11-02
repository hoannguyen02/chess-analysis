"""Review longer lessons against shorter engine alternatives before assigning levels.

Run after collection and before building. Exact endpoints and fresh defensive
searches are required before a shorter line becomes a durable override.
"""
import importlib.util,json,sys,chess,chess.engine
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
s=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-simplification.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
records=json.loads((m.DATA/'researched.json').read_text())['records'];cache=json.loads((m.DATA/'tablebase.json').read_text());path=m.DATA/'reviewed.json';overrides={r['gameId']:r for r in json.loads(path.read_text())['records']}
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for raw in records:
  r=overrides.get(raw['gameId'],raw)
  if r['level'] not in ['D','C*']:continue
  b=chess.Board(r['fen']);best=r
  infos=engine.analyse(b,chess.engine.Limit(nodes=900000),multipv=3)
  for info in infos:
   pv=info.get('pv',[]);shape=m.inspect(b,pv)
   if not shape or shape['solverMoves']>=best['solverMoves']:continue
   end=chess.Board(shape['endFen']);expected=('win' if end.turn==b.turn else 'loss') if r['goal']=='win' else 'draw';tb=m.tablebase(end,cache)
   if not tb or tb['category']!=expected:continue
   walk=b.copy();defences=[];valid=True
   for i,san in enumerate(shape['moves']):
    walk.push_san(san)
    if i%2==0 and not walk.is_game_over():
     probe=engine.analyse(walk,chess.engine.Limit(nodes=300000));cp=probe['score'].pov(b.turn).score(mate_score=100000)
     defences.append(dict(ply=i+1,score=cp,pv=[x.uci() for x in probe['pv']]))
     if cp<(150 if r['goal']=='win' else -40):valid=False;break
   if not valid:continue
   best=dict(r,**shape)
   best['validation']=dict(engine=engine.id,depth=info['depth'],nodes=900000,principalVariation=[x.uci() for x in pv],defences=defences,tablebaseCategory=tb['category'],lineOrigin='editorial-shorter-engine-line')
   best['endingContinuation']=[]
   best['editorialReview']=dict(previousMoves=r['moves'],previousLevel=r['level'],reason='A fresh 900000-node three-variation search finds a shorter liquidation from this exact position. Endpoint is tablebase verified and each solver decision is checked with a fresh 300000-node defence search; use the shorter teaching line.')
  if best is not r:
   overrides[r['gameId']]=best;m.save(path,dict(records=list(overrides.values())));print(r['headers']['White'],r['level'],'->',best['level'],best['moves'],flush=True)
  else:print('retained',r['level'],r['headers']['White'],flush=True)
finally:engine.quit()
