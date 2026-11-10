"""Rebuild bundled, all-defence material certificates for the A expansion.

Use --analyse to run or reuse the finite all-root engine screen; pass
--refresh-analysis to bypass its exact-settings cache. Neither an engine score
nor a sample line is used as the material certificate.
"""
import argparse,hashlib,json
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'scripts/fixtures/promotion-split/material-a-expansion.json'
VALUES={chess.PAWN:100,chess.KNIGHT:320,chess.BISHOP:330,chess.ROOK:500,chess.QUEEN:900,chess.KING:0}
ANALYSIS_NODES=600000

def atomic_json(path,data):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.tmp')
 tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)

def analysis_cache_path(cache_dir,fen,engine_id,multipv):
 identity={'fen':fen,'engine':engine_id,'nodes':ANALYSIS_NODES,'multipv':multipv,'options':{'Threads':2,'Hash':64}}
 key=hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()
 return Path(cache_dir)/(key+'.json')

def certificate_signature(exercise):
 identity={k:exercise.get(k) for k in ('fen','moves','promotionGain')}
 return hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()
def balance(b,color):return sum(VALUES[p.piece_type]*(1 if p.color==color else -1) for p in b.piece_map().values())
def checking_safety(b,color,baseline,minimum,left=2):
 """Secure an existing gain through checks; never count later recovery of lost material."""
 if balance(b,color)-baseline<minimum:return None
 if b.is_checkmate():return {'settled':True} if b.turn!=color else None
 if b.is_game_over(claim_draw=True):return None
 if b.turn==color:
  if not b.is_check():return {'settled':True}
  if not left:return None
  for m in b.legal_moves:
   c=b.copy();c.push(m);proof=checking_safety(c,color,baseline,minimum,left-1)
   if proof is not None:return {'move':m.uci(),'child':proof}
  return None
 replies={}
 for m in b.legal_moves:
  c=b.copy();c.push(m);proof=checking_safety(c,color,baseline,minimum,left)
  if proof is None:return None
  replies[m.uci()]=proof
 return {'replies':replies} if replies else None
