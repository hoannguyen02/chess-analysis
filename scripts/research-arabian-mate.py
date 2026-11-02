"""Search longer sacrificial continuations in cached master-game archives.

Outputs candidates only. Collection and independent review are still required.
"""
import collections,glob,importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-arabian-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
paths=sys.argv[1:] or ['/tmp/arabian-pgn/corpus.json']
seen={r['gameId'] for r in json.loads((m.DATA/'master-researched.json').read_text())['records']}
records={}
for path in paths:
 for r in json.load(open(path)).get('records',[]):
  if r['gameId'] in seen:continue
  sans=r.get('gameMoves',[])
  if len(sans)<20 or r['headers'].get('Result') not in ['1-0','0-1'] or sans[-1].endswith('#'):continue
  records.setdefault(r['gameId'],r)
output=Path('/tmp/arabian-mate-resignation-seeds.json');seeds=[]
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
print('games',len(records),flush=True)
try:
 for index,r in enumerate(records.values()):
  color=r['headers']['Result']=='1-0';b=chess.Board(r['gameFen']);boards=[b.copy(stack=False)]
  for san in r['gameMoves']:b.push_san(san);boards.append(b.copy(stack=False))
  last=len(boards)-1
  if boards[last].turn!=color:last-=1
  start=boards[last]
  if not start.pieces(chess.KNIGHT,color) or not start.pieces(chess.ROOK,color):continue
  probe=engine.analyse(start,chess.engine.Limit(nodes=25000));mate=probe['score'].pov(color).mate()
  if mate is None or mate<=0 or mate>9:continue
  for ply in range(last,max(9,last-22),-2):
   board=boards[ply]
   if not board.pieces(chess.KNIGHT,color) or not board.pieces(chess.ROOK,color):continue
   info=engine.analyse(board,chess.engine.Limit(nodes=80000));shape=m.inspect(board,info.get('pv',[]))
   if shape and shape['level'] in ['A','B','C','C*','D']:
    seeds.append(dict(source=r,ply=ply,fen=board.fen(en_passant='fen'),shape=shape));m.save(output,seeds)
    print('candidate',index,r['headers'].get('White'),shape['moves'],flush=True)
  if index%200==0:print('progress',index,'seeds',len(seeds),flush=True)
finally:m.save(output,seeds);engine.quit()
print('final',len(seeds),flush=True)
