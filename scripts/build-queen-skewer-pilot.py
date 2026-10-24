"""Build an audited six-position review sample; never modify the live exercises."""
import argparse
import json
from pathlib import Path

import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scripts/fixtures/skewer/queen-pilot.json'
VALUES = {1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0}


def material(board, side):
    return sum(VALUES[p.piece_type] * (1 if p.color == side else -1)
               for p in board.piece_map().values())


def snapshot(engine, board, nodes):
    engine.configure({'Clear Hash': None})
    infos = engine.analyse(board, chess.engine.Limit(nodes=nodes), multipv=3)
    result = []
    for info in infos:
        position, line = board.copy(), []
        for move in info['pv'][:10]:
            line.append(position.san(move))
            position.push(move)
        result.append(dict(move=line[0], pv=line,
                           scoreCp=info['score'].pov(board.turn).score(),
                           mate=info['score'].pov(board.turn).mate(),
                           depth=info.get('depth'), nodes=info.get('nodes')))
    return dict(fen=board.fen(), turn='white' if board.turn else 'black',
                nodeBudget=nodes, candidates=result)


def build(rank, engine_path):
    # Read canonical provenance, independent of placement in the published levels.
    sources = json.loads((ROOT / 'scripts/fixtures/skewer/audit.json').read_text())['records']
    specs = [
        ('pawn', 'Blackburne, Joseph Henry — MacLeod', 'Be5',
         'Tìm đòn xiên và giải thích quân nào bảo vệ Tượng.',
         'Tốt bảo vệ ô tấn công', 'Tốt d4 bảo vệ e5; vị trí của Tốt quyết định Tượng có thể tiến lên an toàn hay không.'),
        ('rook', 'Anderssen, Adolf — Neumann', 'Ba3',
         'Tìm đòn xiên. Hậu tránh đi nhưng vẫn bảo vệ Xe thì sao?',
         'Xe hỗ trợ từ xa', 'Xe a1 bảo vệ a3. Sau khi đổi Tượng lấy Xe, cần tính đủ nước Hậu bắt lại.'),
        ('queen', 'Smyslov, Vassily — Euwe', 'Bxe5',
         'Có thể bắt Tốt và đồng thời tạo đòn xiên không?',
         'Hậu bảo vệ Tượng', 'Hậu c5 bảo vệ e5. Nước bắt Tốt cũng đưa Tượng lên đường chéo g7–h8.'),
        ('bishop', 'Bologan,V — Vovk', 'Rxd6',
         'Tìm đòn xiên bằng Xe. So sánh với nước bắt bằng Tượng.',
         'Tượng và Hậu phối hợp với Xe', 'Tượng c5 và Hậu d5 cùng bảo vệ d6. Bxd6 cũng là ứng viên mạnh; không xem đó là nước sai chỉ vì không phải đòn xiên.'),
    ]
    records = []
    for identifier, name, move, prompt, objective, explanation in specs:
        source = next(e for e in sources if (e['headers']['White'] + ' — ' + e['headers']['Black']).startswith(name))
        records.append(dict(id=identifier, kind='positive', origin='recorded-game',
                            sourceTitle=source['headers']['White'] + ' — ' + source['headers']['Black'], source=source['source'],
                            gameReference=dict(id=source['gameId'], kind='game', ply=source['ply'], branch=0, collection='skewer'), previousMove=source['previousMove'],
                            fen=source['fen'], intendedMove=move, prompt=prompt,
                            objective=objective, explanation=explanation))
    rank_board = chess.Board(rank['fen']).mirror()
    original_move = chess.Move.from_uci(rank['move'])
    mirrored_move = chess.Move(chess.square_mirror(original_move.from_square),
                               chess.square_mirror(original_move.to_square))
    records.append(dict(id='king', kind='positive', origin='original-composition',
                        fen=rank_board.fen(), intendedMove=rank_board.san(mirrored_move),
                        prompt='Tìm đòn xiên trên cùng hàng. Vua có thể bảo vệ Xe không?',
                        objective='Vua hỗ trợ trong thế cờ ít quân',
                        explanation='Vua có thể bảo vệ Xe nếu nước bắt lại không đưa Vua vào ô bị tấn công. Hãy kiểm tra nước Hậu bắt Xe trước khi quyết định.'))
    comparison = chess.Board(records[1]['fen'])
    comparison.remove_piece_at(chess.A1)
    comparison.set_piece_at(chess.B1, chess.Piece(chess.ROOK, chess.WHITE))
    records.append(dict(id='contrast', kind='negative', origin='modified-comparison',
                        derivedFrom='rook', change='White rook moved from a1 to b1; not a recorded game position.',
                        fen=comparison.fen(), intendedMove='Ba3',
                        prompt='Nếu Xe ở b1 thay vì a1, Ba3 còn là đòn xiên có lợi không? Vì sao?',
                        objective='Nhận ra đòn xiên không hiệu quả',
                        explanation='Xe b1 không bảo vệ a3. Sau Ba3, Hậu có thể bắt Tượng bằng Qxa3. Hình dạng đòn xiên vẫn còn, nhưng quân hỗ trợ đã thay đổi.'))
    with chess.engine.SimpleEngine.popen_uci(engine_path) as engine:
        engine.configure({'Threads': 1, 'Hash': 128})
        for record in records:
            board = chess.Board(record['fen'])
            assert board.is_valid() and not board.is_check()
            side, balance = board.turn, material(board, board.turn)
            record['rootChecks'] = [snapshot(engine, board, n) for n in (1000000, 3000000)]
            root = record['rootChecks'][-1]['candidates']
            if record['kind'] == 'positive':
                def acceptable(candidates):
                    selected = next((c for c in candidates if c['move'] == record['intendedMove']), None)
                    if not selected:
                        return False
                    if selected['mate'] is not None:
                        return selected['mate'] > 0 and candidates[0]['move'] == selected['move']
                    return (candidates[0]['scoreCp'] is not None and selected['scoreCp'] >= 100
                            and candidates[0]['scoreCp'] - selected['scoreCp'] <= 40)
                if not acceptable(root):
                    record['rootChecks'].append(snapshot(engine, board, 12000000))
                    record['reviewNote'] = 'Deepened to 12 million nodes because the 3-million-node root did not pass the near-best-move gate.'
                    root = record['rootChecks'][-1]['candidates']
                assert acceptable(root), (record['id'], root)
            first = board.parse_san(record['intendedMove'])
            attacker = board.piece_at(first.from_square).piece_type
            board.push(first)
            assert not board.is_check(), record['id']
            record['attacker'] = chess.piece_name(attacker)
            record['landing'] = chess.square_name(first.to_square)
            record['supporters'] = [dict(square=chess.square_name(s), piece=chess.piece_name(board.piece_at(s).piece_type))
                                    for s in board.attackers(side, first.to_square)]
            record['line'] = [record['intendedMove']]
            record['continuationChecks'] = []
            # Follow unrestricted strongest moves through the exchange, including
            # forced checks. Stop before a quiet continuation after the exchange.
            for ply in range(1, 10):
                audit = snapshot(engine, board, 1000000)
                record['continuationChecks'].append(audit)
                san = audit['candidates'][0]['move']
                move = board.parse_san(san)
                if ply >= 3 and not board.is_capture(move) and not board.is_check():
                    break
                record['line'].append(san)
                board.push(move)
                if board.is_game_over():
                    break
            record['finalFen'] = board.fen()
            record['materialChange'] = material(board, side) - balance
            record['finalAssessment'] = snapshot(engine, board, 3000000)
            if record['kind'] == 'negative':
                assert record['line'][1] == 'Qxa3'
                assert record['materialChange'] < 0
            print(record['id'], record['line'], record['materialChange'], flush=True)
        return dict(status='review-sample-not-live', engine=engine.id, exercises=records)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--rank-seed', type=Path, required=True)
    parser.add_argument('--engine', default='/opt/homebrew/bin/stockfish')
    args = parser.parse_args()
    OUT.write_text(json.dumps(build(json.loads(args.rank_seed.read_text()), args.engine),
                              ensure_ascii=False, indent=2) + '\n')
