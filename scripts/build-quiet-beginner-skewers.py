"""Original non-checking queen skewers, with exhaustive short-variation reply coverage.
Run with python-chess. Does not claim a won endgame or engine assessment.
"""
import json
import random
from collections import Counter
from pathlib import Path
import chess

ROOT = Path(__file__).resolve().parents[1]
VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
          chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}


def permits_mate(board):
    for reply in list(board.legal_moves):
        board.push(reply)
        mate = board.is_checkmate()
        board.pop()
        if mate:
            return True
    return False


def branches(board, move, queen, target):
    after = board.copy()
    first = after.san(move)
    after.push(move)
    if after.is_check() or queen not in after.attacks(move.to_square):
        return []
    if not chess.between(move.to_square, target) & chess.BB_SQUARES[queen]:
        return []
    result = []
    for reply in list(after.legal_moves):
        position = after.copy()
        second = position.san(reply)
        lost = VALUES[position.piece_at(reply.to_square).piece_type] if position.is_capture(reply) else 0
        position.push(reply)
        choices = []
        for capture in list(position.legal_moves):
            if not position.is_capture(capture):
                continue
            value = VALUES[position.piece_at(capture.to_square).piece_type]
            end = position.copy()
            third = end.san(capture)
            end.push(capture)
            # Account for any immediate material reply, not only a recapture.
            loss = max([VALUES[end.piece_at(m.to_square).piece_type]
                        for m in end.legal_moves if end.is_capture(m)] or [0])
            gain = value - lost - loss
            if gain >= 2 and not end.is_stalemate() and not permits_mate(end):
                choices.append((gain, [first, second, third], capture.to_square == target))
        if not choices:
            return []
        choices.sort(key=lambda item: -item[0])
        result.append(choices[0])
    return result


def canonical(board):
    """Reject reflected copies, including copies with colors reversed."""
    transforms = (lambda bb: bb, chess.flip_horizontal,
                  chess.flip_vertical,
                  lambda bb: chess.flip_horizontal(chess.flip_vertical(bb)))
    return min(b.transform(diagonal).transform(t).board_fen()
               for b in (board, board.mirror())
               for diagonal in (lambda bb: bb, chess.flip_diagonal)
               for t in transforms)



