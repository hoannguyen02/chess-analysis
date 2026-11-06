"""Prepare distinct candidates, not publication, from historical sources and composition."""
import json,chess,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-expansion'
def save(n,x):(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
rows=[]
rows.append(dict(id='minor-promotion-avoids-pat',level='A',goal='material',fen='8/k1P5/2K5/8/1N6/8/8/8 w - - 0 1',moves=['c8=B','Ka8'],alternatives=[['c8=N+','Ka8']],solverMoves=1,minimumGain=220,source='Thế cờ biên soạn.',mechanism='Both Queen and Rook stalemate; Bishop or Knight retains a minor-piece gain. Four-piece introduction, unlike the existing Rook-only anti-pat decision.'))
rows.append(dict(id='krobshofer-bishop-selfblock',level='D',goal='checkmate',fen='8/1KP5/8/2p5/1pP5/p7/k7/1R3R2 w - - 0 1',moves=['c8=B','b3','Bg4','b2','Bd1','Kxb1','Bb3#'],solverMoves=4,source='Oswald von Krobshofer, thế cờ biên soạn, Münchner Neueste Nachrichten, 11-09-1904. https://www.chesshistory.com/winter/extra/underpromotion.html',mechanism='Bishop routes to d1 to block its own Rook, permits Kxb1, then discovers mate. Complex positional Rook sacrifice with four solver moves; not a non-sacrificial C* line.',sourceUrl='https://www.chesshistory.com/winter/extra/underpromotion.html'))
r=json.loads((D/'archive-leads.json').read_text())[-1];b=chess.Board(r['gameFen']);ply=r['ply']-6
for san in r['gameMoves'][:ply]:b.push_san(san)
prev=chess.Board(r['gameFen'])
for san in r['gameMoves'][:ply-1]:prev.push_san(san)
rows.append(dict(id='alapin-rubinstein-rook-mate',level='C*',goal='checkmate',fen=b.fen(en_passant='fen'),moves=r['gameMoves'][ply:],solverMoves=5,source=r['source'],sourceGame=r,ply=ply,previousMove=dict(fen=prev.fen(en_passant='fen'),move=r['gameMoves'][ply-1]),mechanism='Pawn check, equal Knight/Bishop exchange, Rook underpromotion avoids pat, final rank mate. Five solver moves, no net sacrifice.'))
sans='e4 e5 f4 exf4 b3 Qh4+ g3 fxg3 h3 g2+ Ke2 Qxe4+ Kf2 gxh1=N#'.split();b=chess.Board()
for san in sans:b.push_san(san)
headers=dict(White='M. B.',Black='Alphonse Goetz',Event='Ván đấu lịch sử, khoảng năm 1880',Site='Strasbourg',Date='????.??.??',Result='0-1')
game=dict(gameId='goetz-historical-knight',headers=headers,gameFen=chess.STARTING_FEN,gameMoves=sans,source='https://www.chesshistory.com/winter/extra/underpromotion.html',dateQualification='Approximately 1880; retrospectively reported. Not represented as a verified master tournament game.')
b=chess.Board()
for san in sans[:11]:b.push_san(san)
prev=chess.Board()
for san in sans[:10]:prev.push_san(san)
rows.append(dict(id='goetz-queen-knight-mate',level='A',goal='checkmate',fen=b.fen(en_passant='fen'),moves=sans[11:],solverMoves=2,source=game['source'],sourceGame=game,ply=11,previousMove=dict(fen=prev.fen(en_passant='fen'),move=sans[10]),mechanism='Queen check redirects King, then capture-promotion to Knight mates through a crowded cage. Earlier discovery start excluded: Qxe4+ is a simpler material-winning candidate.'))
for r in rows:
 b=chess.Board(r['fen']);assert b.is_valid()
 for san in r['moves']:b.push_san(san)
 if r['goal']=='checkmate':assert b.is_checkmate()
save('candidates.json',rows);print([(r['id'],r['level']) for r in rows])
