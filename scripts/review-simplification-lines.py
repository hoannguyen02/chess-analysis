"""Prefer shorter verified original-game liquidations to longer analysis lines."""
import importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-simplification.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
records=json.loads((m.DATA/'published.json').read_text())['records'];cache=json.loads((m.DATA/'tablebase.json').read_text())
review_path=m.DATA/'reviewed.json'
overrides=json.loads(review_path.read_text())['records'] if review_path.exists() else []
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
try:
 for r in records:
  start=chess.Board(r['fen']);board=start.copy();pv=[]
  for san in r['gameMoves'][r['ply']:r['ply']+20]:
   move=board.parse_san(san);pv.append(move);board.push(move)
  shape=m.inspect(start,pv)
  if not shape or shape['solverMoves']>=r['solverMoves']:continue
  end=chess.Board(shape['endFen']);tb=m.tablebase(end,cache)
  expected=('win' if end.turn==start.turn else 'loss') if r['goal']=='win' else 'draw'
  if not tb or tb['category']!=expected:continue
  walk=start.copy();defences=[];valid=True
  for i,san in enumerate(shape['moves']):
   walk.push_san(san)
   if i%2==0 and not walk.is_game_over():
    probe=engine.analyse(walk,chess.engine.Limit(nodes=300000));cp=probe['score'].pov(start.turn).score(mate_score=100000)
    defences.append(dict(ply=i+1,score=cp,pv=[x.uci() for x in probe['pv']]))
    if cp<(150 if r['goal']=='win' else -40):valid=False;break
  if not valid:continue
  updated=dict(r,**shape)
  updated['validation']=dict(r['validation'],principalVariation=[x.uci() for x in pv],defences=defences,tablebaseCategory=tb['category'])
  updated['endingContinuation']=[]
  updated['editorialReview']=dict(previousMoves=r['moves'],previousLevel=r['level'],reason='The original game offers a shorter liquidation with the same verified endpoint goal. Prefer it rather than inflating difficulty with the longer engine continuation.')
  overrides=[x for x in overrides if x['gameId']!=r['gameId']]
  overrides.append(updated);print(r['headers']['White'],r['level'],'->',shape['level'],shape['moves'],flush=True)
finally:
 m.save(m.DATA/'reviewed.json',dict(records=overrides));engine.quit()
