from mate_proof_store import MateProofStore
"""Build bounded mate certificates: all defender replies, one winning attacker move.
Stockfish proposes moves only; the saved tree is verified by legal move enumeration.
"""
import argparse,importlib.util,json,sys,time
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-anastasia-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
D=m.DATA;ap=argparse.ArgumentParser();ap.add_argument('--excluded-only',action='store_true');ap.add_argument('--composed',action='store_true');args=ap.parse_args()
proof_store=MateProofStore(D)
records=json.loads((D/'composed-candidates.json').read_text()) if args.composed else json.loads((D/'master-researched.json').read_text())['records'];excluded=[] if args.composed else json.loads((D/'master-excluded.json').read_text());engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
# Certificates are written atomically to the shared topic bundle.
def key(b,left):return b.fen(en_passant='fen')+'|'+str(left)
def prove(r):
 start=chess.Board(r['fen']);color=start.turn;preferred={};walk=start.copy()
 for san in r['moves']:
  move=walk.parse_san(san)
  if walk.turn==color:preferred[walk.fen(en_passant='fen')]=move
  walk.push(move)
 nodes={};failed=set();deadline=time.monotonic()+75;count=0
 def visit(b,left):
  nonlocal count
  k=key(b,left)
  if k in nodes:return True
  if k in failed:return False
  count+=1
  if count>12000 or time.monotonic()>deadline:raise TimeoutError()
  if b.is_checkmate():
   if b.turn==color:return False
   nodes[k]={'mate':True};return True
  if left<=0 or b.is_game_over(claim_draw=True):return False
  legal=list(b.legal_moves)
  if b.turn!=color:
   for move in legal:
    child=b.copy();child.push(move)
    if not visit(child,left):failed.add(k);return False
   nodes[k]={'replies':[move.uci() for move in legal]};return True
  fixed=preferred.get(b.fen(en_passant='fen'))
  if fixed:candidates=[fixed]
  elif left==1:candidates=[x for x in legal if b.gives_check(x)]
  else:
   info=engine.analyse(b,chess.engine.Limit(nodes=30000))
   candidates=info.get('pv',[])[:1]
  for move in candidates:
   child=b.copy();child.push(move)
   if visit(child,left-1):nodes[k]={'move':move.uci()};return True
  failed.add(k);return False
 try:success=visit(start,r['solverMoves'])
 except TimeoutError:success=False
 if success:
  # Only retain reachable certificate nodes. Failed exploratory nodes are irrelevant.
  reachable={}
  def retain(b,left):
   k=key(b,left)
   if k in reachable:return
   node=nodes[k];reachable[k]=node
   for uci in ([node['move']] if 'move' in node else node.get('replies',[])):
    child=b.copy();child.push_uci(uci);retain(child,left-(b.turn==color))
  retain(start,r['solverMoves'])
  proof_store.put(r['gameId'],dict(gameId=r['gameId'],fen=r['fen'],moves=r['moves'],solverMoves=r['solverMoves'],nodes=reachable))
 return success,count
# Reviewed rejections are durable exclusions, not missing proof work.
review_file=D/'composed-reviewed.json'
rejected_compositions={r['gameId'] for r in json.loads(review_file.read_text()) if r['decision']=='rejected'} if args.composed and review_file.exists() else set()
try:
 for r in records:
  if r['gameId'] in rejected_compositions:continue
  if args.excluded_only and r['gameId'] not in {x['gameId'] for x in excluded}:continue
  if r['gameId'] in proof_store:continue
  ok,count=prove(r);print(r['gameId'],r.get('headers',{}).get('White','composed'),ok,count,flush=True)
finally:engine.quit()
