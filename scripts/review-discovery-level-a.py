"""Review every Level A root and the published payoff, without changing publication."""
import importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
spec=importlib.util.spec_from_file_location('build',ROOT/'scripts/build-discovery.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
def mate2(a):
 if a.is_checkmate():return True
 replies=list(a.legal_moves)
 if not replies:return False
 for reply in replies:
  a.push(reply);mate=False
  for m in list(a.legal_moves):
   if not a.gives_check(m):continue
   a.push(m);mate=a.is_checkmate();a.pop()
   if mate:break
  a.pop()
  if not mate:return False
 return True

def safe(a,side,baseline):
 if a.is_stalemate() or build.miner.material(a,side)<=baseline:return False
 for reply in list(a.legal_moves):
  a.push(reply);bad=a.is_checkmate() or build.miner.material(a,side)<=baseline;a.pop()
  if bad:return False
 return True

def main():
 archive=F/'level-a-candidates.json'
 if archive.exists():rs=json.loads(archive.read_text())['candidates']
 else:
  rs=[r for r in json.loads((F/'published.json').read_text())['records'] if r['level']=='A']
  archive.write_text(json.dumps({'candidates':rs},ensure_ascii=False,indent=2)+'\n')
 rows=[]
 with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
  engine.configure({'Threads':1,'Hash':32});identity=engine.id
  for num,r in enumerate(rs,1):
   b=chess.Board(r['fen']);side=b.turn;baseline=build.miner.material(b,side);roots=[]
   assert build.reply_coverage(r)==r['coverage']
   for m in list(b.legal_moves):
    a=b.copy();a.push(m);motifs=build.miner.discoveries(b,m,a)
    roots.append({'move':b.san(m),'discovery':bool(motifs),'immediateMate':a.is_checkmate(),'forcedMateInTwo':mate2(a),'safeImmediateGain':b.is_capture(m) and safe(a,side,baseline)})
   engine.configure({'Clear Hash':None})
   infos=engine.analyse(b,chess.engine.Limit(nodes=300000),multipv=b.legal_moves.count())
   scores={b.san(i['pv'][0]):i for i in infos}
   for root in roots:
    info=scores[root['move']];score=info['score'].pov(side)
    root.update(scoreCp=score.score(),mateScore=score.mate(),pv=[m.uci() for m in info['pv']])
   problems=[x['move'] for x in roots if (r['goal']=='material' and x['safeImmediateGain'] and not x['discovery']) or (r['goal']=='material' and x['forcedMateInTwo']) or (r['goal']=='mate' and x['immediateMate'] and not x['discovery'])]
   rows.append({'gameId':r['gameId'],'originalNumber':num,'fen':r['fen'],'moves':r['moves'],'roots':roots,'competingMoves':problems,'coverage':r['coverage']})
   print(num,r['moves'],'REVIEW',problems,flush=True)
 (F/'level-a-curation-analysis.json').write_text(json.dumps({'engine':identity,'engineNodes':300000,'method':'Every legal root checked for immediate mate, forced mate within two solver moves against every legal defence, and safe immediate material gain surviving every immediate reply. Saved discovery payoff coverage rechecked against all immediate defences. Engine MultiPV covers all roots; finite scores are not mate proofs.','reviews':rows},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
