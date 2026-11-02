"""Reuse researched mating candidates, then independently validate queen-rook shape."""
import glob,importlib.util,json,sys
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-queen-rook-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
seeds=[];seen=set()
for filename in glob.glob('/tmp/*resignation*seeds.json')+glob.glob('/tmp/back-rank-mate-new*seeds.json'):
 if 'queen-rook' in filename:continue
 for r in json.loads(Path(filename).read_text()):
  key=(r['source']['gameId'],r['fen'])
  if key in seen:continue
  seen.add(key);board=chess.Board(r['fen']);pv=[]
  for san in r['shape']['moves']:
   move=board.parse_san(san);pv.append(move);board.push(move)
  shape=m.inspect(chess.Board(r['fen']),pv)
  if shape:seeds.append(dict(r,shape=shape))
m.save(Path('/tmp/queen-rook-mate-resignation-seeds.json'),seeds)
from collections import Counter
print(len(seeds),Counter(s['shape']['level'] for s in seeds))
