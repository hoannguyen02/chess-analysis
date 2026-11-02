"""Find short preparatory back-rank lines in already sourced master games."""
import importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-back-rank-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
seeds=[];seen=set();engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for file in ['/tmp/back-rank-mate-resignation-seeds.json','/tmp/back-rank-mate-new-seeds.json']:
  for seed in json.load(open(file)):
   if seed['shape']['level']!='A':continue
   r=seed['source'];board=chess.Board(r['gameFen']);frames=[board.copy()]
   for san in r['gameMoves']:board.push_san(san);frames.append(board.copy(stack=False))
   for ply in [seed['ply']-2,seed['ply']-4]:
    if ply<10 or (r['gameId'],ply) in seen:continue
    seen.add((r['gameId'],ply));start=frames[ply];info=engine.analyse(start,chess.engine.Limit(nodes=100000));shape=m.inspect(start,info.get('pv',[]))
    if shape and shape['level']=='B':seeds.append(dict(source=r,ply=ply,fen=start.fen(en_passant='fen'),shape=shape))
finally:engine.quit();m.save(Path('/tmp/back-rank-mate-b-seeds.json'),seeds)
print(len(seeds),'B candidates')
