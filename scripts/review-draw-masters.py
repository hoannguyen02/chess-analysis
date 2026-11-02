"""Defensive and all-root engine review for newly mined master drawing resources."""
import chess,chess.engine,json,pathlib,hashlib,collections,sys
BASE=pathlib.Path(__file__).resolve().parent/'fixtures/draw-practice';OUT=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else BASE/'master-review.json'
def info_row(b,info,side):
 s=info['score'].pov(side);r=b.copy();line=[]
 for m in info.get('pv',[])[:20]:line.append(r.san(m));r.push(m)
 return dict(cp=s.score(),mate=s.mate(),depth=info.get('depth'),nodes=info.get('nodes'),line=line)
def main():
 pool=json.loads((pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else BASE/'master-candidates.json').read_text())['records']
 data=json.loads(OUT.read_text()) if OUT.exists() else dict(method='Engine screening, not exhaustive draw proof. All legal roots and all actual main-line positions through first cycle reviewed. Immediate checkmate tested on every root. Source continuation and teaching repetition extension kept separate.',records=[])
 done={r['id'] for r in data['records']};counts=collections.Counter(r['level'] for r in data['records'] if r['status']=='candidate')
 # Process actual sacrifices first; duplicates from a game remain unpublished candidates.
 pool.sort(key=lambda r:({'D':0,'C':1,'C*':2,'B':3,'A':4}[r['proposedLevel']],r['solverDecisions'],r['id']))
 with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as e:
  e.configure({'Threads':1,'Hash':128});data['engine']=e.id
  for index,r in enumerate(pool):
   if r['id'] in done:continue
   if r['proposedLevel']=='C*' and counts['C*']>=100:continue
   b=chess.Board(r['fen']);side=b.turn;rec=dict(id=r['id'],level=r['proposedLevel'],status='withheld',reason='',fen=r['fen'])
   def save():
    data['records'].append(rec);OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
   e.configure({'Clear Hash':None})
   root=info_row(b,e.analyse(b,chess.engine.Limit(nodes=150000)),side);rec['bestStart']=root
   if root['cp'] is None or abs(root['cp'])>60:rec['reason']='Starting position not reliably drawn at screening budget';save();continue
   if b.legal_moves.count()<2:rec['reason']='Only legal starting move';save();continue
   first=b.copy();first.push_san(r['moves'][0]);probe=info_row(first,e.analyse(first,chess.engine.Limit(nodes=150000)),side);rec['firstDefence']=probe
   if probe['cp'] is None or abs(probe['cp'])>60:rec['reason']='Recorded first move permits a stronger defence or unnecessary concession';save();continue
   rec['positions']=[];walk=b.copy();seen=set();bad=False
   for ply,san in enumerate(r['moves']):
    k=' '.join(walk.fen().split()[:4])
    if k in seen:break
    seen.add(k);move=walk.parse_san(san);walk.push(move)
    evidence=info_row(walk,e.analyse(walk,chess.engine.Limit(nodes=70000)),side)
    rec['positions'].append(dict(ply=ply+1,fen=walk.fen(en_passant='fen'),played=san,**evidence))
    if evidence['cp'] is None or abs(evidence['cp'])>85:bad=True;break
   if bad:rec['reason']='A stronger continuation changes the result inside the published line';save();continue
   roots=e.analyse(b,chess.engine.Limit(nodes=500000),multipv=b.legal_moves.count());rec['roots']=[]
   for i in roots:
    m=i['pv'][0];after=b.copy();after.push(m)
    rec['roots'].append(dict(move=b.san(m),immediateMate=after.is_checkmate(),**info_row(b,i,side)))
   # Explicitly cover immediate mate even if an engine returns fewer MultiPV entries.
   assert len(rec['roots'])==b.legal_moves.count()
   winning=[x for x in rec['roots'] if x['immediateMate'] or (x['mate'] is not None and x['mate']>0) or (x['cp'] is not None and x['cp']>110)]
   drawing=[x['move'] for x in rec['roots'] if x['cp'] is not None and abs(x['cp'])<=65]
   rec['drawingRootMoves']=drawing
   if winning:rec['reason']='Competing win flagged; do not ask for a draw';save();continue
   if r['moves'][0] not in drawing:rec['reason']='All-root review does not confirm the saved first move';save();continue
   if len(drawing)>4:rec['reason']='Too many easy drawing alternatives for an advanced tactical exercise';save();continue
   rec['status']='candidate';rec['reason']='Passed bounded tactical screens; requires motif, shorter-line and level editorial review';counts[rec['level']]+=1
   save();print(index,rec['level'],counts,r['headers'].get('White'),r['moves'][:8],flush=True)
 print('finished',dict(counts),flush=True)
if __name__=='__main__':main()
