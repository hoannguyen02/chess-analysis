"""Build sparse royal skewers; verify every legal defence and bishop endings."""
import json
import random
from pathlib import Path
import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
NAMES = {chess.ROOK: 'Xe', chess.BISHOP: 'Tượng', chess.QUEEN: 'Hậu'}
TARGET_NAMES = {**NAMES, chess.KNIGHT: 'Mã', chess.PAWN: 'Tốt'}
# Vary rear targets; avoid already-drawn same-color bishop-only positions.
TARGETS = [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT] * 4 + [chess.QUEEN, chess.ROOK, chess.PAWN, chess.PAWN]


def solutions(board, target):
    lines = []
    for move in list(board.legal_moves):
        piece = board.piece_at(move.from_square)
        if piece.piece_type not in NAMES or board.is_capture(move):
            continue
        after = board.copy()
        first = after.san(move)
        after.push(move)
        if not after.is_check():
            continue
        # Removing the checked king must expose the rear target on the same ray.
        if not chess.between(move.to_square, target) & chess.BB_SQUARES[after.king(after.turn)]:
            continue
        ray = after.copy()
        ray.remove_piece_at(after.king(after.turn))
        if target not in ray.attacks(move.to_square):
            continue
        replies = list(after.legal_moves)
        if not replies:
            continue
        branches = []
        for reply in replies:
            if after.piece_at(reply.from_square).piece_type != chess.KING:
                break
            end = after.copy()
            second = end.san(reply)
            end.push(reply)
            capture = chess.Move(move.to_square, target)
            if capture not in end.legal_moves:
                break
            third = end.san(capture)
            end.push(capture)
            if end.is_attacked_by(end.turn, target) or end.is_stalemate():
                break
            branches.append([first, second, third])
        else:
            lines.extend(branches)
    return lines


def add_bishop_pawns(records):
    # Preserve the existing geometry and other exercises. A protected central
    # pawn avoids ending the lesson with only a king and bishop.
    with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
        engine.configure({'Threads': 1, 'Hash': 64})
        for record in records:
            base = chess.Board(record['fen'])
            side = base.turn
            first = base.parse_san(record['moves'][0])
            if base.piece_at(first.from_square).piece_type != chess.BISHOP:
                continue
            target_board = base.copy()
            for san in record['moves'][:2]: target_board.push_san(san)
            target = target_board.parse_san(record['moves'][2]).to_square
            candidates = sorted(range(8, 56), key=lambda sq: (chess.square_distance(sq, base.king(side)), sq))
            for square in candidates:
                if base.piece_at(square) or chess.square_file(square) in (0, 7): continue
                if chess.square_rank(square) == (6 if side else 1): continue
                board = base.copy()
                board.set_piece_at(square, chess.Piece(chess.PAWN, side))
                if not board.is_valid() or board.is_check(): continue
                if any(board.is_capture(m) for m in board.legal_moves): continue
                if board.is_attacked_by(not side, square): continue
                lines = solutions(board, target)
                if not lines or {line[0] for line in lines} != {record['moves'][0]}: continue
                for line in lines:
                    end = board.copy()
                    for san in line: end.push_san(san)
                    if end.is_game_over() or end.is_attacked_by(not side, square): break
                    result = engine.analyse(end, chess.engine.Limit(nodes=50000))
                    if result['score'].pov(side).score(mate_score=100000) < 300: break
                else:
                    record['fen'] = board.fen()
                    record['moves'], record['alternativeLines'] = lines[0], lines[1:]
                    record['solution'] = record['solution'].split(' Đây là bài tập')[0] + ' Bạn còn Tượng và Tốt để tiếp tục ván cờ.'
                    break
            else:
                raise RuntimeError('No suitable pawn for ' + record['title'])
    return records


def build():
    rng = random.Random(20261024)
    records = []
    seen = set()
    for attacker in [chess.ROOK, chess.BISHOP, chess.QUEEN]:
        count = 0
        while count < 20:
            color = chess.WHITE if count % 2 == 0 else chess.BLACK
            rear = ([chess.QUEEN, chess.ROOK, chess.KNIGHT] * 6 + [chess.PAWN] * 2)[count] if attacker == chess.BISHOP else TARGETS[count]
            start, own_king, enemy_king, target = rng.sample(range(64), 4)
            board = chess.Board(None)
            board.turn = color
            for square, kind, side in [(start, attacker, color), (own_king, chess.KING, color),
                                       (enemy_king, chess.KING, not color), (target, rear, not color)]:
                board.set_piece_at(square, chess.Piece(kind, side))
            if not board.is_valid() or board.is_check() or board.is_game_over() or board.fen() in seen:
                continue
            # No piece is already capturable: the skewer must actually be created.
            if any(board.is_capture(m) for m in board.legal_moves):
                continue
            lines = solutions(board, target)
            if not lines or len({line[0] for line in lines}) != 1:
                continue
            first = board.parse_san(lines[0][0])
            capture_board = board.copy()
            capture_board.push_san(lines[0][0])
            capture_board.push_san(lines[0][1])
            last = capture_board.parse_san(lines[0][2])
            dx = chess.square_file(last.to_square) - chess.square_file(first.to_square)
            dy = chess.square_rank(last.to_square) - chess.square_rank(first.to_square)
            axis = 'file' if dx == 0 else 'rank' if dy == 0 else 'rising' if dx * dy > 0 else 'falling'
            axes = ['file', 'rank'] if attacker == chess.ROOK else ['rising', 'falling'] if attacker == chess.BISHOP else ['file', 'rank', 'rising', 'falling']
            # Shift across blocks so rear piece type does not dictate the axis.
            if axis != axes[(count + count // 4) % len(axes)]:
                continue
            seen.add(board.fen())
            count += 1
            name = NAMES[attacker]
            records.append(dict(title=f'{name}: chiếu rồi bắt quân · {count}', beginner=True,
                prompt=f'Dùng {name.lower()} chiếu Vua, rồi bắt quân phía sau.', mode='interactive',
                outcome='skewer', fen=board.fen(), moves=lines[0], alternativeLines=lines[1:],
                hints=['Tìm đường thẳng hoặc đường chéo có Vua và quân đối phương đứng nối nhau.'],
                solution=f'{name} chiếu Vua trên đường có quân phía sau. Khi Vua rời đường chiếu, bắt {TARGET_NAMES[rear]} phía sau mà không bị bắt lại. Đây là bài tập thắng quân, không phải mọi thế cuối đều thắng ván cờ.',
                source='original-composition'))
    # Introduce every attacking piece within the first three exercises.
    return [records[group * 20 + index] for index in range(20) for group in range(3)]


if __name__ == '__main__':
    # Original lessons 17, 26 and 35 were explicitly removed by the user.
    records = add_bishop_pawns([r for i, r in enumerate(build()) if i not in (16, 25, 34)])
    counts = {}
    for record in records:
        label = record['title'].split(' · ')[0]
        counts[label] = counts.get(label, 0) + 1
        record['title'] = f'{label} · {counts[label]}' 
    (ROOT / 'src/lib/chess/skewer-beginner-exercises.json').write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    print(f'Built {len(records)} original puzzles')
