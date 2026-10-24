"""Choose strong automatic defences without removing exploratory branches."""
import argparse
import hashlib
import json
from pathlib import Path

import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/lib/chess/skewer-quiet-beginner-exercises.json'
AUDIT = ROOT / 'scripts/fixtures/skewer/queen-reply-audit.json'


def branch_digest(exercise):
    lines = sorted([exercise['moves'], *exercise.get('alternativeLines', [])])
    payload = json.dumps([exercise['fen'], lines], ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(payload.encode()).hexdigest()


def audit_replies(exercises, engine_path='/opt/homebrew/bin/stockfish', nodes=1000000):
    audit = {'nodesPerPosition': nodes, 'multiPV': 3, 'positions': []}
    with chess.engine.SimpleEngine.popen_uci(engine_path) as engine:
        engine.configure({'Threads': 1, 'Hash': 128})
        audit['engine'] = engine.id
        for exercise in exercises:
            lines = [exercise['moves'], *exercise.get('alternativeLines', [])]
            prefixes = sorted({tuple(line[:i]) for line in lines
                               for i in range(1, len(line), 2)})
            ranks = {}
            records = []
            for prefix in prefixes:
                board = chess.Board(exercise['fen'])
                for san in prefix:
                    board.push_san(san)
                # No root-move restriction: compare against every legal defence.
                engine.configure({'Clear Hash': None})
                infos = engine.analyse(board, chess.engine.Limit(nodes=nodes), multipv=3)
                choices = [board.san(info['pv'][0]) for info in infos]
                available = {line[len(prefix)] for line in lines
                             if tuple(line[:len(prefix)]) == prefix}
                if choices[0] not in available:
                    raise ValueError(f"Best defence is missing: {exercise['title']} {prefix} {choices[0]}")
                ranks[prefix] = {move: rank for rank, move in enumerate(choices)}
                records.append({
                    'prefix': list(prefix), 'fen': board.fen(), 'selected': choices[0],
                    'candidates': [dict(move=move, scoreCp=info['score'].pov(board.turn).score(),
                                        mate=info['score'].pov(board.turn).mate(),
                                        depth=info.get('depth'), nodes=info.get('nodes'))
                                   for move, info in zip(choices, infos)]})
            # The trainer uses the first matching line to choose its reply.
            # Order the tree at every defender node, not just the model line.
            first_moves = list(dict.fromkeys(line[0] for line in lines))
            def priority(line):
                key = [first_moves.index(line[0])]
                for i in range(1, len(line), 2):
                    key.append(ranks[tuple(line[:i])].get(line[i], 3))
                return key
            lines.sort(key=priority)
            exercise['moves'], exercise['alternativeLines'] = lines[0], lines[1:]
            initial = chess.Board(exercise['fen'])
            attacker = initial.piece_at(initial.parse_san(lines[0][0]).from_square)
            if attacker.piece_type == chess.BISHOP:
                exercise['solution'] = ('Tượng tấn công Hậu và Xe trên cùng đường chéo. '
                    'Sau khi Hậu đi, kiểm tra Xe còn được bảo vệ không. '
                    'Đổi Tượng (3 điểm) lấy Xe (5 điểm) vẫn lời 2 điểm. '
                    'Nếu Hậu bắt Tượng, hãy tìm nước bắt lại Hậu bằng quân bảo vệ.')
            else:
                exercise['solution'] = ('Xe tấn công Hậu và quân phía sau trên cùng hàng hoặc cột. '
                    'Hậu có thể vừa tránh đòn xiên vừa bảo vệ quân phía sau. '
                    'Trước khi bắt, tính cả nước đối thủ bắt lại và nước bắt tiếp của bạn.')
            audit['positions'].append({'fen': exercise['fen'], 'branchDigest': branch_digest(exercise),
                                       'defences': records})
            print(f"Audited {exercise['title']}: {' '.join(exercise['moves'])}", flush=True)
    AUDIT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    return exercises


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', default='/opt/homebrew/bin/stockfish')
    parser.add_argument('--nodes', type=int, default=1000000)
    args = parser.parse_args()
    if args.nodes < 1:
        parser.error('--nodes must be positive')
    data = audit_replies(json.loads(DATA.read_text()), args.engine, args.nodes)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
