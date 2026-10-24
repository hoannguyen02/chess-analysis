"""Render a static review worksheet, not a parallel chess trainer."""
import io
import json
from pathlib import Path

import cairosvg
import chess
import chess.svg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs/assets/queen-skewer-pilot'
ASSETS.mkdir(parents=True, exist_ok=True)
pilot = json.loads((ROOT / 'scripts/fixtures/skewer/queen-pilot.json').read_text())
font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
font = ImageFont.truetype(font_path, 24)
small = ImageFont.truetype(font_path, 19)
heading = ImageFont.truetype(font_path, 32)
sheet = Image.new('RGB', (1560, 1260), '#f6f7f1')
draw = ImageDraw.Draw(sheet)
draw.text((30, 20), 'Sáu thế cờ thử nghiệm · Đòn xiên Hậu', font=heading, fill='#243e35')
draw.text((30, 65), 'Tìm nước đi, kiểm tra nước đáp, rồi tính đủ các nước bắt lại.', font=font, fill='#344b43')
notes = {
'pawn': ('Nhận diện trong ván thực tế', 'Tốt có thể bảo vệ quân tấn công.',
         ['Tìm Hậu và Xe trên cùng đường chéo.', 'Ô nào vừa tấn công Hậu, vừa được Tốt bảo vệ?'],
         'Chỉ nhìn Tượng và Hậu mà bỏ qua vai trò của Tốt d4.', 'Nêu được vai trò của Tốt d4 và tìm được Be5.'),
'rook': ('Tính hết trao đổi', 'Một quân hỗ trợ từ xa có thể quyết định đòn xiên.',
         ['Quan sát đường chéo a3–f8.', 'Xe a1 bảo vệ ô nào trên đường chéo đó?'],
         'Thấy Hậu bảo vệ f8 rồi cho rằng không thể bắt Xe.', 'Tính Ba3, nước Hậu đáp, Bxf8 và Qxf8; lời 2 điểm.'),
'queen': ('Kết hợp nước bắt với đòn xiên', 'Nước bắt có thể đưa quân vào vị trí tấn công hai mục tiêu thẳng hàng.',
          ['Tìm đường chéo đi qua g7 và h8.', 'Ai bảo vệ Tượng nếu Tượng bắt Tốt e5?'],
          'Không xét nước bắt Tốt vì chỉ tìm nước đi vào ô trống.', 'Nhận ra Bxe5 vừa bắt Tốt vừa tạo đòn xiên; Hậu c5 bảo vệ e5.'),
'bishop': ('So sánh ứng viên', 'Chọn nước mạnh mà không phủ nhận một cách giải khác cũng tốt.',
           ['Tìm Hậu và Xe trên cột d.', 'Sau Rxd6, những quân nào bảo vệ d6?'],
           'Đánh dấu Bxd6 là sai chỉ vì không phải nước đã định trước.', 'Tính đủ Rxd6, Qe8, Rxd8, Nxd8; thảo luận cả Bxd6.'),
'king': ('Kiểm tra nước bắt lại hợp lệ', 'Vua cũng hỗ trợ được đòn xiên khi ô bắt lại an toàn.',
         ['Quan sát Hậu và Mã trên hàng 2.', 'Nếu Hậu bắt Xe ở a2, Vua có thể bắt lại không?'],
         'Cho rằng Vua không thể làm quân hỗ trợ, hoặc bỏ qua ô bị đối phương kiểm soát.', 'Tìm Ra2 và xác nhận Qxa2+ Kxa2 hợp lệ; không có Xe phía sau chiếu dọc hàng 2.'),
'contrast': ('Bài đối chiếu — không phải bài tìm đòn thắng', 'Hình dạng tương tự không bảo đảm đòn xiên có lợi.',
             ['Xe ở b1 có bảo vệ a3 không?', 'Sau Ba3, Hậu có thể bắt Tượng không?'],
             'Lặp lại Ba3 từ bài trước mà không kiểm tra quân bảo vệ.', 'Từ chối Ba3, chỉ ra Qxa3 và giải thích Xe b1 không bảo vệ a3.'),
}
lines = ['# Queen-skewer pilot: six positions for review', '',
         '**Status: these six positions remain in the website as lessons 11–16, following 10 sparse compositions. Numbering 1–6 below refers to this review sample. The former 30-position dataset is retained offline.**', '',
         'This sample tests teaching variety and chess correctness. It is not the final beginner sequence: four game positions are transfer exercises with substantial board complexity. The new introductory set uses independently checked original compositions rather than edits to these game positions.', '',
         '![Six starting positions](assets/queen-skewer-pilot/worksheet.png)', '',
         '| # | Decision | Attacker / line | Support | Provenance |',
         '|---|---|---|---|---|']
for i, e in enumerate(pilot['exercises']):
    axis = 'diagonal' if e['attacker'] == 'bishop' else 'file' if e['id'] == 'bishop' else 'rank'
    support = ', '.join(s['piece'] + ' ' + s['square'] for s in e['supporters']) or 'none at a3'
    lines.append(f"| {i+1} | {notes[e['id']][0]} | {e['attacker']} / {axis} | {support} | {e['origin']} |")