def build_bishops():
    rng = random.Random(20261026)
    records, seen = [], set()
    landings, shapes = Counter(), Counter()
    for attempt in range(8000000):
        if len(records) == 18:
            break
        # Interleave three different defensive decisions, six of each.
        family = len(records) % 3
        attacker = chess.BISHOP
        destination = rng.randrange(64)
        directions = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
        dx, dy = rng.choice(directions)
        ray = []
        x, y = chess.square_file(destination) + dx, chess.square_rank(destination) + dy
        while 0 <= x < 8 and 0 <= y < 8:
            ray.append(chess.square(x, y))
            x, y = x + dx, y + dy
        if len(ray) < 2:
            continue
        qi, ti = sorted(rng.sample(range(len(ray)), 2))
        queen, target = ray[qi], ray[ti]
        shape = (qi + 1, ti - qi)
        if shapes[shape] >= 4 or landings[(family, destination)] >= 2:
            continue
        # Varied king shelters and defenders, not a fixed corner template.
        king = rng.choice([chess.A1, chess.B1, chess.C1, chess.F1,
                           chess.G1, chess.H1, chess.B2, chess.G2])
        pawn = king + 8
        knight = rng.choice([s for s in range(64)
                             if chess.square_distance(king, s) == 1 and s != pawn])
        origin, enemy_king = rng.sample(range(64), 2)
        if len({destination, queen, target, king, origin, enemy_king,
                pawn, knight}) < 8:
            continue
        board = chess.Board(None)
        for square, piece, color in [(origin, attacker, True), (king, 6, True),
                (enemy_king, 6, False), (queen, 5, False), (target, 4, False),
                (pawn, 1, True), (knight, 2, True)]:
            board.set_piece_at(square, chess.Piece(piece, color))
        if not board.is_valid() or board.is_check():
            continue
        first = chess.Move(origin, destination)
        if first not in board.legal_moves or any(board.is_capture(m) for m in board.legal_moves):
            continue
        key = canonical(board)
        if key in seen:
            continue
        # Introduce Black gradually; these are newly sampled positions, not copies.
        if len(records) % 3 == (len(records) // 3 + 2) % 3:
            board = board.mirror()
            origin, destination, queen, target = map(chess.square_mirror,
                                                     (origin, destination, queen, target))
            first = chess.Move(origin, destination)
        lines = branches(board, first, queen, target)
        def preferred(item):
            if family == 0:
                return item[2] and item[0] == 5
            if family == 1:
                return item[2] and item[0] == 2 and 'x' not in item[1][1]
            probe = board.copy()
            probe.push_san(item[1][0])
            reply = probe.parse_san(item[1][1])
            return probe.piece_at(reply.from_square).piece_type == chess.QUEEN and reply.to_square == destination
        if not lines or not any(preferred(item) for item in lines):
            continue
        for move in list(board.legal_moves):
            if move != first and move.from_square == origin:
                lines.extend(branches(board, move, queen, target))
        lines.sort(key=lambda item: (not preferred(item), item[1][0] != board.san(first), not item[2], -item[0]))
        seen.add(key)
        shapes[shape] += 1
        landings[(family, chess.square_mirror(destination) if board.turn == chess.BLACK else destination)] += 1
        destination = board.parse_san(lines[0][1][0]).to_square
        number = len(records) + 1
        piece_name = 'Tượng' if attacker == chess.BISHOP else 'Xe'
        axis = 'đường chéo'
        label = ['Bắt quân phía sau', 'Đổi Tượng lấy Xe', 'Hậu bắt Tượng'][family]
        records.append(dict(
            title=f'Xiên Hậu · {number} · {label}', beginner=True, beginnerKind='queen',
            prompt='Tấn công Hậu, rồi chọn nước bắt có lợi theo cách đối thủ đáp lại.',
            mode='interactive', outcome='skewer', fen=board.fen(),
            moves=lines[0][1], alternativeLines=[item[1] for item in lines[1:]],
            hints=[f'Tìm {axis} có Hậu đứng trước Xe.',
                   f'Kiểm tra quân bảo vệ ô {chess.square_name(destination)}. Hậu có bắt được {piece_name} có lợi không?'],
            solution=[
                'Tượng tấn công Hậu và Xe trên cùng đường chéo. Hậu tránh đi, Tượng bắt Xe phía sau.',
                'Sau khi Hậu tránh đi, Tượng bắt Xe dù có thể bị bắt lại. Đổi Tượng (3 điểm) lấy Xe (5 điểm) vẫn lời 2 điểm.',
                'Hậu bắt Tượng, nhưng Tượng được bảo vệ. Bắt lại Hậu bằng quân bảo vệ: đừng chỉ nhìn Xe phía sau.'
            ][family],
            source='original-composition'))
        print(f'Accepted {number}: {board.fen()} ({attempt + 1} candidates)', flush=True)
    if len(records) != 18:
        raise RuntimeError(f'Only found {len(records)} verified positions')
    return records


def loss(b):
    """Largest immediately available capture by the side to move."""
    return max([VALUES[b.piece_at(x.to_square).piece_type] for x in b.legal_moves if b.is_capture(x)] or [0])

def continuations(b, gain):
    """Cover every opposing reply when a capture needs a further exchange. Quiet replies may end the task; captures require a safe material balance after recapture."""
    if b.is_stalemate() or permits_mate(b):
        return None
    if gain - loss(b) >= 2:
        return [[]]
    lines = []
    for reply in list(b.legal_moves):
        cost = VALUES[b.piece_at(reply.to_square).piece_type] if b.is_capture(reply) else 0
        san = b.san(reply)
        b.push(reply)
        if gain - cost >= 2 and (not b.is_check()):
            if not cost:
                lines.append([san])
                b.pop()
                continue
        options = []
        for cap in list(b.legal_moves):
            if not b.is_capture(cap):
                continue
            value = VALUES[b.piece_at(cap.to_square).piece_type]
            cs = b.san(cap)
            b.push(cap)
            if gain - cost + value - loss(b) >= 2 and (not b.is_stalemate()) and (not permits_mate(b)):
                options.append((gain - cost + value, [san, cs]))
            b.pop()
        b.pop()
        if not options:
            return None
        lines.append(max(options, key=lambda x: x[0])[1])
    return lines or None

def rook_branches(b, move, q, t):
    """Cover all replies to a non-checking rook skewer, extending exchanges when needed."""
    a = b.copy()
    first = a.san(move)
    a.push(move)
    if a.is_check() or q not in a.attacks(move.to_square) or (not chess.between(move.to_square, t) & chess.BB_SQUARES[q]):
        return []
    lines = []
    for reply in list(a.legal_moves):
        p = a.copy()
        second = p.san(reply)
        lost = VALUES[p.piece_at(reply.to_square).piece_type] if p.is_capture(reply) else 0
        p.push(reply)
        options = []
        for cap in list(p.legal_moves):
            if not p.is_capture(cap):
                continue
            value = VALUES[p.piece_at(cap.to_square).piece_type]
            end = p.copy()
            third = end.san(cap)
            end.push(cap)
            suffixes = continuations(end, value - lost)
            if suffixes is not None:
                options.append((cap.from_square == move.to_square and cap.to_square == t, value - lost, [[first, second, third] + s for s in suffixes]))
        if not options:
            return []
        best = max(options, key=lambda x: (x[1], x[0]))
        lines.extend(best[2])
    return lines

def build_rooks():
    """Sample distinct file and rank skewers. The extra knight protects the rear square. Exclude an already-free capture worth more than two points, but allow a knight-for-rook exchange: the requested task is a queen skewer."""
    rng = random.Random(142)
    found = []
    seen = set()
    for i in range(2000000):
        axis = len(found) % 2
        dest = rng.randrange(64)
        step = rng.choice([-1, 1]) * (8 if axis == 0 else 1)
        ray = []
        for n in range(1, 8):
            t = dest + step * n
            if not 0 <= t < 64 or (axis == 1 and t // 8 != dest // 8):
                break
            ray.append(t)
        if len(ray) < 2:
            continue
        (qi, ti) = sorted(rng.sample(range(len(ray)), 2))
        (q, t) = (ray[qi], ray[ti])
        b = chess.Board(None)
        king = rng.choice([chess.G1, chess.B1, chess.H1, chess.A1])
        origin = rng.randrange(64)
        ek = rng.randrange(16, 64)
        support = rng.choice(list(chess.SquareSet(chess.BB_KNIGHT_ATTACKS[t])))
        near = king - 1 if king % 8 else king + 1
        pieces = [(king, 6, 1), (king + 8, 1, 1), (near, 2, 1), (origin, 4, 1), (ek, 6, 0), (q, 5, 0), (t, 4, 0), (support, 2, 1)]
        if len({x[0] for x in pieces} | {dest}) != 9:
            continue
        for (sq, p, c) in pieces:
            b.set_piece_at(sq, chess.Piece(p, bool(c)))
        if not b.is_valid() or b.is_check():
            continue
        move = chess.Move(origin, dest)
        if move not in b.legal_moves or b.is_capture(move):
            continue
        if any((b.is_capture(mm) and mm.from_square == origin for mm in b.legal_moves)):
            continue
        invalid = False
        for cap in list(b.legal_moves):
            if b.is_capture(cap):
                val = VALUES[b.piece_at(cap.to_square).piece_type]
                b.push(cap)
                invalid = val - loss(b) > 2
                b.pop()
                if invalid:
                    break
        if invalid:
            continue
        key = canonical(b)
        if key in seen:
            continue
        ls = rook_branches(b, move, q, t)
        main = []
        for line in ls:
            c = b.copy()
            one = c.push_san(line[0])
            two = c.push_san(line[1])
            three = c.parse_san(line[2])
            if two.from_square == q and three.from_square == dest and (three.to_square == t) and (len(line) == 3):
                main.append(line)
        if not main:
            continue
        seen.add(key)
        found.append(dict(fen=b.fen(), move=move.uci(), queen=q, target=t, moves=main[0], alternativeLines=[l for l in ls if l != main[0]]))
        print(len(found), i, b.fen(), main[0], flush=True)
        if len(found) == 12:
            break
    if len(found) != 12:
        raise RuntimeError('Insufficient verified rook skewers')
    return found


def combine(bishops, rooks):
    rook_records = []
    for i, raw in enumerate(rooks):
        board = chess.Board(raw['fen'])
        lines = [raw['moves'], *raw['alternativeLines']]
        if i % 3 == 2:
            # Mirror an independently sampled position, never add both copies.
            mirrored = []
            for line in lines:
                original, flipped = board.copy(), board.mirror()
                converted = []
                for san in line:
                    move = original.parse_san(san)
                    counterpart = chess.Move(chess.square_mirror(move.from_square),
                                             chess.square_mirror(move.to_square), move.promotion)
                    converted.append(flipped.san(counterpart))
                    original.push(move)
                    flipped.push(counterpart)
                mirrored.append(converted)
            board = board.mirror()
            lines = mirrored
        axis = 'cột' if i % 2 == 0 else 'hàng'
        rook_records.append(dict(
            title=f'Xiên Hậu · Xe trên {axis}', beginner=True, beginnerKind='queen',
            prompt='Dùng Xe tạo đòn xiên Hậu, rồi chọn nước bắt có lợi.',
            mode='interactive', outcome='skewer', fen=board.fen(),
            moves=lines[0], alternativeLines=lines[1:],
            hints=[f'Tìm Hậu và Xe đối phương trên cùng {axis}.',
                   'Kiểm tra quân bảo vệ Xe ở cả ô tấn công và ô bắt quân phía sau.'],
            solution=f'Xe tấn công Hậu và Xe phía sau trên cùng {axis}. Sau khi Hậu rời đường, bắt Xe phía sau. Nếu Hậu bắt lại Xe, hãy kiểm tra nước bắt lại Hậu bằng quân bảo vệ.',
            source='original-composition'))
    result = []
    for group in range(6):
        result.extend(bishops[group * 3:group * 3 + 3])
        result.extend(rook_records[group * 2:group * 2 + 2])
    for i, exercise in enumerate(result):
        exercise['title'] = f'Xiên Hậu · {i + 1}'
    if len({canonical(chess.Board(e['fen'])) for e in result}) != 30:
        raise RuntimeError('Duplicate queen-skewer compositions')
    return result


def build():
    return combine(build_bishops(), build_rooks())


if __name__ == '__main__':
    from audit_queen_skewer_replies import audit_replies
    data = audit_replies(build())
    (ROOT / 'src/lib/chess/skewer-quiet-beginner-exercises.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'Built {len(data)} non-checking beginner skewers')
