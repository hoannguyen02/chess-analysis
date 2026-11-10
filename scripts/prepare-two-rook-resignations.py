"""Find two-rook mating continuations in master games ending before mate."""
import glob,importlib.util,json,sys,collections
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-two-rook-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
paths=['/tmp/discovery-all-corpus.json','/tmp/simplification-extra-corpus.json','/tmp/simplification-more-corpus.json']+glob.glob('/tmp/simplification-final/*.json')
extra='--extra' in sys.argv
output=Path('/tmp/two-rook-resignation-extra-seeds.json' if extra else '/tmp/two-rook-resignation-seeds.json')
records={}
for path in paths:
 for r in json.load(open(path)).get('records',[]):
  sans=r.get('gameMoves',[])
  if not sans or r['headers'].get('Result') not in ['1-0','0-1'] or sans[-1].endswith('#'):continue
  original=sans[-1].startswith('R') or (sans[-1].endswith('+') and any(s.startswith('R') for s in sans[-7:]))
  if extra:
   if original or not (sans[-1].startswith('Q') or (sans[-1].startswith(('B','N')) and any(s.startswith('R') for s in sans[-10:]))):continue
  elif not original:continue
  records.setdefault(r['gameId'],r)
print('candidates',len(records),flush=True)
seeds=[];engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for index,r in enumerate(records.values()):
  color=r['headers']['Result']=='1-0';b=chess.Board(r['gameFen']);boards=[b.copy(stack=False)]
  for san in r['gameMoves']:b.push_san(san);boards.append(b.copy(stack=False))
  last=len(boards)-2
  if boards[last].turn!=color:last-=1
  start=boards[last]
  if len(start.pieces(chess.ROOK,color))!=2:continue
  info=engine.analyse(start,chess.engine.Limit(nodes=40000 if extra else 16000));mate=info['score'].pov(color).mate()
  if mate is None or mate<=0 or mate>7:continue
  end=start.copy()
  for move in info.get('pv',[]):
   end.push(move)
   if end.is_game_over():break
  if not end.is_checkmate() or len(end.pieces(chess.ROOK,color))!=2:continue
  if not any(end.piece_type_at(s)==chess.ROOK for s in end.checkers()):continue
  useful=True
  for square in end.pieces(chess.ROOK,color):
   trial=end.copy();trial.remove_piece_at(square)
   if trial.is_checkmate():useful=False
  if not useful:continue
  for ply in range(last,max(9,last-16),-2):
   board=boards[ply]
   if len(board.pieces(chess.ROOK,color))!=2:continue
   info=engine.analyse(board,chess.engine.Limit(nodes=50000 if extra else 25000));shape=m.inspect(board,info.get('pv',[]))
   if shape and shape['level']!='B':seeds.append(dict(source=r,ply=ply,fen=board.fen(en_passant='fen'),shape=shape))
  if index%100==0 or seeds and index%20==0:
   m.save(output,seeds);print(index,len(seeds),collections.Counter(s['shape']['level'] for s in seeds),flush=True)
finally:
 m.save(output,seeds);engine.quit()
print('final',len(seeds),collections.Counter(s['shape']['level'] for s in seeds),flush=True)
