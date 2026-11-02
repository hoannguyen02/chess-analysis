import json,chess,chess.engine
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];f=ROOT/'scripts/fixtures/discovery';rs=json.loads((f/'second-pass-candidates.json').read_text())['candidates'];a=json.loads((f/'second-pass-analysis.json').read_text())['reviews'];flagged={r['gameId'] for r in a if 'material-on-direct-move-before-discovered-target' in r['flags']};rows=[]
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as e:
 e.configure({'Threads':1,'Hash':64})
 for r in rs:
  if r['gameId'] not in flagged:continue
  b=chess.Board(r['fen']);side=b.turn
  for san in r['moves'][:r['discoveryPly']+1]:b.push_san(san)
  branches=[]
  for m in list(b.legal_moves):
   response=b.san(m);z=b.copy();z.push(m)
   roots=[move for move in z.legal_moves if not (move.from_square==chess.parse_square(r['sliderSquare']) and move.to_square==chess.parse_square(r['targetSquare']))]
   info=e.analyse(z,chess.engine.Limit(nodes=1000000),root_moves=roots);v=z.copy();pv=[]
   for move in info['pv']:pv.append(v.san(move));v.push(move)
   branches.append({'reply':response,'withoutTargetCapture':pv,'cp':info['score'].pov(side).score(),'mate':info['score'].pov(side).mate()})
  rows.append({'gameId':r['gameId'],'fen':r['fen'],'moves':r['moves'],'branches':branches});print(r['gameId'],branches,flush=True)
(f/'second-pass-independent-payoffs.json').write_text(json.dumps({'method':'One-million-node continuation probes after every immediate discovery defence, excluding the revealed target capture on the next solver move. Finite engine evidence supports editorial review; not an exhaustive proof.','reviews':rows},ensure_ascii=False,indent=2)+'\n')
