from promotion_review_store import ReviewStore
from mate_proof_store import MateProofStore
"""Proof certificates enumerate every legal reply; root screens are explicitly finite."""
import json,chess,chess.engine,time
from pathlib import Path
from two_rook_mate_proof import verify_certificate
D=Path(__file__).resolve().parents[1]/'scripts/fixtures/promotion-expansion';engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
proof_store=MateProofStore(D.parent/'promotion')
def save(n,x):(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def key(b,left):return b.fen(en_passant='fen')+'|'+str(left)
try:
 for r in json.loads((D/'candidates.json').read_text()):
  start=chess.Board(r['fen']);color=start.turn;roots=[]
  for move in start.legal_moves:
   b=start.copy();b.push(move);info=engine.analyse(b,chess.engine.Limit(nodes=600000));roots.append(dict(move=start.san(move),immediateMate=b.is_checkmate(),score=info['score'].pov(color).score(mate_score=100000),mate=info['score'].pov(color).mate(),pv=[x.uci() for x in info.get('pv',[])]))
  ReviewStore(D/'root-reviews.json').put(r['id'],dict(fen=r['fen'],roots=roots,nodesPerRoot=600000))
  nodes={};preferred={};walk=start.copy()
  for san in r['moves']:
   move=walk.parse_san(san)
   if walk.turn==color:preferred[walk.fen(en_passant='fen')]=move
   walk.push(move)
  deadline=time.monotonic()+100;count=0
  values={1:100,2:320,3:330,4:500,5:900,6:0}
  def mat(b):return sum(values[p.piece_type]*(1 if p.color==color else -1) for p in b.piece_map().values())
  baseline=mat(start)
  def visit(b,left):
   global count
   count+=1
   if time.monotonic()>deadline or count>30000:raise TimeoutError()
   k=key(b,left)
   if k in nodes:return True
   if r['goal']=='material' and b.turn==color and left==0:
    gain=mat(b)-baseline
    if gain>=r['minimumGain'] and not b.is_game_over():nodes[k]={'gain':gain};return True
    return False
   if b.is_checkmate():
    if b.turn!=color and r['goal']=='checkmate':nodes[k]={'mate':True};return True
    return False
   if b.is_game_over() or (left<=0 and (b.turn==color or r['goal']=='checkmate')):return False
   legal=list(b.legal_moves)
   if b.turn!=color:
    for m in legal:
     c=b.copy();c.push(m)
     if not visit(c,left):return False
    nodes[k]={'replies':[m.uci() for m in legal]};return True
   fixed=preferred.get(b.fen(en_passant='fen'))
   if fixed:candidates=[fixed]
   elif left==1:candidates=[m for m in legal if b.gives_check(m)]
   else:candidates=engine.analyse(b,chess.engine.Limit(nodes=100000)).get('pv',[])[:1]
   for m in candidates:
    c=b.copy();c.push(m)
    if visit(c,left-1):nodes[k]={'move':m.uci()};return True
   return False
  try:success=visit(start,r['solverMoves'])
  except TimeoutError:success=False
  if success:
   proof=dict(gameId=r['id'],fen=r['fen'],moves=r['moves'],solverMoves=r['solverMoves'],nodes=nodes)
   if r['goal']=='checkmate':verify_certificate(proof)
   proof_store.put(r['id'],proof)
  print(r['id'],success,count,[(x['move'],x['mate']) for x in roots if '=' in x['move']],flush=True)
finally:engine.quit()
