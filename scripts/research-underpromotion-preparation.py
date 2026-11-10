"""Screen earlier master-game positions for C/D sacrifices and longer C* ideas.
Candidates only: engine lines are not all-defence certificates.
"""
import json,chess,chess.engine,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-expansion'
spec=importlib.util.spec_from_file_location('promotion',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2});out=[]
try:
 for r in json.loads((D/'archive-leads.json').read_text()):
  for offset in [0,2,4,6,8]:
   ply=r['ply']-offset
   if ply<0:continue
   b=chess.Board(r['gameFen'])
   for san in r['gameMoves'][:ply]:b.push_san(san)
   info=engine.analyse(b,chess.engine.Limit(nodes=250000));pv=info.get('pv',[]);shape=m.inspect(b,pv)
   out.append(dict(gameId=r['gameId'],ply=ply,fen=b.fen(en_passant='fen'),pv=[x.uci() for x in pv],mate=info['score'].pov(b.turn).mate(),shape=shape,decision='lead-only' if shape and any(p['piece']!='Q' for p in shape['promotions']) else 'No publishable underpromotion mate established by this finite screen.'))
finally:engine.quit()
(D/'preparation-review.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('positions',len(out),'leads',[(x['gameId'],x['ply'],x['shape']['level']) for x in out if x['decision']=='lead-only'])
