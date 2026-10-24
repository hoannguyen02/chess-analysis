"""Replay sourced games and audit bounded teaching lines; requires python-chess/Stockfish."""
import argparse, copy, hashlib, io, json
from pathlib import Path
import chess
import chess.engine
import chess.pgn

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures/london'
parser = argparse.ArgumentParser()
parser.add_argument('--engine', default='/opt/homebrew/bin/stockfish')
args = parser.parse_args()
games = json.loads((FIX / 'games.json').read_text())
lessons = json.loads((FIX / 'lessons.json').read_text())
for game in games:
    parsed = chess.pgn.read_game(io.StringIO(game['pgn']))
    assert parsed and not parsed.errors
    board = parsed.board()
    fens, moves = [board.fen()], []
    for move in parsed.mainline_moves():
        moves.append(board.san(move)); board.push(move); fens.append(board.fen())
    assert fens == game['fens'] and moves == game['moves']
    for field, header in [('white','White'), ('black','Black'), ('result','Result'), ('date','Date')]:
        assert game[field] == parsed.headers[header]
    game['summary'] = {
        'ding-nepo-2023': 'Trắng thắng: hạn chế cánh hậu, cải thiện quân và phối hợp tấn công. Đen có cơ hội phòng thủ; không phải thắng ngay từ khai cuộc.',
        'carlsen-aronian-2019': 'Đen thắng: phản công trung tâm, tận dụng 21.Nh4 và chuyển hóa tàn cuộc. Đây là ván cờ nhanh; nhiều quyết định cần được xem lại.',
        'keres-fischer-1959': 'Đen thắng: hoạt động quân và an toàn vua trong cấu trúc có tượng g7. Vị trí còn thay đổi nhiều; 24.Bb5 tạo cơ hội chiến thuật rõ rệt.',
    }[game['id']]
lookup = {g['id']: g for g in games}
audit = {'engine': '', 'rootNodes': 1000000, 'continuationNodes': 250000, 'games': [], 'exercises': []}
for g in games:
    audit['games'].append({'id': g['id'], 'source': g['source'], 'pgnSha256': hashlib.sha256(g['pgn'].encode()).hexdigest()})
with chess.engine.SimpleEngine.popen_uci(args.engine) as engine:
    engine.configure({'Threads': 2, 'Hash': 128})
    audit['engine'] = engine.id.get('name')
    for lesson in lessons:
        for ex in lesson['exercises']:
            game = lookup[ex['gameId']]
            ex['fen'] = game['fens'][ex['ply']]
            board = chess.Board(ex['fen'])
            assert board.turn == (ex['side'] == 'white')
            preferred = board.parse_san(ex.pop('preferred'))
            infos = engine.analyse(board, chess.engine.Limit(nodes=1000000), multipv=5)
            score = lambda info: info['score'].pov(board.turn).score(mate_score=100000)
            best = max(score(info) for info in infos)
            selected = next((info for info in infos if info['pv'][0] == preferred), None)
            if selected is None:
                selected = engine.analyse(board, chess.engine.Limit(nodes=1000000), root_moves=[preferred])
            if best - score(selected) > 60:
                raise ValueError(f"{ex['id']}: preferred move loses {best-score(selected)} cp against bounded best")
            # Retain a small set of reasonable alternatives, all at the same depth budget.
            roots = [selected] + [i for i in infos if i['pv'][0] != preferred and best-score(i) <= 35][:2]
            length = 1 if lesson['level'] in ('A','B') else 3 if lesson['level'] in ('C','C*') else 5
            lines, checks = [], []
            for info in roots:
                b = board.copy(); line = []; nodes = []
                move = info['pv'][0]
                for step in range(length):
                    if step:
                        if b.is_game_over(): break
                        info2 = engine.analyse(b, chess.engine.Limit(nodes=250000))
                        move = info2['pv'][0]
                        nodes.append({'fen': b.fen(), 'scoreWhite': info2['score'].white().score(mate_score=100000), 'depth': info2['depth']})
                    line.append(b.san(move)); b.push(move)
                # A teaching line ends after the learner's turn, unless the game ends first.
                lines.append(line); checks.append({'rootScoreLearner': score(info), 'depth': info['depth'], 'nodes': nodes})
            ex['lines'] = lines
            piece = board.piece_at(preferred.from_square)
            names = {chess.PAWN: 'tốt', chess.KNIGHT: 'mã', chess.BISHOP: 'tượng', chess.ROOK: 'xe', chess.QUEEN: 'hậu', chess.KING: 'vua'}
            ex['hints'] = [lesson['takeaway'], f"Xem {names[piece.piece_type]} ở {chess.square_name(preferred.from_square)}.", f"Một lựa chọn: {board.san(preferred)}."]
            audit['exercises'].append({'id': ex['id'], 'fen': ex['fen'], 'bestScoreLearner': best, 'checks': checks, 'lines': copy.deepcopy(lines)})
            print(ex['id'], lines[0], 'gap', best-score(selected), flush=True)
(FIX / 'audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n')
# Reuse the separately audited library when rebuilding the editorial exercises.
if (FIX / 'library.json').exists():
    library = json.loads((FIX / 'library.json').read_text())
    games.extend(library['games'])
    for record in library['exercises']:
        ex = dict(record)
        lesson_id = ex.pop('lessonId')
        next(l for l in lessons if l['id'] == lesson_id)['exercises'].append(ex)
if (FIX / 'expansion.json').exists():
    expansion = json.loads((FIX / 'expansion.json').read_text())
    games.extend(expansion['games'])
    lessons.extend(expansion['lessons'])
assert len({tuple(g['moves']) for g in games}) == len(games)
(ROOT / 'src/lib/server/london-course.json').write_text(json.dumps({'version': 1, 'lessons': lessons, 'games': games}, ensure_ascii=False, indent=2)+'\n')

from london_coverage import write_coverage
write_coverage(json.loads((ROOT / "src/lib/server/london-course.json").read_text()))
