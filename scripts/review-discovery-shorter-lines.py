import importlib.util,json,chess,chess.engine
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];f=ROOT/'scripts/fixtures/discovery';s=importlib.util.spec_from_file_location('build',str(ROOT/'scripts/build-discovery.py'));build=importlib.util.module_from_spec(s);s.loader.exec_module(build);rows=[]
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as e:
 e.configure({'Threads':1,'Hash':64})
 for r in json.loads((f/'published.json').read_text())['records']:
  if r['level'] not in ['C*','D']:continue
  b=chess.Board(r['fen']);infos=e.analyse(b,chess.engine.Limit(nodes=2000000),multipv=5);leads=[]
  best=infos[0]['score'].pov(b.turn).score(mate_score=100000)
  for info in infos:
   cp=info['score'].pov(b.turn).score(mate_score=100000)
   candidate=build.miner.inspect(b,info['pv'],['A','B','C'])
   if candidate and cp>=150 and cp>=best-100 and build.reply_coverage({'fen':r['fen'],**candidate}):leads.append({'line':candidate,'cp':cp})
  rows.append({'gameId':r['gameId'],'fen':r['fen'],'moves':r['moves'],'bestScore':best,'shorterLeads':leads});print(r['gameId'],leads,flush=True)
(f/'second-pass-shorter-lines.json').write_text(json.dumps({'method':'Two-million-node top-five root probes for retained C*/D; checks for A/B/C-length motif payoffs with local reply coverage. A lead is not exhaustive proof of the whole preparation.','reviews':rows},ensure_ascii=False,indent=2)+'\n')
