"""Finite engine comparison of every legal root in historical underpromotion leads."""
import json,chess,chess.engine
from pathlib import Path
D=Path(__file__).resolve().parents[1]/'scripts/fixtures/promotion-expansion';rows=json.loads((D/'archive-leads.json').read_text());engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128});out=[]
try:
 for r in rows:
  b=chess.Board(r['fen']);roots=[]
  for m in b.legal_moves:
   c=b.copy();c.push(m);a=engine.analyse(c,chess.engine.Limit(nodes=200000));roots.append(dict(move=b.san(m),score=a['score'].pov(b.turn).score(mate_score=100000),mate=a['score'].pov(b.turn).mate(),pv=[x.uci() for x in a.get('pv',[])]))
  r=dict(r,roots=roots);out.append(r);(D/'archive-root-review.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
  print(r['headers']['White'],r['headers']['Black'],sorted([(x['score'],x['move']) for x in roots],reverse=True)[:5],flush=True)
finally:engine.quit()
