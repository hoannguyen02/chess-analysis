"""Search actual game positions, including positions before a missed mating chance.

A terminal-position filter is insufficient: a player may miss the combination,
or resign one move after the best exercise position. Candidates remain unpublished
until collector, independent review and all-defence proof succeed.
"""
import argparse,collections,importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-arabian-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ap=argparse.ArgumentParser();ap.add_argument('corpus',nargs='+');ap.add_argument('--output',required=True);ap.add_argument('--scout-nodes',type=int,default=2500);args=ap.parse_args()
seen={r['gameId'] for r in json.load(open(m.DATA/'master-researched.json'))['records']};records={}
for path in args.corpus:
 for r in json.load(open(path))['records']:records.setdefault(r['gameId'],r)
seeds=[];scanned=0;engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for index,r in enumerate(records.values()):
  if r['gameId'] in seen:continue
  b=chess.Board(r['gameFen']);positions=[]
  for ply,san in enumerate(r['gameMoves']):
   if ply>=10 and ply>=len(r['gameMoves'])-24:positions.append((ply,b.copy(stack=False)))
   b.push_san(san)
  positions.append((len(r['gameMoves']),b.copy(stack=False)))
  for ply,b in reversed(positions):
   c=b.turn;k=b.king(not c)
   if b.is_game_over() or not b.pieces(chess.ROOK,c) or not b.pieces(chess.KNIGHT,c):continue
   if min(chess.square_distance(k,q) for q in [0,7,56,63])>1:continue
   scanned+=1
   info=engine.analyse(b,chess.engine.Limit(nodes=args.scout_nodes));mate=info['score'].pov(c).mate()
   if (mate is None and info['score'].pov(c).score()<1200) or (mate is not None and (mate<=0 or mate>9)):continue
   info=engine.analyse(b,chess.engine.Limit(nodes=140000));shape=m.inspect(b,info.get('pv',[]))
   if shape:
    seeds.append(dict(source=r,ply=ply,fen=b.fen(en_passant='fen'),shape=shape));m.save(Path(args.output),seeds)
    print('candidate',index,shape['level'],r['headers'].get('White'),shape['moves'],flush=True)
  if index%500==0:print('progress',index,'positions',scanned,'seeds',len(seeds),flush=True)
finally:engine.quit();m.save(Path(args.output),seeds)
print('finished',len(records),'games',scanned,'positions',collections.Counter(s['shape']['level'] for s in seeds),flush=True)
