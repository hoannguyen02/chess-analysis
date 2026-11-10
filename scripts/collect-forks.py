"""Mine concrete double attacks with a material payoff from complete games."""
import argparse,glob,hashlib,json,importlib.util,sys
sys.dont_write_bytecode=True
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
V={1:100,2:320,3:330,4:500,5:900,6:0}
LEVELS=['A','B','C','C*','D']

def scan_indexed_game(task):
 """Completed game geometry is cached separately from level/owner selection."""
 from tactic_research import ResearchCache,digest,module
 r,cache_path,version=task
 cache=ResearchCache(cache_path)
 key=digest({'record':r,'version':version,'materialWindow':330,'pvPlies':18})
 try:
  saved=cache.get('fork-game-geometry',key)
  if saved is not None:return saved,True
  game=chess.Board(r['gameFen']);positions=[game.copy(stack=False)]
  for san in r['gameMoves']:game.push_san(san);positions.append(game.copy(stack=False))
  ident=hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16]
  if r.get('gameId') and ident!=r['gameId']:raise ValueError('Indexed game identity mismatch')
  builder=module('build-forks');found=[]
  plies=r['forkPlies'] or [i for i,move in enumerate(game.move_stack)
    if i>=10 and len(targets(positions[i+1],move.to_square))>=2]
  seeds=sorted({p-back for p in plies for back in range(0,14,2) if p-back>=10})
  for ply in seeds:
   board=positions[ply]
   if board.is_game_over() or abs(material(board,board.turn))>330:continue
   line=inspect(board,game.move_stack[ply:ply+18],LEVELS)
   if not line:continue
   record={k:v for k,v in r.items() if k!='forkPlies'}
   record.update(gameId=ident,fen=board.fen(en_passant='fen'),ply=ply,goal='material',
    previousMove=dict(fen=positions[ply-1].fen(en_passant='fen'),move=r['gameMoves'][ply-1]),**line)
   coverage=builder.reply_coverage(record)
   if coverage and line['moves'][-1] in coverage.get(line['moves'][-2],[]):found.append(record)
  cache.put('fork-game-geometry',key,found)
  return found,False
 finally:cache.close()