lines += ['', 'The final row deliberately changes only the rook square from row 2. This is a controlled comparison, not a duplicate used to inflate exercise counts. The king example changes the rear target to a knight; five different supporting piece types appear across the positive examples.', '',
          '## How to try the sample', '',
          'Read the question before revealing the answer. Name a candidate move, predict a strong reply, and count the entire exchange. For position 6, decide whether the proposed move works. Understanding the defender and explaining the result matter more than solving quickly.', '',
          'No new trainer or game-replay implementation is introduced. Positive positions use the shared ChessPractice/DrawTrainer/PracticeBoard components, with recorded games opened through DrawGameViewer. The negative example uses explicit decision buttons and a separate review line; playing the failed skewer cannot complete it.', '']
for i, e in enumerate(pilot['exercises']):
    b = chess.Board(e['fen'])
    svg = chess.svg.board(b, orientation=b.turn, size=500,
                         colors={'square light': '#f3dfba', 'square dark': '#9f7349'})
    png = cairosvg.svg2png(bytestring=svg.encode())
    (ASSETS / f'{i+1:02d}.png').write_bytes(png)
    x, y = 20 + (i % 3) * 520, 120 + (i // 3) * 560
    draw.text((x+6, y), f"{i+1}. {'Trắng' if b.turn else 'Đen'} đi", font=font, fill='#243e35')
    sheet.paste(Image.open(io.BytesIO(png)).convert('RGB'), (x, y+35))
    if e['kind'] == 'negative':
        draw.text((x+6, y+535), 'Ba3 có còn hiệu quả không?', font=small, fill='#243e35')
    objective, concept, hints, mistake, assessment = notes[e['id']]
    lines += [f"## {i+1}. {objective}", '', e['prompt'], '',
              f"![Position {i+1}](assets/queen-skewer-pilot/{i+1:02d}.png)", '',
              f"**Side to move:** {'White' if b.turn else 'Black'}. **Objective:** {concept}", '',
              '**Hints, in order:**', '', *[f'{j+1}. {hint}' for j, hint in enumerate(hints)], '',
              '<details>', '<summary>Solution and review notes</summary>', '',
              f"**Audited line:** `{' '.join(e['line'])}`.", '', e['explanation'], '',
              f"**Material change for the learner:** {e['materialChange']:+d} points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.", '',
              f'**Likely misconception:** {mistake}', '', f'**Evidence of understanding:** {assessment}', '']
    roots = e['rootChecks'][-1]
    lines += ['**Final unrestricted root check:**', '', '| Candidate | Score for side to move |', '|---|---|']
    for candidate in roots['candidates']:
        score = f"mate in {candidate['mate']}" if candidate['mate'] is not None else f"{candidate['scoreCp']/100:+.2f}"
        lines.append(f"| {candidate['move']} | {score} |")
    lines += ['', f"Root search budget: {roots['nodeBudget']:,} nodes. Scores are bounded engine estimates, not human difficulty ratings.", '']
    if 'reviewNote' in e:
        lines += [e['reviewNote'], '', 'The deeper search changes the preferred root and finds a mating continuation. The sample teaches the short material-winning exchange, not a long mate calculation.', '']
    if e['origin'] == 'recorded-game':
        lines += [f"**Recorded source:** {e['sourceTitle']}. [PGN Mentor archive]({e['source']}). Exact original FEN, preceding move and game reference are retained in the pilot data. The solution is engine analysis, not a claim that these moves occurred in the game.", '']
    elif e['origin'] == 'modified-comparison':
        lines += ['**Provenance:** adapted from position 2 by moving Ra1 to b1. This is a legal comparison composition, not a recorded game position. It has no original-game reference.', '']
    else:
        lines += ['**Provenance:** original composition; no invented players or game reference.', '']
    lines += ['</details>', '']
lines += ['## Acceptance gates and limitations', '',
          '- Positive intended moves must be within 0.40 pawns of the strongest unrestricted root candidate and at least +1.00, or the strongest positive mating candidate. These are selection thresholds, not a definition of chess truth.',
          '- Roots are checked at 1 million and 3 million nodes. The king example required 12 million nodes when the smaller root search did not pass. Each displayed reply and continuation uses the first unrestricted MultiPV candidate at 1 million nodes.',
          '- Replay and material accounting are independently tested with chess.js. Legal recaptures are checked in addition to geometric protection. These checks do not exhaustively establish every defensive variation.',
          '- Four complex game positions test transfer. This six-position sample does not yet cover all defensive resources, an equal White/Black split, every rear-target type, or assessment reliability with real learners.',
          '- Before expanding this set: verify additional near-best defensive branches and pilot difficulty with users. Bxd6 in position 4 is accepted in the website; its defensive reply is separately audited. Other unrecorded alternatives receive neutral feedback.', '',
          '## Reproduce', '', '```sh',
          'python3 scripts/build-queen-skewer-pilot.py --rank-seed scripts/fixtures/skewer/queen-pilot-rank-seed.json',
          'python3 scripts/build-queen-skewer-web.py',
          'node --test scripts/test-queen-skewer-pilot.cjs scripts/test-queen-skewer-web.cjs',
          'python3 scripts/render-queen-skewer-pilot.py', '```', '',
          'The renderer uses python-chess, CairoSVG, Pillow and the macOS Arial font. The auditor uses Stockfish at `/opt/homebrew/bin/stockfish` by default; override with `--engine`. Full engine evidence is in `scripts/fixtures/skewer/queen-pilot.json`.', '']
sheet.save(ASSETS / 'worksheet.png')
(ROOT / 'docs/queen-skewer-pilot.md').write_text('\n'.join(lines))
print(ROOT / 'docs/queen-skewer-pilot.md')
