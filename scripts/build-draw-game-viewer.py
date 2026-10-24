"""Build lazy, local viewer data from preserved sources (requires python-chess)."""
import io
import json
from pathlib import Path
import chess.pgn

root = Path(__file__).resolve().parent.parent
fixtures = root / 'scripts/fixtures/draw-practice'
expanded = json.loads((fixtures / 'expanded-draw-sources.json').read_text())
records, index = {}, {}
def key(fen):
    return ' '.join(fen.split()[:4])
def add(game, kind, lines, positions):
    ident = str(len(records))
    records[ident] = dict(kind=kind, headers=dict(game.headers), fen=game.board().fen(), lines=lines)
    for fen, ply, branch in positions:
        index[key(fen)] = dict(id=ident, kind=kind, ply=ply, branch=branch)
def sans(game, moves):
    board = game.board()
    result = []
    for move in moves:
        result.append(board.san(move))
        board.push(move)
    return result

for row in json.loads((fixtures / 'real-repetition-games.json').read_text()) + [r for rows in expanded['games'].values() for r in rows]:
    game = chess.pgn.read_game(io.StringIO(row['pgn']))
    assert not game.errors
    moves = list(game.mainline_moves())
    board = game.board()
    for move in moves[:row['startPly']]:
        board.push(move)
    add(game, 'game', [sans(game, moves)], [(board.fen(en_passant='fen'), row['startPly'], 0)])

(root / 'src/lib/server/draw-game-sources.json').write_text(json.dumps(records, ensure_ascii=False, separators=(',', ':')) + '\n')
(root / 'src/lib/chess/draw-game-index.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
print(f'{len(records)} sources; {len(index)} exercise positions')
