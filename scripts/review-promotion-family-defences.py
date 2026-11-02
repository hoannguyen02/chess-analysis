from promotion_review_store import ReviewStore
"""Finite defensive review of every published exchange continuation; not a proof."""
import json,chess,chess.engine
from pathlib import Path
D=Path(__file__).resolve().parents[1]/'scripts/fixtures/promotion-family-review';engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2})
reviews_store=ReviewStore(D/'passed-pawn-simplification-reviews.json')
try:
 for i in list(reviews_store.records):
  r=reviews_store[i];b=chess.Board(r['fen']);color=b.turn;checks=[]
  for j,san in enumerate(r['moves']):
   b.push_san(san)
   if j%2==0:
    a=engine.analyse(b,chess.engine.Limit(nodes=500000));checks.append(dict(ply=j+1,score=a['score'].pov(color).score(mate_score=100000),pv=[m.uci() for m in a['pv']]))
  r['defenceScreen']=checks;reviews_store.put(i,r);print(i,min(x['score'] for x in checks),flush=True)
finally:engine.quit()
