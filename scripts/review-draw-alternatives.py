"""Fresh-hash review of all screen-identified drawing root alternatives."""
import json,pathlib,chess,chess.engine
P=pathlib.Path(__file__).resolve().parent/'fixtures/draw-practice'
rows=json.load(open(P/'selected-additions.json'))['records'];screen={r['id']:r for f in ['master-review.json','study-review.json','deep-review.json','lower-review.json'] for r in json.load(open(P/f))['records']};out={'method':'Every screen-identified alternate drawing root analysed from its resulting FEN with a fresh hash, 1M nodes. This is bounded analysis, not an exhaustive proof.','records':[]}
if (P/'addition-alternatives.json').exists():out=json.load(open(P/'addition-alternatives.json'))
done={(r['id'],r['move']) for r in out['records']}
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as e:
 e.configure({'Threads':1,'Hash':128})
 for r in rows:
  for san in screen[r['id']]['drawingRootMoves']:
   if san==r['moves'][0] or (r['id'],san) in done:continue
   b=chess.Board(r['fen']);side=b.turn;b.push_san(san);fen=b.fen();e.configure({'Clear Hash':None});info=e.analyse(b,chess.engine.Limit(nodes=1000000));sc=info['score'].pov(side);line=[]
   for m in info.get('pv',[]):line.append(b.san(m));b.push(m)
   out['records'].append({'id':r['id'],'move':san,'fen':fen,'cp':sc.score(),'mate':sc.mate(),'line':line,'nodes':info['nodes']});(P/'addition-alternatives.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(r['id'],san,sc,' '.join(line[:14]),flush=True)