def indexed_leads(index_path, levels, max_games=0, offset_games=0, source_contains=None,
                  cache=None, workers=1, metrics=None):
 """Bounded complete-game collection, with late current-owner eligibility."""
 from research_index import connect,master_credential
 from tactic_research import DEFAULT_CACHE,code_version
 from concurrent.futures import ProcessPoolExecutor
 db=connect(index_path)
 protected={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/fork/published.json').read_text())['records']}
 protected.update(r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/fork/excluded.json').read_text()))
 for entry in json.loads((ROOT/'src/lib/server/practice-adjustments.json').read_text()):
  ref=entry['reference']
  if ref['scope']=='/fork' and ref['baseLevel']!='Beginner':protected.add((ref.get('gameReference') or {}).get('id'))
 # Metadata-only corpus imports have no matches yet. They remain searchable:
 # each untagged complete game receives a cached played-fork geometry pass.
 keys=db.execute("SELECT game_key FROM games ORDER BY preferred DESC,game_key").fetchall()
 jobs=[];scanned=0
 version=code_version('collect-forks.py','build-forks.py')
 for (key,) in keys:
  old=db.execute('SELECT game_id FROM game_legacy_ids WHERE game_key=?',(key,)).fetchone()
  if old and old[0] in protected:continue
  refs=[dict(url=u,sha256=h,retrieved=d) for u,h,d in db.execute('SELECT url,sha256,retrieved FROM sources WHERE game_key=? ORDER BY url',(key,))]
  if source_contains and not any(source_contains in ref['url'] for ref in refs):continue
  fen,moves,headers=db.execute('SELECT fen,moves,headers FROM games WHERE game_key=?',(key,)).fetchone()
  headers=json.loads(headers);credential=master_credential(headers,refs)
  if not credential and not any(headers.get(side+'Title') in ('FM','IM','GM') for side in ['White','Black']):continue
  if __import__('re').search(r'simul|blind|odds|consult',headers.get('Event',''),__import__('re').I):continue
  scanned+=1
  if scanned<=offset_games:continue
  if max_games and scanned>offset_games+max_games:break
  record=dict(gameFen=fen,gameMoves=json.loads(moves),headers=headers,source=refs[0]['url'],sourceReferences=refs,
   forkPlies=[p for (p,) in db.execute("SELECT o.ply FROM occurrences o JOIN matches m ON m.occurrence_id=o.id WHERE o.game_key=? AND m.theme='fork'",(key,))])
  if old:record['gameId']=old[0]
  if credential:record['masterCredential']=credential
  jobs.append((record,str(cache or DEFAULT_CACHE),version))
 db.close()
 counters=metrics if metrics is not None else {}
 counters.update(sourceGames=len(jobs),geometryCacheHits=0,sourceGamesReplayed=0)
 with ProcessPoolExecutor(max_workers=workers) as pool:
  for records,reused in pool.map(scan_indexed_game,jobs,chunksize=4):
   counters['geometryCacheHits' if reused else 'sourceGamesReplayed']+=1
   for record in records:
    if record['level'] in levels and record['gameId'] not in protected:yield record

def screen_indexed(args):
 from tactic_research import CachedEngine,atomic_json
 from research_index import connect
 from research_candidates import import_candidates,query_candidates
 from concurrent.futures import ProcessPoolExecutor
 output=Path(args.output)
 saved=json.loads(output.read_text())['records'] if output.exists() else []
 seen={r['gameId'] for r in saved}
 counts={l:sum(r['level']==l for r in saved) for l in args.levels}
 db=connect(args.index)
 from research_index import sync_topic_decisions
 sync_topic_decisions(db,'fork')
 bank=query_candidates(db,'fork',args.levels,limit=0,exclude_game_ids=seen,distinct_games=False)
 pending=bank['records'];geometry_metrics={}
 if not args.bank_only:
  # The cheap source/material/motif pass happens before any engine request.
  known={(r['gameId'],r['fen'],tuple(r['moves'])) for r in pending}
  for r in indexed_leads(args.index,args.levels,args.max_games,args.offset_games,args.source_contains,args.cache,args.workers,geometry_metrics):
   key=(r['gameId'],r['fen'],tuple(r['moves']))
   if r['gameId'] not in seen and key not in known:
    pending.append(r);known.add(key)
  import_candidates(db,pending,topic='fork',origin='indexed-fork-geometry',stage='saved')
 metrics=dict(geometricLeads=len(pending),bankLookup=bank['metrics'],geometry=geometry_metrics,engineCalls=0,hits=0,misses=0)
 db.close()
 atomic_json(output.with_suffix('.geometry.json'),dict(records=pending,publicationApproved=False))
 with ProcessPoolExecutor(max_workers=args.workers) as pool:
  for start in range(0,len(pending),args.workers):
   batch=[r for r in pending[start:start+args.workers] if r['gameId'] not in seen and counts[r['level']]<args.target]
   for result,stats in pool.map(screen_one,[(r,str(args.cache)) for r in batch]):
    for k in ('engineCalls','hits','misses'):metrics[k]+=stats[k]
    if result and result['gameId'] not in seen and counts[result['level']]<args.target:
     saved.append(result);seen.add(result['gameId']);counts[result['level']]+=1
     atomic_json(output,dict(records=saved,metrics=metrics,publicationApproved=False))
     print('screened',counts,result['gameId'],result['moves'],flush=True)
   if all(counts[l]>=args.target for l in args.levels):break
 atomic_json(output,dict(records=saved,metrics=metrics,publicationApproved=False))
 db=connect(args.index)
 import_candidates(db,saved,topic='fork',origin=str(output),stage='screened')
 db.close()

def screen_one(task):
 from tactic_research import CachedEngine
 r,cache=task;engine=CachedEngine(cache=cache);b=chess.Board(r['gameFen'])
 for san in r['gameMoves'][:r['ply']]:b.push_san(san)
 if b.fen(en_passant='fen')!=r['fen']:raise ValueError('Source position mismatch before cached screen')
 try:
  quick=engine.analyse(b,chess.engine.Limit(nodes=12000))
  if quick['score'].pov(b.turn).score(mate_score=100000)<150:return None,engine.stats
  infos=engine.analyse(b,chess.engine.Limit(nodes=300000),multipv=3)
  best=infos[0]['score'].pov(b.turn).score(mate_score=100000)
  spec=importlib.util.spec_from_file_location('fork_builder',ROOT/'scripts/build-forks.py')
  builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
  for info in infos:
   line=inspect(b,info.get('pv',[]),[r['level']]);score=info['score'].pov(b.turn).score(mate_score=100000)
   if not line or score<150 or score<best-40:continue
   candidate={**r,**line};coverage=builder.reply_coverage(candidate)
   if not coverage or line['moves'][-1] not in coverage.get(line['moves'][-2],[]):continue
   checks=[];walk=b.copy()
   for i,san in enumerate(line['moves']):
    walk.push_san(san)
    if i%2==0 and not walk.is_game_over():
     d=engine.analyse(walk,chess.engine.Limit(nodes=100000))
     cp=d['score'].pov(b.turn).score(mate_score=100000)
     checks.append(dict(ply=i+1,score=cp,pv=[m.uci() for m in d.get('pv',[])]))
   if any(x['score']<100 for x in checks):continue
   candidate.update(score=score,alternatives=[],validation=dict(principalVariation=[m.uci() for m in info['pv']],depth=info['depth'],bestScore=best,defences=checks))
   return candidate,engine.stats
  return None,engine.stats
 finally:engine.quit()
def material(b,c):return sum(V[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def targets(board,square):
 piece=board.piece_at(square)
 if not piece:return []
 return [s for s in board.attacks(square) if board.piece_at(s) and board.piece_at(s).color!=piece.color]
def inspect(start,pv,levels=None):
 b=start.copy();color=b.turn;boards=[b.copy()];sans=[];moves=[]
 for move in pv[:18]:
  if move not in b.legal_moves:break
  sans.append(b.san(move));moves.append(move);b.push(move);boards.append(b.copy())
 for i in range(0,len(moves)-4,2):
  fork=moves[i];capture=moves[i+2];after=boards[i+1];victims=targets(after,fork.to_square)
  if len(victims)<2 or capture.from_square!=fork.to_square or capture.to_square not in victims:continue
  if capture.to_square in boards[i].attacks(fork.from_square):continue
  if not boards[i+2].is_capture(capture):continue
  if not after.is_check() and moves[i+1].from_square not in victims:continue
  gain=min(material(x,color) for x in boards[i+3:i+6])-material(start,color)
  local=min(material(x,color) for x in boards[i+3:i+6])-material(boards[i],color)
  if gain<100 or local<100:continue
  sacrifices=[]
  for j in range(1,i+2,2):
   victim=boards[j].piece_at(moves[j].to_square)
   if not victim or victim.color!=color or victim.piece_type not in [2,3,4,5]:continue
   offered=next((k for k in range(j-1,-1,-2) if moves[k].to_square==moves[j].to_square),None)
   capturer=boards[j].piece_at(moves[j].from_square)
   equal=(capturer.piece_type==victim.piece_type and offered is not None and material(boards[j+2],color)>=material(boards[offered],color)-75)
   if offered is not None and not equal and material(boards[j+1],color)<material(boards[offered],color)-75:sacrifices.append(dict(ply=offered,piece=victim.symbol().upper()))
  own=(i+4)//2
  # A long single-minor-piece sacrifice may also require advanced coordination.
  # This is a research grade only; D still needs independent complexity review.
  level=('A' if own<=2 else 'B' if own==3 else 'C*') if not sacrifices else ('E' if own>=6 else 'D' if own>=4 else 'C' if len(sacrifices)==1 else None)
  if not level or (not sacrifices and own>5) or (levels is not None and level not in levels):continue
  return dict(moves=sans[:i+3],level=level,solverMoves=own,sacrifices=sacrifices,forkPly=i,forkSquare=chess.square_name(fork.to_square),forkPiece=after.piece_at(fork.to_square).symbol().upper(),targets=[chess.square_name(s) for s in victims],capturedSquare=chess.square_name(capture.to_square),gain=gain,localGain=local,settlement=sans[i+3:i+5])
 return None

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--target',type=int,default=50);ap.add_argument('--phase',choices=['seeds','tactics'],default='seeds');ap.add_argument('--extra-corpus');ap.add_argument('--output',default='scripts/fixtures/fork/researched.json');ap.add_argument('--levels',nargs='+',default=LEVELS)
 ap.add_argument('--index',type=Path);ap.add_argument('--workers',type=int,default=1);ap.add_argument('--max-games',type=int,default=0)
 ap.add_argument('--source-contains',help='Restrict indexed complete games to a source URL substring')
 ap.add_argument('--offset-games',type=int,default=0,help='Skip this many eligible indexed games in stable index order')
 ap.add_argument('--bank-only',action='store_true',help='Reuse saved candidate positions without replaying source games')
 from tactic_research import DEFAULT_CACHE
 ap.add_argument('--cache',type=Path,default=DEFAULT_CACHE);args=ap.parse_args()
 if args.index:
  if args.workers<1 or args.target<1:raise ValueError('Positive worker count and target required')
  return screen_indexed(args)
 output=ROOT/args.output;output.parent.mkdir(exist_ok=True)
 saved=json.loads(output.read_text())['records'] if output.exists() else []
 existing=json.loads((ROOT/'scripts/fixtures/fork/published.json').read_text())['records']
 spec=importlib.util.spec_from_file_location('fork_builder',ROOT/'scripts/build-forks.py')
 builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
 excluded={r['gameId'] for r in json.loads((ROOT/'scripts/fixtures/fork/excluded.json').read_text())}
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
   if args.phase=='tactics':
    seeds=[];actual=list(game.move_stack)
    for i,move in enumerate(actual):
     if i<10:continue
     after=positions[i+1]
     if len(targets(after,move.to_square))<2:continue
     for back in [0,2,4,6,8,10,12]:
      ply=i-back
      if ply>=10 and inspect(positions[ply],actual[ply:ply+18],args.levels):seeds.append(ply)
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
      if coverage and line['moves'][-1] in coverage.get(line['moves'][-2],[]):candidates.append((line,info,score))
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
    if not coverage or record['moves'][-1] not in coverage.get(record['moves'][-2],[]):continue
    saved.append(record);seen.add(ident);counts[line['level']]+=1;save();print(index,counts,r['headers']['White'],line['moves'],flush=True);break
   if all(counts[l]>=args.target for l in args.levels):break
   if index%25==0:print('progress',index,counts,flush=True)
 finally:save();engine.quit()
if __name__=='__main__':main()
