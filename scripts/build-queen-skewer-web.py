"""Export the reviewed pilot to the private web lesson, retaining audit separately."""
import importlib.util
import json
from pathlib import Path
import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pilot_builder', ROOT / 'scripts/build-queen-skewer-pilot.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
pilot = json.loads((ROOT / 'scripts/fixtures/skewer/queen-pilot.json').read_text())
hints = {
    'pawn': ['Tìm Hậu và Xe trên cùng đường chéo.', 'Tốt d4 bảo vệ ô nào mà Tượng có thể đến?'],
    'rook': ['Quan sát đường chéo a3–f8.', 'Xe a1 bảo vệ a3; hãy tính cả nước Hậu bắt lại.'],
    'queen': ['Tìm đường chéo đi qua g7 và h8.', 'Ai bảo vệ Tượng nếu Tượng bắt Tốt e5?'],
    'bishop': ['Tìm Hậu và Xe trên cột d.', 'So sánh Rxd6 và Bxd6, rồi tính đủ các nước bắt lại.'],
    'king': ['Quan sát Hậu và Mã trên hàng 2.', 'Nếu Hậu bắt Xe ở a2, Vua có thể bắt lại không?'],
    'contrast': ['Xe ở b1 có bảo vệ a3 không?', 'Sau Ba3, Hậu có thể bắt Tượng không?'],
}
exports = []
alternative_audits = []
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
    engine.configure({'Threads': 1, 'Hash': 128})
    for i, record in enumerate(pilot['exercises']):
        exercise = dict(title=f'Xiên Hậu · {i + 1}', beginner=True, beginnerKind='queen',
                        mode='interactive', outcome='skewer', fen=record['fen'],
                        prompt=record['prompt'], moves=record['line'],
                        alternativeLines=[], hints=hints[record['id']],
                        solution=record['explanation'], source=record.get('source', record['origin']))
        for key in ('gameReference', 'previousMove'):
            if key in record:
                exercise[key] = record[key]
        if record['kind'] == 'negative':
            exercise['decision'] = dict(
                options=[dict(id='works', label='Có lợi'), dict(id='fails', label='Không có lợi')],
                correctOption='fails',
                retryMessage='Kiểm tra quân bảo vệ a3: Hậu có bắt được Tượng không?')
        else:
            exercise['solution'] += f" Trong biến này, bạn lời {record['materialChange']} điểm quân (Tốt 1, Tượng/Mã 3, Xe 5, Hậu 9)."
        # This alternative was explicitly identified as near-best in the review.
        # Follow fresh unrestricted engine replies; do not paste a root PV blindly.
        if record['id'] == 'bishop':
            root = record['rootChecks'][-1]['candidates']
            candidate = next(c for c in root if c['move'] == 'Bxd6')
            assert root[0]['scoreCp'] - candidate['scoreCp'] <= 40
            board = chess.Board(record['fen'])
            side = board.turn
            initial = module.material(board, side)
            board.push_san('Bxd6')
            line, checks = ['Bxd6'], []
            for ply in range(1, 10):
                check = module.snapshot(engine, board, 1000000)
                checks.append(check)
                move = board.parse_san(check['candidates'][0]['move'])
                if ply >= 2 and not board.is_capture(move) and not board.is_check():
                    break
                line.append(board.san(move))
                board.push(move)
                if board.is_game_over():
                    break
            assert module.material(board, side) - initial >= 2
            exercise['alternativeLines'].append(line)
            alternative_audits.append(dict(id=record['id'], fen=record['fen'], line=line, checks=checks))
        exports.append(exercise)
(ROOT / 'src/lib/server/queen-skewer-pilot.json').write_text(json.dumps(exports, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'scripts/fixtures/skewer/queen-pilot-web-alternatives.json').write_text(json.dumps(alternative_audits, ensure_ascii=False, indent=2) + '\n')
print('Exported six pilot exercises; alternative:', alternative_audits[0]['line'])
