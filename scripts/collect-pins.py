"""Mine pin tactics from complete master games, with fresh Stockfish checks."""
import argparse, glob, hashlib, json, math
from pathlib import Path
import chess, chess.engine
ROOT=Path(__file__).resolve().parents[1]
V={1:100,2:320,3:330,4:500,5:900,6:0}
LEVELS=['A','B','C','C*','D']
def material(b,c):return sum(V[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def pinner(b,color,square):
 king=b.king(color)
 return next((s for s,p in b.piece_map().items() if p.color!=color and p.piece_type in [3,4,5] and square in b.attacks(s) and chess.between(s,king)&chess.BB_SQUARES[square]),None)
def relative_pin(b,color,square):
 front=b.piece_at(square)
 if not front or front.piece_type==6:return None
 for origin,p in b.piece_map().items():
  if p.color==color or p.piece_type not in [3,4,5] or square not in b.attacks(origin):continue
  dx=chess.square_file(square)-chess.square_file(origin);dy=chess.square_rank(square)-chess.square_rank(origin)
  dx=(dx>0)-(dx<0);dy=(dy>0)-(dy<0)
  x,y=chess.square_file(square)+dx,chess.square_rank(square)+dy
  while 0<=x<8 and 0<=y<8:
   back=chess.square(x,y);piece=b.piece_at(back)
   if piece:
    if piece.color==color and piece.piece_type!=6 and V[piece.piece_type]>V[front.piece_type]:return origin,back
    break
   x+=dx;y+=dy
 return None
def inspect(start,pv,levels=None):
 b=start.copy();color=b.turn;boards=[b.copy()];sans=[];moves=[]
 for m in pv[:18]:
  if m not in b.legal_moves:break
  sans.append(b.san(m));moves.append(m);b.push(m);boards.append(b.copy())
 for i,m in enumerate(moves):
  mate=boards[i+1].is_checkmate()
  if i%2 or (not mate and i+3>=len(boards)):continue
  before=boards[i]
  if not before.is_capture(m) and not mate:continue
  pinned=None;mode=None
  if before.is_pinned(not color,m.to_square) and pinner(before,not color,m.to_square)!=m.from_square:
   pinned=m.to_square;mode='capture-pinned'
  else:
   after=boards[i+1]
   for square,p in after.piece_map().items():
    if p.color!=color and after.is_pinned(not color,square) and m.to_square in after.attacks(square):
     recapture=chess.Move(square,m.to_square)
     if after.is_pseudo_legal(recapture) and not after.is_legal(recapture):pinned=square;mode='pinned-defender';break
  relative=None
  if pinned is None and before.is_capture(m):
   relative=relative_pin(before,not color,m.to_square)
   if relative and relative[0]!=m.from_square:
    pinned=m.to_square;mode='relative-capture'
  if pinned is None:continue
  gain=min(material(x,color) for x in boards[i+1:i+4])-material(start,color)
  local=min(material(x,color) for x in boards[i+1:i+4])-material(before,color)
  if not mate and (gain<100 or local<100):continue
  sacrifices=[]
  for j in range(1,i,2):
   victim=boards[j].piece_at(moves[j].to_square)
   if not victim or victim.color!=color or victim.piece_type not in [2,3,4,5]:continue
   offered=next((k for k in range(j-1,-1,-2) if moves[k].to_square==moves[j].to_square),None)
   capturer=boards[j].piece_at(moves[j].from_square)
   equal_exchange=(capturer.piece_type==victim.piece_type and offered is not None and material(boards[j+2],color)>=material(boards[offered],color)-75)
   if offered is not None and not equal_exchange and material(boards[j+1],color)<material(boards[offered],color)-75:
    sacrifices.append(dict(ply=offered,piece=victim.symbol().upper()))
  own=(i+2)//2
  level=('A' if own<=2 else 'B' if own==3 else 'C*') if not sacrifices else ('C' if own<=3 and len(sacrifices)==1 else 'D' if own>3 and (len(sacrifices)>=2 or any(s['piece'] in ['R','Q'] for s in sacrifices)) else None)
  if not level or (not sacrifices and own>5) or (levels is not None and level not in levels):continue
  pb=before if mode=='capture-pinned' else boards[i+1]
  return dict(goal='mate' if mate else 'material',moves=sans[:i+1],level=level,solverMoves=own,sacrifices=sacrifices,pinSquare=chess.square_name(pinned),pinner=chess.square_name(relative[0] if mode=='relative-capture' else pinner(pb,not color,pinned)),backSquare=chess.square_name(relative[1]) if mode=='relative-capture' else None,motif=mode,gain=gain,localGain=local,settlement=sans[i+1:i+3])
 return None

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--target',type=int,default=50);ap.add_argument('--phase',choices=['seeds','games','tactics','endings'],default='seeds');ap.add_argument('--extra-corpus');ap.add_argument('--output',default='scripts/fixtures/pin/researched.json');ap.add_argument('--levels',nargs='+',default=LEVELS);args=ap.parse_args()
 output=ROOT/args.output;output.parent.mkdir(exist_ok=True)
 saved=json.loads(output.read_text())['records'] if output.exists() else []
 existing=json.loads((ROOT/'scripts/fixtures/pin/researched.json').read_text())['records'] if args.extra_corpus else []
 excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/pin/excluded.json').read_text())}
 saved=[r for r in saved if r['gameId'] not in excluded]
 seen={r['gameId'] for r in saved+existing}|excluded;counts={l:sum(r['level']==l for r in saved) for l in LEVELS}
 inputs={}
 for f in ([args.extra_corpus] if args.extra_corpus else sorted(glob.glob(str(ROOT/'scripts/fixtures/skewer/*candidates.json')))+[str(ROOT/'scripts/fixtures/skewer/audit.json')]):
  data=json.load(open(f))
  for r in data['records']:inputs.setdefault(r['gameId'],r)
 engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':1,'Hash':128})
 def save():
  temporary=output.with_suffix('.tmp')
  temporary.write_text(json.dumps(dict(engine=engine.id,nodes=300000,defenceNodes=100000,records=saved),ensure_ascii=False,indent=2)+'\n')
  temporary.replace(output)
 try:
  for index,r in enumerate(inputs.values()):
   ident=r['gameId']
   if ident in seen:continue
   game=chess.Board(r['gameFen']);positions=[game.copy()]
   for san in r['gameMoves']:game.push_san(san);positions.append(game.copy())
   if positions[r['ply']].fen(en_passant='fen')!=r['fen']:raise ValueError('source FEN mismatch')
   if hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16]!=ident:raise ValueError('source identity mismatch')
   seeds=[r['ply']]
   if args.phase=='games':
    seeds=[]
    for ply,b in enumerate(positions[10:-1],10):
     # Positions where either side has an absolute pin, plus short preparation.
     if any(b.is_pinned(p.color,s) or relative_pin(b,p.color,s) for s,p in b.piece_map().items() if p.piece_type!=6):
      seeds.extend(ply-k for k in [4,2,0] if ply-k>=10)
   if args.phase=='endings':
    # Resignation often precedes the pin's payoff; inspect the final positions
    # even when the combination is absent from the played game continuation.
    seeds=list(range(max(10,len(positions)-17),len(positions)-1))
   if args.phase=='tactics':
    seeds=[];actual=list(game.move_stack)
    for i,m in enumerate(actual):
     if i<10:continue
     before=positions[i];after=positions[i+1]
     if not before.is_capture(m) and not after.is_checkmate():continue
     related=before.is_pinned(not before.turn,m.to_square) or (before.is_capture(m) and relative_pin(before,not before.turn,m.to_square)) or any(after.is_pinned(p.color,sq) and m.to_square in after.attacks(sq) for sq,p in after.piece_map().items() if p.color==after.turn)
     if related:
      for back in [4,6,8,10,12,2,0]:
       ply=i-back
       if ply>=10:
        probe=inspect(positions[ply],actual[ply:ply+18],args.levels)
        if probe:seeds.append(ply)
   for ply in dict.fromkeys(seeds):
    b=positions[ply]
    if b.is_game_over():continue
    needed=[l for l in args.levels if counts[l]<args.target]
    quick=engine.analyse(b,chess.engine.Limit(nodes=12000));line=inspect(b,quick.get('pv',[]),needed)
    if not line and args.phase=='tactics':line=inspect(b,list(game.move_stack)[ply:ply+18],needed)
    if not line or line['level'] not in args.levels or counts[line['level']]>=args.target or quick['score'].pov(b.turn).score(mate_score=100000)<150:continue
    infos=engine.analyse(b,chess.engine.Limit(nodes=300000),multipv=3);best=infos[0]['score'].pov(b.turn).score(mate_score=100000)
    candidates=[]
    for info in infos:
     line=inspect(b,info.get('pv',[]),needed);score=info['score'].pov(b.turn).score(mate_score=100000)
     if line and line['level'] in args.levels and score>=150 and score>=best-40 and counts[line['level']]<args.target:candidates.append((line,info,score))
    if not candidates:continue
    line,info,score=candidates[0];checks=[];walk=b.copy();valid=True
    for i,san in enumerate(line['moves']):
     walk.push_san(san)
     if i%2==0 and not walk.is_game_over():
      defence=engine.analyse(walk,chess.engine.Limit(nodes=100000));cp=defence['score'].pov(b.turn).score(mate_score=100000)
      checks.append(dict(ply=i+1,score=cp,pv=[m.uci() for m in defence.get('pv',[])]))
      if cp<100:valid=False;break
    if not valid:continue
    record=dict(gameId=ident,headers=r['headers'],source=r['source'],gameFen=r['gameFen'],gameMoves=r['gameMoves'],fen=b.fen(en_passant='fen'),ply=ply,previousMove=dict(fen=positions[ply-1].fen(en_passant='fen'),move=r['gameMoves'][ply-1]),score=score,alternatives=[c[0]['moves'] for c in candidates[1:]],validation=dict(principalVariation=[m.uci() for m in info['pv']],depth=info['depth'],bestScore=best,defences=checks),**line)
    saved.append(record);seen.add(ident);counts[line['level']]+=1;save();print(index,counts,r['headers']['White'],line['moves'],flush=True);break
   if all(counts[l]>=args.target for l in args.levels):break
   if index%25==0:print('progress',index,counts,flush=True)
 finally:save();engine.quit()
if __name__=='__main__':main()
