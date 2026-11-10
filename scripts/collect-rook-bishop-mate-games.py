"""Research full master games for genuine rook-bishop-mate mating combinations."""
import argparse,collections,glob,hashlib,json,sys
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'scripts/fixtures/rook-bishop-mate'
VALUES={1:100,2:320,3:330,4:500,5:900,6:0}
def material(b,c):return sum(VALUES[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def inspect(start,pv):
 color=start.turn;b=start.copy();sans=[];boards=[b.copy()];moves=[]
 if not b.pieces(chess.ROOK,color) or not b.pieces(chess.BISHOP,color):return None
 for move in pv[:19]:
  if move not in b.legal_moves:return None
  sans.append(b.san(move));moves.append(move);b.push(move);boards.append(b.copy())
  if b.is_checkmate():break
 if not b.is_checkmate() or b.turn==color:return None
 checkers=list(b.checkers())
 if not any(b.piece_type_at(s) in [chess.ROOK,chess.BISHOP] for s in checkers):return None
 rook_roles=[];bishop_roles=[]
 for kind,roles in [(chess.ROOK,rook_roles),(chess.BISHOP,bishop_roles)]:
  for sq in b.pieces(kind,color):
   reduced=b.copy();reduced.remove_piece_at(sq)
   if not reduced.is_checkmate():
    roles.append(dict(square=chess.square_name(sq),checking=sq in checkers,escapesWithoutPiece=[reduced.san(m) for m in reduced.legal_moves]))
 if not rook_roles or not bishop_roles:return None
 sacs=[]
 for j in range(1,len(moves),2):
  victim=boards[j].piece_at(moves[j].to_square)
  if not victim or victim.color!=color or victim.piece_type not in [2,3,4,5]:continue
  # Trace the offered piece to the solver's last move onto that square.
  offer=next((i for i in range(j-1,-1,-2) if moves[i].to_square==moves[j].to_square),None)
  if offer is None:continue
  before=material(boards[offer],color)
  after=material(boards[min(j+2,len(boards)-1)],color)
  if after<=before-150:
   sacs.append(dict(ply=offer,piece=victim.symbol().upper(),capturedOn=chess.square_name(moves[j].to_square),materialConcession=before-after))
 own=(len(sans)+1)//2
 # A complex combination need not sacrifice two separate pieces. A single
 # concession qualifies only with substantial coordination and calculation:
 # at least five solver moves, three attacking piece types, and a quiet move.
 coordinated={boards[i].piece_type_at(moves[i].from_square) for i in range(0,len(moves),2)}
 quiet=[i for i in range(0,len(moves)-1,2) if not boards[i+1].is_check() and not boards[i].is_capture(moves[i])]
 complex_single=own>=5 and len(coordinated)>=3 and bool(quiet) and bool(sacs)
 if sacs:level='C' if own<=3 and len(sacs)==1 else 'D' if own>3 and (len(sacs)>1 or any(s['piece']=='Q' for s in sacs) or complex_single) else None
 else:level='A' if own in [1,2] else 'B' if own==3 else 'C*' if own in [5,6] else None
 if not level:return None
 return dict(moves=sans,level=level,solverMoves=own,sacrifices=sacs,bishopRoles=bishop_roles,rookRoles=rook_roles,endFen=b.fen())
def save(path,obj):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)
def prepare(paths,out):
 records={}
 for path in paths:
  data=json.load(open(path))
  for r in data.get('records',[]):
   if r.get('gameMoves') and r['gameMoves'][-1].endswith('#'):records.setdefault(r['gameId'],r)
 print('recorded mates',len(records),flush=True);seeds=[]
 for r in records.values():
  b=chess.Board(r['gameFen']);boards=[b.copy(stack=False)];moves=[]
  for san in r['gameMoves']:
   moves.append(b.parse_san(san));b.push(moves[-1]);boards.append(b.copy(stack=False))
  for length in range(1,20,2):
   ply=len(moves)-length
   if ply<10:continue
   shape=inspect(boards[ply],moves[ply:])
   if shape:seeds.append(dict(source=r,ply=ply,fen=boards[ply].fen(en_passant='fen'),shape=shape))
 save(out,seeds);print('seeds',len(seeds),collections.Counter(s['shape']['level'] for s in seeds),flush=True)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--prepare',action='store_true');ap.add_argument('--corpus',action='append');ap.add_argument('--actual-lines',action='store_true');ap.add_argument('--seeds',default='/tmp/rook-bishop-mate-master-seeds.json');ap.add_argument('--target',type=int,default=22);args=ap.parse_args()
 if args.prepare:
  paths=['/tmp/discovery-all-corpus.json','/tmp/simplification-extra-corpus.json','/tmp/simplification-more-corpus.json']+glob.glob('/tmp/simplification-final/*.json')
  return prepare(args.corpus or [p for p in paths if Path(p).exists()],Path(args.seeds))
 path=DATA/'master-researched.json';records=json.loads(path.read_text())['records'] if path.exists() else []
 excluded={r['gameId'] for r in json.loads((DATA/'master-excluded.json').read_text())} if (DATA/'master-excluded.json').exists() else set()
 overrides={r['gameId']:r for r in json.loads((DATA/'master-reviewed.json').read_text())['records']} if (DATA/'master-reviewed.json').exists() else {}
 seen={r['gameId'] for r in records}|excluded;counts=collections.Counter(overrides.get(r['gameId'],r)['level'] for r in records if r['gameId'] not in excluded);groups=collections.defaultdict(list)
 for seed in json.load(open(args.seeds)):groups[seed['source']['gameId']].append(seed)
 engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
 try:
  for index,seeds in enumerate(groups.values()):
   if seeds[0]['source']['gameId'] in seen:continue
   for seed in sorted(seeds,key=lambda s:({'D':0,'C':1,'C*':2,'B':3,'A':4}[s['shape']['level']],s['shape']['solverMoves'])):
    wanted=seed['shape']['level'];target=args.target
    if counts[wanted]>=target:continue
    b=chess.Board(seed['fen']);color=b.turn
    info=engine.analyse(b,chess.engine.Limit(nodes=400000));mate=info['score'].pov(color).mate()
    if mate is None or mate<=0 or mate>9:continue
    pv=info.get('pv',[])
    if args.actual_lines:
     actual=b.copy();pv=[]
     for san in seed['source']['gameMoves'][seed['ply']:]:
      move=actual.parse_san(san);pv.append(move);actual.push(move)
    shape=inspect(b,pv)
    if not shape or counts[shape['level']] >= args.target:continue
    # Reject gratuitously long PVs and weaker starts when a shorter mate is found.
    if shape['solverMoves']!=mate:continue
    walk=b.copy();defences=[];valid=True
    for i,san in enumerate(shape['moves']):
     walk.push_san(san)
     if i%2==0 and not walk.is_checkmate():
      probe=engine.analyse(walk,chess.engine.Limit(nodes=200000));distance=probe['score'].pov(color).mate()
      if distance is None or distance<=0 or distance>shape['solverMoves']-(i//2+1):valid=False;break
      defences.append(dict(ply=i+1,mate=distance,pv=[m.uci() for m in probe['pv']]))
    if not valid:continue
    r=seed['source'];game=chess.Board(r['gameFen']);before=None
    for i,san in enumerate(r['gameMoves']):
     if i==seed['ply']-1:before=dict(fen=game.fen(en_passant='fen'),move=san)
     if i==seed['ply']:assert game.fen(en_passant='fen')==seed['fen']
     game.push_san(san)
    assert hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16]==r['gameId']
    record=dict(gameId=r['gameId'],headers=r['headers'],source=r['source'],gameFen=r['gameFen'],gameMoves=r['gameMoves'],fen=seed['fen'],ply=seed['ply'],previousMove=before,**shape,validation=dict(engine=engine.id,nodes=400000,principalVariation=[m.uci() for m in pv],mate=mate,defences=defences),reviewReason='Rook and bishop both contribute to the final mate; removing either identified piece breaks checkmate. Full line and material concessions reviewed.')
    records.append(record);seen.add(r['gameId']);counts[shape['level']]+=1;save(path,dict(records=records));print(index,dict(counts),r['headers']['White'],shape['moves'],flush=True);break
   if index%50==0:print('progress',index,dict(counts),flush=True)
   if all(counts[k]>=args.target for k in ['A','B','C','C*','D']):break
 finally:save(path,dict(records=records));engine.quit()
if __name__=='__main__':main()
