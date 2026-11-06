"""Audit B–D discovery candidates before editorial selection; never publish automatically."""
import argparse,importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
from tactic_research import CachedEngine, DEFAULT_CACHE, code_version, digest, resume_reviews, atomic_json
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
spec=importlib.util.spec_from_file_location('a',ROOT/'scripts/review-discovery-level-a.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
build=a.build

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--new',action='store_true');parser.add_argument('--input',type=Path);parser.add_argument('--output',type=Path);parser.add_argument('--nodes',type=int,default=300000);parser.add_argument('--cache',type=Path,default=DEFAULT_CACHE);parser.add_argument('--no-cache',action='store_true');args=parser.parse_args()
 archive=F/'upper-candidates.json'
 if not archive.exists():
  archive.write_text(json.dumps({'candidates':[r for r in json.loads((F/'published.json').read_text())['records'] if r['level']!='A']},ensure_ascii=False,indent=2)+'\n')
 source=args.input or (F/'upper-research.json' if args.new else archive)
 rs=json.loads(source.read_text()).get('records' if args.new or args.input else 'candidates',[])
 out=args.output or F/('upper-research-review.json' if args.new else 'upper-curation-analysis.json')
 result=json.loads(out.read_text()) if out.exists() else {'method':'All legal roots: immediate mate, forced mate in two against every reply, safe immediate capture after every immediate reply; finite all-root engine screening. Replays complete solution and rechecks discovery payoff against every legal local defence. Engine scores are not proofs of the full objective.','reviews':[]}
 if 'engineNodes' in result:assert result['engineNodes']==args.nodes,'Use a new output for different engine settings'
 result['engineNodes']=args.nodes
 policy={'nodes':args.nodes,'engineSha256':__import__('hashlib').sha256(Path('/opt/homebrew/bin/stockfish').read_bytes()).hexdigest(),'code':code_version('tactic_research.py','review-discovery-upper.py','review-discovery-level-a.py','build-discovery.py','collect-discovery.py'),'cachedColdHash':not args.no_cache}
 done=resume_reviews(result,rs,policy)
 with (chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') if args.no_cache else CachedEngine(cache=args.cache)) as engine:
  engine.configure({'Threads':1,'Hash':64});result['engine']=engine.id
  for index,r in enumerate(rs,1):
   if r['gameId'] in done:continue
   b=chess.Board(r['fen']);side=b.turn;baseline=build.miner.material(b,side);roots=[]
   for m in list(b.legal_moves):
    after=b.copy();after.push(m)
    roots.append({'move':b.san(m),'discovery':bool(build.miner.discoveries(b,m,after)),'immediateMate':after.is_checkmate(),'forcedMateInTwo':a.mate2(after),'safeImmediateGain':b.is_capture(m) and a.safe(after,side,baseline)})
   engine.configure({'Clear Hash':None})
   infos=engine.analyse(b,chess.engine.Limit(nodes=args.nodes),multipv=b.legal_moves.count())
   scores={b.san(i['pv'][0]):i for i in infos}
   for root in roots:
    info=scores[root['move']];score=info['score'].pov(side)
    root.update(scoreCp=score.score(),mateScore=score.mate(),pv=[m.uci() for m in info['pv']])
   walk=b.copy();prep=[]
   for ply,san in enumerate(r['moves']):
    walk.push_san(san)
    if ply%2==0 and ply<r['discoveryPly'] and not walk.is_game_over():
     info=engine.analyse(walk,chess.engine.Limit(nodes=150000),multipv=min(3,walk.legal_moves.count()))
     prep.append({'ply':ply+1,'materialGain':build.miner.material(walk,side)-baseline,'safeGainAlready':a.safe(walk,side,baseline),'defences':[{'move':walk.san(x['pv'][0]),'scoreCp':x['score'].pov(side).score(),'mateScore':x['score'].pov(side).mate(),'pv':[m.uci() for m in x['pv']]} for x in info]})
   assert build.reply_coverage(r) is not None
   flags=[]
   simple=[x['move'] for x in roots if x['safeImmediateGain'] and x['scoreCp'] is not None and x['scoreCp']>=0]
   if simple:flags.append('immediate-material: '+','.join(simple))
   mates=[x['move'] for x in roots if x['forcedMateInTwo']]
   if mates:flags.append('short-mate: '+','.join(mates))
   if r.get('inferredLevel') and r['inferredLevel']!=r['level']:flags.append('user-level-override: '+r['inferredLevel'])
   if any(x['safeGainAlready'] for x in prep):flags.append('gain-before-discovery')
   row={'gameId':r['gameId'],'candidateHash':digest(r),'originalLevel':r['level'],'fen':r['fen'],'moves':r['moves'],'roots':roots,'preparation':prep,'flags':flags,'coverage':build.reply_coverage(r)}
   result['reviews'].append(row);atomic_json(out,result)
   print(index,r['level'],r['gameId'],flags,flush=True)
if __name__=='__main__':main()
