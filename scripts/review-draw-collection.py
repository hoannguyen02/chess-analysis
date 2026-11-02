"""Offline review evidence; engine screens are not proofs of forced draws.
Preserves the entire source pool. The separate selection is the publication gate.
"""
import collections, hashlib, io, json, pathlib, shutil
import chess, chess.engine, chess.pgn
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'scripts/fixtures/draw-practice'
OUT=BASE/'collection-review.json'

def sources():
 data=json.loads((BASE/'expanded-draw-sources.json').read_text())
 rows=[dict(r,category=c) for c,rs in data['games'].items() for r in rs]
 for r in json.loads((BASE/'real-repetition-games.json').read_text()):
  g=chess.pgn.read_game(io.StringIO(r['pgn'])); b=g.board(); ms=list(g.mainline_moves())
  for m in ms[:r['startPly']]: b.push(m)
  fen=b.fen(en_passant='fen'); sans=[]
  for m in ms[r['startPly']:]: sans.append(b.san(m)); b.push(m)
  rows.append(dict(r,category='repetition',fen=fen,moves=sans))
 for r in rows:
  r['id']='draw-'+hashlib.sha256(r['fen'].encode()).hexdigest()[:16]
 return rows

def analyse(engine,b,solver,nodes,root=None):
 info=engine.analyse(b,chess.engine.Limit(nodes=nodes),root_moves=[root] if root else None)
 pv=[]; replay=b.copy()
 for m in info.get('pv',[])[:16]: pv.append(replay.san(m)); replay.push(m)
 s=info['score'].pov(solver)
 return dict(cp=s.score(),mate=s.mate(),depth=info.get('depth'),nodes=info.get('nodes'),line=pv)

def review():
 previous=json.loads(OUT.read_text()) if OUT.exists() else {'records':[]}
 done={r['id']:r for r in previous['records']}; rows=sources()
 with chess.engine.SimpleEngine.popen_uci(shutil.which('stockfish')) as engine:
  engine.configure({'Threads':1,'Hash':64})
  for i,r in enumerate(rows):
   if r['id'] in done and done[r['id']]['moves']==r['moves'] and done[r['id']]['pgnSha256']==hashlib.sha256(r['pgn'].encode()).hexdigest(): continue
   b=chess.Board(r['fen']); side=b.turn
   rec={k:r[k] for k in ['id','category','fen','moves','headers','sourceUrl','startPly']}
   rec['pgnSha256']=hashlib.sha256(r['pgn'].encode()).hexdigest()
   rec['motif']=r.get('motif'); rec['pieceCount']=len(b.piece_map())
   roots=[]
   for m in list(b.legal_moves):
    san=b.san(m); b.push(m); mate=b.is_checkmate(); dead=b.is_insufficient_material(); stale=b.is_stalemate(); b.pop()
    roots.append(dict(move=san,immediateMate=mate,deadPosition=dead,stalemate=stale,**analyse(engine,b,side,5000,m)))
   rec['startingMoves']=roots
   rec['bestStart']=analyse(engine,b,side,150000)
   rec['solverSteps']=[]; rec['legalLine']=True
   for ply,san in enumerate(r['moves']):
    before=b.fen(en_passant='fen'); b.push_san(san)
    if ply%2==0:
     replies=[]
     for reply in list(b.legal_moves):
      replies.append(b.san(reply))
     step=dict(ply=ply,fen=before,move=san,replies=replies,terminal=b.outcome(claim_draw=True).termination.name if b.outcome(claim_draw=True) else None)
     if replies and not b.is_game_over(claim_draw=True): step['bestDefence']=analyse(engine,b,side,100000)
     rec['solverSteps'].append(step)
   rec['terminal']=b.outcome(claim_draw=True).termination.name if b.outcome(claim_draw=True) else None
   done[r['id']]=rec
   OUT.write_text(json.dumps(dict(method='All legal initial moves: 5000 nodes each; best start: 150000 nodes; every recorded solver move: 100000-node defence screen. Legal replay and immediate mates checked exhaustively. Engine estimates are screening evidence, not forced-draw proof.',engine=engine.id,records=list(done.values())),ensure_ascii=False,indent=2)+'\n')
   if (i+1)%25==0: print(i+1,len(rows),flush=True)
if __name__=='__main__': review()