def certify(e):
 start=chess.Board(e['fen']);assert start.is_valid();color=start.turn;baseline=balance(start,color);nodes={};root=start.parse_san(e['moves'][0]);limit=e['promotionGain']['solverMoves'];minimum=e['promotionGain']['minimumGain'];visits=0
 def visit(b,left,promoted,first=False):
  nonlocal visits
  visits+=1;assert visits<100000,'Certificate search budget exceeded'
  key=b.fen(en_passant='fen')+'|'+str(left)
  mate=b.is_checkmate() and b.turn!=color
  objective=promoted or e['promotionGain'].get('allowUnrealizedThreat',False)
  if objective and balance(b,color)-baseline>=minimum and (mate or (b.turn==color and not b.is_game_over(claim_draw=True))):
   safety=checking_safety(b,color,baseline,minimum) if e['promotionGain'].get('verifyCheckingReplies') else {}
   if safety is None:return False
   nodes[key]={'gain':balance(b,color)-baseline}
   if safety:nodes[key]['checkSafety']=safety
   if mate:nodes[key]['mate']=True
   return True
  if b.is_game_over(claim_draw=True):return False
  if b.turn==color:
   if not left:return False
   moves=[root] if first else sorted(b.legal_moves,key=lambda m:(not bool(m.promotion),-{chess.QUEEN:9,chess.ROOK:5,chess.BISHOP:3,chess.KNIGHT:3}.get(m.promotion,0),not b.is_capture(m),m.uci()))
   for m in moves:
    child=b.copy();child.push(m)
    if visit(child,left-1,promoted or bool(m.promotion)):
     nodes[key]={'move':m.uci()};return True
   return False
  replies=list(b.legal_moves)
  for m in replies:
   child=b.copy();child.push(m)
   if not visit(child,left,promoted):return False
  nodes[key]={'replies':[m.uci() for m in replies]};return bool(replies)
 assert visit(start,limit,False,True),e['id']
 # Keep only the accepted strategy, not abandoned solver branches.
 kept={}
 def collect(b,left):
  key=b.fen(en_passant='fen')+'|'+str(left)
  if key in kept:return
  node=nodes[key];kept[key]=node
  for u in ([node['move']] if 'move' in node else node.get('replies',[])):
   c=b.copy();c.push_uci(u);collect(c,left-int(b.turn==color))
 collect(start,limit)
 result=dict(fen=e['fen'],solverMoves=limit,nodes=kept)
 if e['promotionGain'].get('allowUnrealizedThreat'):result['allowUnrealizedThreat']=True
 return result
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--analyse',action='store_true');ap.add_argument('--refresh-analysis',action='store_true',help='ignore cached root screens');ap.add_argument('--cache-dir',default='/tmp/promotion-engine-cache');args=ap.parse_args();data=json.loads(PATH.read_text());engine=None
 if args.analyse:
  engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':64})
 try:
  for r in data['records']:
   e=r['exercise'];b=chess.Board(e['fen']);color=b.turn;baseline=balance(b,color)
   if engine:
    multipv=len(list(b.legal_moves));cache=analysis_cache_path(args.cache_dir,b.fen(en_passant='fen'),engine.id,multipv)
    cached=json.loads(cache.read_text()) if cache.exists() and not args.refresh_analysis else None
    if cached is not None:
     root_review=cached['rootReview'];print(e['id'],'engine cache hit',flush=True)
    else:
     infos=engine.analyse(b,chess.engine.Limit(nodes=ANALYSIS_NODES),multipv=multipv)
     root_review=[dict(uci=i['pv'][0].uci(),san=b.san(i['pv'][0]),mate=i['score'].pov(color).mate(),cp=i['score'].pov(color).score(),pv=[m.uci() for m in i['pv']]) for i in infos]
     atomic_json(cache,{'identity':{'fen':b.fen(en_passant='fen'),'engine':engine.id,'nodes':ANALYSIS_NODES,'multipv':multipv,'options':{'Threads':2,'Hash':64}},'rootReview':root_review})
     print(e['id'],'engine analyzed',flush=True)
    r['rootReview']=root_review
    r['engineScreen']=dict(engine=engine.id,nodes=ANALYSIS_NODES,multipv=multipv,scope='All legal roots; finite engine screen, not a mate proof.',cacheKey=cache.stem)
   assert {x['uci'] for x in r['rootReview']}=={m.uci() for m in b.legal_moves}
   for move in list(b.legal_moves):
    child=b.copy();child.push(move);assert not child.is_checkmate(),(e['id'],b.san(move))
    if b.is_capture(move) and not move.promotion:
     gains=[]
     for reply in child.legal_moves:
      end=child.copy();end.push(reply);gains.append(balance(end,color)-baseline)
     assert gains and min(gains)<=0,(e['id'],'free capture',b.san(move))
   for row in r['rootReview']:
    assert not (len(row['uci'])==4 and row['mate'] is not None and 0<row['mate']<=e['promotionGain']['solverMoves']),(e['id'],'short competing mate',row)
    walk=b.copy()
    for u in row['pv']:walk.push_uci(u)
   signature=certificate_signature(e)
   if r.get('certificate') and r.get('certificateInput')==signature:
    print(e['id'],'certificate checkpoint hit',flush=True)
   else:
    r['certificate']=certify(e);r['certificateInput']=signature
   walk=b.copy()
   for san in e['moves']:walk.push_san(san)
   assert not walk.is_game_over() and balance(walk,color)-baseline>=e['promotionGain']['minimumGain']
   print(e['id'],len(r['certificate']['nodes']),'certificate nodes',flush=True)
   # Save each finished record so interruption loses at most the active record.
   atomic_json(PATH,data)
 finally:
  if engine:engine.quit()
 atomic_json(PATH,data)
if __name__=='__main__':main()
