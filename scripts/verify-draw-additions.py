import json,chess,chess.engine,pathlib
p=pathlib.Path(__file__).resolve().parent/'fixtures/draw-practice';rows=json.load(open(p/'selected-additions.json'))['records'];out={'method':'Fresh 600k-node mainline positions and 400k-node individual alternative roots; engine analysis is bounded, not an exhaustive draw proof.','records':[]}
if (p/'addition-final-review.json').exists():out=json.load(open(p/'addition-final-review.json'))
done={r['id'] for r in out['records']}
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as e:
 e.configure({'Threads':1,'Hash':128})
 ev={r['id']:r for f in ['master-review.json','study-review.json','deep-review.json','lower-review.json'] for r in json.load(open(p/f))['records']}
 for r in rows:
  if r['id'] in done:continue
  b=chess.Board(r['fen']);side=b.turn;seen=set();rec={'id':r['id'],'positions':[],'alternatives':[],'status':'reviewed'}
  for s in r['moves']:
   k=' '.join(b.fen().split()[:4])
   if k in seen:break
   seen.add(k);fen=b.fen();m=b.parse_san(s);b.push(m)
   if b.is_game_over():break
   info=e.analyse(b,chess.engine.Limit(nodes=600000));sc=info['score'].pov(side);t=b.copy();pv=[]
   for mv in info.get('pv',[])[:24]:pv.append(t.san(mv));t.push(mv)
   rec['positions'].append({'fen':fen,'move':s,'cp':sc.score(),'mate':sc.mate(),'reply':pv,'nodes':info['nodes']})
   if sc.mate() or sc.score() is None or abs(sc.score())>100:rec['status']='flagged'
  b=chess.Board(r['fen'])
  for s in ev[r['id']]['drawingRootMoves']:
   if s==r['moves'][0]:continue
   info=e.analyse(b,chess.engine.Limit(nodes=400000),root_moves=[b.parse_san(s)]);sc=info['score'].pov(side);t=b.copy();pv=[]
   for mv in info.get('pv',[])[:24]:pv.append(t.san(mv));t.push(mv)
   rec['alternatives'].append({'move':s,'cp':sc.score(),'mate':sc.mate(),'line':pv,'nodes':info['nodes']})
  out['records'].append(rec);(p/'addition-final-review.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(r['id'],rec['status'],flush=True)
