"""Verify short pin-creation compositions and every saved defensive branch."""
import json
from pathlib import Path
import chess
VALUES={1:100,2:320,3:330,4:500,5:900,6:0}
def material(b,c):return sum(VALUES[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def branches(board,root,front,back):
 color=board.turn;base=material(board,color);b=board.copy();first=b.san(root);b.push(root)
 if b.is_check() or not b.legal_moves.count():return []
 if front not in b.attacks(root.to_square) or not chess.between(root.to_square,back)&chess.BB_SQUARES[front]:return []
 # The pin must prevent a real escape, not merely accompany a blocked piece.
 escapes=[]
 for move in list(b.generate_pseudo_legal_moves()):
  if move.from_square!=front or move in b.legal_moves:continue
  free=b.copy();free.push(move)
  if move.to_square not in free.attacks(root.to_square):escapes.append(move)
 if not escapes:return []
 lines=[]
 for reply in list(b.legal_moves):
  a=b.copy();second=a.san(reply);a.push(reply);options=[]
  for capture in list(a.legal_moves):
   if capture.from_square!=root.to_square or capture.to_square not in [front,back] or not a.is_capture(capture):continue
   z=a.copy();third=z.san(capture);z.push(capture)
   if z.is_game_over():continue
   worst=material(z,color)-base
   for answer in list(z.legal_moves):
    z.push(answer);worst=min(worst,material(z,color)-base)
    if z.is_checkmate():worst=-100000
    z.pop()
   if worst>=100:options.append((worst,[first,second,third]))
  if not options:return []
  lines.append(max(options,key=lambda x:x[0])[1])
 return lines

def verify(record):
 e=record['exercise'];p=e['pinCreation'];b=chess.Board(e['fen'])
 assert b.is_valid() and not b.is_check()
 assert not any(b.is_capture(m) for m in b.legal_moves),'A free capture bypasses pin creation'
 root=b.parse_san(e['moves'][0]);front=chess.parse_square(p['front']);back=chess.parse_square(p['back'])
 assert not b.is_capture(root) and not b.gives_check(root)
 assert not b.is_pinned(not b.turn,front)
 lines=branches(b,root,front,back)
 assert lines and {tuple(x) for x in lines}=={tuple(x) for x in [e['moves']]+e['alternativeLines']}
 for probe in record.get('defenceProbes',[]):assert probe['materialGainAfterEightPlies']>=100
 return True

if __name__=='__main__':
 path=Path(__file__).resolve().parent/'fixtures/pin/beginner-creation.json'
 records=json.loads(path.read_text())
 for r in records:verify(r)
 print('Verified',len(records),'pin-creation positions and all defensive branches.')
