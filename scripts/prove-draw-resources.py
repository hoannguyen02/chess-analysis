"""Bounded AND/OR non-losing strategy proof. No engine scores used as leaves.
A cycle leaf must return to an ancestor position (same turn and legal rights).
The strategy therefore stays in a finite safe graph until a draw is claimable.
Unknown is withheld, never labelled a refutation.
"""
import importlib.util,json,pathlib
import chess
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('review',P/'review-draw-collection.py'); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
OUT=mod.BASE/'resource-proofs.json'
def key(b):return ' '.join(b.fen().split()[:4])
def prove(row,limit=14000,depth=18):
 b=chess.Board(row['fen']); solver=b.turn; policy={}; sample=b.copy()
 for i,s in enumerate(row['moves']):
  if i%2==0:policy[key(sample)]=s
  sample.push_san(s)
 # Use saved engine lines only to order legal choices; proof leaves remain exact.
 evidence=json.loads((mod.BASE/'collection-review.json').read_text())
 rec=next((r for r in evidence['records'] if r['id']==row['id']),None)
 if rec:
  lines=[(row['fen'],v['line']) for v in rec['startingMoves']]
  lines.append((row['fen'],rec['bestStart']['line']))
  for step in rec['solverSteps']:
   if 'bestDefence' in step:
    t=chess.Board(step['fen']);t.push_san(step['move'])
    lines.append((t.fen(),step['bestDefence']['line']))
  for fen,line in lines:
   t=chess.Board(fen)
   for san in line:
    if t.turn==solver:policy.setdefault(key(t),san)
    t.push_san(san)
 nodes=0
 def search(b,path,left,forced=None):
  nonlocal nodes
  nodes+=1
  if nodes>limit:return None
  if b.is_stalemate() or b.is_insufficient_material():return {'terminal':'stalemate' if b.is_stalemate() else 'dead-position'}
  if b.is_checkmate():return None
  k=key(b)
  if k in path:return {'cycle':path.index(k)}
  if left<=0:return None
  path=path+[k]; moves=list(b.legal_moves)
  if b.turn==solver:
   desired=forced or policy.get(k)
   if forced:moves=[b.parse_san(forced)]
   else:
    candidates=[]
    for m in moves:
     san=b.san(m); check=b.gives_check(m); b.push(m); terminal=b.is_stalemate() or b.is_insufficient_material(); b.pop()
     if san==desired or check or terminal:candidates.append(m)
    moves=sorted(candidates,key=lambda m:(b.san(m)!=desired,not b.is_capture(m)))
   for m in moves:
    san=b.san(m); b.push(m); proof=search(b,path,left-1);b.pop()
    if proof is not None:return {'move':san,'next':proof}
   return None
  replies={}
  # Refute the narrow checking policy early with captures and mobile escapes.
  moves=sorted(moves,key=lambda m:not b.is_capture(m))
  for m in moves:
   san=b.san(m);b.push(m);proof=search(b,path,left-1);b.pop()
   if proof is None:return None
   replies[san]=proof
  return {'replies':replies}
 tree=search(b,[],depth,row['moves'][0])
 return dict(id=row['id'],fen=row['fen'],status='proved' if tree is not None else 'unverified',nodes=nodes,nodeLimit=limit,plyLimit=depth,tree=tree)
if __name__=='__main__':
 existing=json.loads(OUT.read_text()) if OUT.exists() else {'records':[]};done={r['id']:r for r in existing['records']}
 rows=[r for r in mod.sources() if r['category'] in ['perpetual-check','stalemate','repetition']]
 for i,r in enumerate(rows):
  if r['id'] in done:continue
  done[r['id']]=prove(r)
  OUT.write_text(json.dumps(dict(method='Universal legal-defence AND/OR tree; terminal dead position/stalemate or ancestor cycle. Solver restricted to stored moves, checks and immediate draw captures. Exhaustion is unverified.',records=list(done.values())),ensure_ascii=False,indent=2)+'\n')
  if (i+1)%10==0:print(i+1,len(rows),'proved',sum(x['status']=='proved' for x in done.values()),flush=True)
