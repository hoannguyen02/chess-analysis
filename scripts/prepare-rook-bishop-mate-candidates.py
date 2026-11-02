"""Independently inspect locally saved mating research for rook/bishop coordination."""
import importlib.util,json,collections
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-rook-bishop-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
seeds=[];seen=set()
for path in (ROOT/'scripts/fixtures').rglob('*researched.json'):
 if 'rook-bishop-mate' in str(path):continue
 for r in json.loads(path.read_text()).get('records',[]):
  if not all(k in r for k in ['gameId','gameMoves','gameFen','source','headers','ply','fen','moves']):continue
  key=(r['gameId'],r['fen'])
  if key in seen:continue
  seen.add(key);b=chess.Board(r['fen']);pv=[]
  try:
   for san in r['moves']:
    move=b.parse_san(san);pv.append(move);b.push(move)
  except ValueError:continue
  shape=m.inspect(chess.Board(r['fen']),pv)
  if shape:seeds.append(dict(source=r,ply=r['ply'],fen=r['fen'],shape=shape))
m.save(Path('/tmp/rook-bishop-mate-saved-seeds.json'),seeds)
print(len(seeds),collections.Counter(s['shape']['level'] for s in seeds))
