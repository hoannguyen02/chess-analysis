"""Mine stationary-slider discovered attacks from complete real games."""
import argparse,glob,hashlib,json,importlib.util,sys
sys.dont_write_bytecode=True
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
V={1:100,2:320,3:330,4:500,5:900,6:0}
LEVELS=['A','B','C','C*','D']
def material(b,c):return sum(V[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def discoveries(before,move,after):
 color=before.turn;result=[]
 for square,piece in before.piece_map().items():
  if piece.color!=color or piece.piece_type not in [3,4,5] or square==move.from_square or after.piece_at(square)!=piece:continue
  for target in after.attacks(square):
   victim=after.piece_at(target)
   if not victim or victim.color==color or target in before.attacks(square):continue
   ray=chess.between(square,target)
   if ray & before.occupied == chess.BB_SQUARES[move.from_square]:result.append((square,target,'check' if victim.piece_type==6 else 'attack'))
 return sorted(result,key=lambda x:x[2]!='check')
def inspect(start,pv,levels=None):
 b=start.copy(stack=False);color=b.turn;boards=[b.copy(stack=False)];sans=[];moves=[]
 for move in pv[:18]:
  if move not in b.legal_moves:break
  sans.append(b.san(move));moves.append(move);b.push(move);boards.append(b.copy(stack=False))
 for i in range(0,len(moves),2):
  move=moves[i];before=boards[i];after=boards[i+1]
  for slider,target,kind in discoveries(before,move,after):
   for end in [i,i+2]:
    if end>=len(moves):continue
    mate=boards[end+1].is_checkmate()
    if mate and (end!=i or kind!='check'):continue
    if not mate:
     if end+3>=len(boards) or not boards[end].is_capture(moves[end]):continue
     if end==i and kind!='check':continue
     if end!=i:
      if moves[end].from_square not in [slider,move.to_square]:continue
      if kind=='attack' and moves[end].from_square==slider and moves[end].to_square!=target:continue
      if kind=='attack' and moves[end].from_square==move.to_square and moves[i+1].from_square!=target:continue
    gain=min(material(x,color) for x in boards[end+1:end+4])-material(start,color)
    local=min(material(x,color) for x in boards[end+1:end+4])-material(before,color)
    if not mate and (gain<100 or local<100):continue
    sacrifices=[]
    for j in range(1,end,2):
     victim=boards[j].piece_at(moves[j].to_square)
     if not victim or victim.color!=color or victim.piece_type not in [2,3,4,5]:continue
     offered=next((k for k in range(j-1,-1,-2) if moves[k].to_square==moves[j].to_square),None)
     capturer=boards[j].piece_at(moves[j].from_square)
     equal=capturer.piece_type==victim.piece_type and offered is not None and material(boards[j+2],color)>=material(boards[offered],color)-75
     if offered is not None and not equal and material(boards[j+1],color)<material(boards[offered],color)-75:sacrifices.append(dict(ply=offered,piece=victim.symbol().upper()))
    own=(end+2)//2
    level=('A' if own<=2 else 'B' if own==3 else 'C*') if not sacrifices else ('C' if own<=3 and len(sacrifices)==1 else 'D' if own>3 else None)
    if not level or (not sacrifices and own>5) or (levels is not None and level not in levels):continue
    return dict(moves=sans[:end+1],level=level,solverMoves=own,sacrifices=sacrifices,discoveryPly=i,payoffPly=end,sliderSquare=chess.square_name(slider),targetSquare=chess.square_name(target),moverSquare=chess.square_name(move.to_square),kind=kind,goal='mate' if mate else 'material',gain=gain,localGain=local,settlement=sans[end+1:end+3])
 return None

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--target',type=int,default=50);ap.add_argument('--phase',choices=['seeds','tactics','tails'],default='seeds');ap.add_argument('--extra-corpus');ap.add_argument('--output',default='scripts/fixtures/discovery/researched.json');ap.add_argument('--levels',nargs='+',default=LEVELS);args=ap.parse_args()
 output=ROOT/args.output;output.parent.mkdir(exist_ok=True)
 saved=json.loads(output.read_text())['records'] if output.exists() else []
 existing=json.loads((ROOT/'scripts/fixtures/discovery/published.json').read_text())['records']
 spec=importlib.util.spec_from_file_location('discovery_builder',ROOT/'scripts/build-discovery.py')
 builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
 excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/discovery/excluded.json').read_text())}
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
   game=chess.Board(r['gameFen']);positions=[game.copy(stack=False)]
   for san in r['gameMoves']:game.push_san(san);positions.append(game.copy(stack=False))
   if positions[r['ply']].fen(en_passant='fen')!=r['fen']:raise ValueError('source FEN mismatch')
   if hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16]!=ident:raise ValueError('source identity mismatch')
   seeds=[r['ply']]
   if args.phase=='tactics':
    seeds=[];actual=list(game.move_stack)
    for i,move in enumerate(actual):
     if i<10:continue
     after=positions[i+1]
     if not discoveries(positions[i],move,after):continue
     for back in [0,2,4,6,8,10,12]:
      ply=i-back
      if ply>=10 and inspect(positions[ply],actual[ply:ply+18],args.levels):seeds.append(ply)
   if args.phase=='tails':
    # Inspect unplayed combinations near resignation, preserving full game provenance.
    winner=chess.WHITE if r['headers'].get('Result')=='1-0' else chess.BLACK if r['headers'].get('Result')=='0-1' else None
    seeds=[ply for ply in range(len(positions)-1,max(9,len(positions)-12),-1) if winner is not None and positions[ply].turn==winner]
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
     if line and line['level'] in args.levels and score>=150 and score>=best-40 and counts[line['level']]<args.target:
      coverage=builder.reply_coverage(dict(fen=b.fen(en_passant='fen'),**line))
      if coverage:candidates.append((line,info,score))
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
    coverage=builder.reply_coverage(record)
    if not coverage:continue
    saved.append(record);seen.add(ident);counts[line['level']]+=1;save();print(index,counts,r['headers']['White'],line['moves'],flush=True);break
   if all(counts[l]>=args.target for l in args.levels):break
   if index%25==0:print('progress',index,counts,flush=True)
 finally:save();engine.quit()
if __name__=='__main__':main()
