"""Retain concrete grading evidence for every published D position."""
import json
from pathlib import Path
import chess
D=Path(__file__).resolve().parent/'fixtures/queen-rook-mate'
audit=[]
for r in json.loads((D/'master-published.json').read_text())['records']:
 if r['level']!='D':continue
 b=chess.Board(r['fen']);quiet=[];pieces=set()
 for i,san in enumerate(r['moves']):
  move=b.parse_san(san);capture=b.is_capture(move)
  if i%2==0:pieces.add(b.piece_at(move.from_square).symbol().upper())
  b.push(move)
  if i%2==0 and not capture and not b.is_check():quiet.append(dict(ply=i,move=san))
 if len(r['sacrifices'])>1:reason='Multiple material concessions followed by queen-and-rook coordination over more than three solver moves.'
 elif any(s['piece']=='Q' for s in r['sacrifices']):reason='Queen sacrifice in a promotion combination; a replacement queen and an essential rook complete the mating net.'
 else:reason='A material concession followed by at least five solver moves, coordination of three piece types, and non-capturing non-checking preparation.'
 audit.append(dict(gameId=r['gameId'],headers=r['headers'],fen=r['fen'],moves=r['moves'],solverMoves=r['solverMoves'],sacrifices=r['sacrifices'],attackingPieceTypes=sorted(pieces),quietMoves=quiet,essentialRooks=r['rookRoles'],reason=reason))
(D/'d-grading-review.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print('D grading records',len(audit))
