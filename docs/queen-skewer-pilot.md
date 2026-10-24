# Queen-skewer pilot: six positions for review

**Status: these six positions remain in the website as lessons 11–16, following 10 sparse compositions. Numbering 1–6 below refers to this review sample. The former 30-position dataset is retained offline.**

This sample tests teaching variety and chess correctness. It is not the final beginner sequence: four game positions are transfer exercises with substantial board complexity. The new introductory set uses independently checked original compositions rather than edits to these game positions.

![Six starting positions](assets/queen-skewer-pilot/worksheet.png)

| # | Decision | Attacker / line | Support | Provenance |
|---|---|---|---|---|
| 1 | Nhận diện trong ván thực tế | bishop / diagonal | pawn d4 | recorded-game |
| 2 | Tính hết trao đổi | bishop / diagonal | rook a1 | recorded-game |
| 3 | Kết hợp nước bắt với đòn xiên | bishop / diagonal | queen c5 | recorded-game |
| 4 | So sánh ứng viên | rook / file | bishop c5, queen d5 | recorded-game |
| 5 | Kiểm tra nước bắt lại hợp lệ | rook / rank | king a1 | original-composition |
| 6 | Bài đối chiếu — không phải bài tìm đòn thắng | bishop / diagonal | none at a3 | modified-comparison |

The final row deliberately changes only the rook square from row 2. This is a controlled comparison, not a duplicate used to inflate exercise counts. The king example changes the rear target to a knight; five different supporting piece types appear across the positive examples.

## How to try the sample

Read the question before revealing the answer. Name a candidate move, predict a strong reply, and count the entire exchange. For position 6, decide whether the proposed move works. Understanding the defender and explaining the result matter more than solving quickly.

No new trainer or game-replay implementation is introduced. Positive positions use the shared ChessPractice/DrawTrainer/PracticeBoard components, with recorded games opened through DrawGameViewer. The negative example uses explicit decision buttons and a separate review line; playing the failed skewer cannot complete it.

## 1. Nhận diện trong ván thực tế

Tìm đòn xiên và giải thích quân nào bảo vệ Tượng.

![Position 1](assets/queen-skewer-pilot/01.png)

**Side to move:** White. **Objective:** Tốt có thể bảo vệ quân tấn công.

**Hints, in order:**

1. Tìm Hậu và Xe trên cùng đường chéo.
2. Ô nào vừa tấn công Hậu, vừa được Tốt bảo vệ?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Be5 Qh6 Bxh8`.

Tốt d4 bảo vệ e5; vị trí của Tốt quyết định Tượng có thể tiến lên an toàn hay không.

**Material change for the learner:** +5 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Chỉ nhìn Tượng và Hậu mà bỏ qua vai trò của Tốt d4.

**Evidence of understanding:** Nêu được vai trò của Tốt d4 và tìm được Be5.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Be5 | +6.94 |
| Qe2 | +5.96 |
| Re1 | +5.73 |

Root search budget: 3,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

**Recorded source:** Blackburne, Joseph Henry — MacLeod, Nicholas. [PGN Mentor archive](https://www.pgnmentor.com/players/Blackburne.zip). Exact original FEN, preceding move and game reference are retained in the pilot data. The solution is engine analysis, not a claim that these moves occurred in the game.

</details>

## 2. Tính hết trao đổi

Tìm đòn xiên. Hậu tránh đi nhưng vẫn bảo vệ Xe thì sao?

![Position 2](assets/queen-skewer-pilot/02.png)

**Side to move:** White. **Objective:** Một quân hỗ trợ từ xa có thể quyết định đòn xiên.

**Hints, in order:**

1. Quan sát đường chéo a3–f8.
2. Xe a1 bảo vệ ô nào trên đường chéo đó?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Ba3 Qe8 Bxf8 Qxf8`.

Xe a1 bảo vệ a3. Sau khi đổi Tượng lấy Xe, cần tính đủ nước Hậu bắt lại.

**Material change for the learner:** +2 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Thấy Hậu bảo vệ f8 rồi cho rằng không thể bắt Xe.

**Evidence of understanding:** Tính Ba3, nước Hậu đáp, Bxf8 và Qxf8; lời 2 điểm.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Ba3 | +4.13 |
| b6 | +2.84 |
| Ra2 | +1.25 |

Root search budget: 3,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

**Recorded source:** Anderssen, Adolf — Neumann, Gustav Richard. [PGN Mentor archive](https://www.pgnmentor.com/players/Anderssen.zip). Exact original FEN, preceding move and game reference are retained in the pilot data. The solution is engine analysis, not a claim that these moves occurred in the game.

</details>

## 3. Kết hợp nước bắt với đòn xiên

Có thể bắt Tốt và đồng thời tạo đòn xiên không?

![Position 3](assets/queen-skewer-pilot/03.png)

**Side to move:** White. **Objective:** Nước bắt có thể đưa quân vào vị trí tấn công hai mục tiêu thẳng hàng.

**Hints, in order:**

1. Tìm đường chéo đi qua g7 và h8.
2. Ai bảo vệ Tượng nếu Tượng bắt Tốt e5?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Bxe5 Qd7 Bxh8`.

Hậu c5 bảo vệ e5. Nước bắt Tốt cũng đưa Tượng lên đường chéo g7–h8.

**Material change for the learner:** +6 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Không xét nước bắt Tốt vì chỉ tìm nước đi vào ô trống.

**Evidence of understanding:** Nhận ra Bxe5 vừa bắt Tốt vừa tạo đòn xiên; Hậu c5 bảo vệ e5.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Bxe5 | +4.06 |
| Bg2 | -0.72 |
| Qxc6+ | -1.22 |

Root search budget: 3,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

**Recorded source:** Smyslov, Vassily — Euwe, Max. [PGN Mentor archive](https://www.pgnmentor.com/players/Euwe.zip). Exact original FEN, preceding move and game reference are retained in the pilot data. The solution is engine analysis, not a claim that these moves occurred in the game.

</details>

## 4. So sánh ứng viên

Tìm đòn xiên bằng Xe. So sánh với nước bắt bằng Tượng.

![Position 4](assets/queen-skewer-pilot/04.png)

**Side to move:** White. **Objective:** Chọn nước mạnh mà không phủ nhận một cách giải khác cũng tốt.

**Hints, in order:**

1. Tìm Hậu và Xe trên cột d.
2. Sau Rxd6, những quân nào bảo vệ d6?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Rxd6 Qe8 Rxd8 Nxd8`.

Tượng c5 và Hậu d5 cùng bảo vệ d6. Bxd6 cũng là ứng viên mạnh; không xem đó là nước sai chỉ vì không phải đòn xiên.

**Material change for the learner:** +3 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Đánh dấu Bxd6 là sai chỉ vì không phải nước đã định trước.

**Evidence of understanding:** Tính đủ Rxd6, Qe8, Rxd8, Nxd8; thảo luận cả Bxd6.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Bxd6 | +2.78 |
| Rxd6 | +2.70 |
| Rf6 | +0.00 |

Root search budget: 3,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

**Recorded source:** Bologan,V — Vovk,A. [PGN Mentor archive](https://www.pgnmentor.com/players/Bologan.zip). Exact original FEN, preceding move and game reference are retained in the pilot data. The solution is engine analysis, not a claim that these moves occurred in the game.

</details>

## 5. Kiểm tra nước bắt lại hợp lệ

Tìm đòn xiên trên cùng hàng. Vua có thể bảo vệ Xe không?

![Position 5](assets/queen-skewer-pilot/05.png)

**Side to move:** Black. **Objective:** Vua cũng hỗ trợ được đòn xiên khi ô bắt lại an toàn.

**Hints, in order:**

1. Quan sát Hậu và Mã trên hàng 2.
2. Nếu Hậu bắt Xe ở a2, Vua có thể bắt lại không?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Ra2 Qxa2+ Kxa2`.

Vua có thể bảo vệ Xe nếu nước bắt lại không đưa Vua vào ô bị tấn công. Hãy kiểm tra nước Hậu bắt Xe trước khi quyết định.

**Material change for the learner:** +4 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Cho rằng Vua không thể làm quân hỗ trợ, hoặc bỏ qua ô bị đối phương kiểm soát.

**Evidence of understanding:** Tìm Ra2 và xác nhận Qxa2+ Kxa2 hợp lệ; không có Xe phía sau chiếu dọc hàng 2.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Ra2 | mate in 21 |
| Qc3 | mate in 28 |
| Rd8+ | mate in 28 |

Root search budget: 12,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

Deepened to 12 million nodes because the 3-million-node root did not pass the near-best-move gate.

The deeper search changes the preferred root and finds a mating continuation. The sample teaches the short material-winning exchange, not a long mate calculation.

**Provenance:** original composition; no invented players or game reference.

</details>

## 6. Bài đối chiếu — không phải bài tìm đòn thắng

Nếu Xe ở b1 thay vì a1, Ba3 còn là đòn xiên có lợi không? Vì sao?

![Position 6](assets/queen-skewer-pilot/06.png)

**Side to move:** White. **Objective:** Hình dạng tương tự không bảo đảm đòn xiên có lợi.

**Hints, in order:**

1. Xe ở b1 có bảo vệ a3 không?
2. Sau Ba3, Hậu có thể bắt Tượng không?

<details>
<summary>Solution and review notes</summary>

**Audited line:** `Ba3 Qxa3 Ne5+ Kc8`.

Xe b1 không bảo vệ a3. Sau Ba3, Hậu có thể bắt Tượng bằng Qxa3. Hình dạng đòn xiên vẫn còn, nhưng quân hỗ trợ đã thay đổi.

**Material change for the learner:** -3 points (pawn 1, minor 3, rook 5, queen 9). This counts the displayed exchange, not a promise about the remaining endgame.

**Likely misconception:** Lặp lại Ba3 từ bài trước mà không kiểm tra quân bảo vệ.

**Evidence of understanding:** Từ chối Ba3, chỉ ra Qxa3 và giải thích Xe b1 không bảo vệ a3.

**Final unrestricted root check:**

| Candidate | Score for side to move |
|---|---|
| Bd2 | +0.78 |
| c4 | +0.41 |
| Rb2 | +0.38 |

Root search budget: 3,000,000 nodes. Scores are bounded engine estimates, not human difficulty ratings.

**Provenance:** adapted from position 2 by moving Ra1 to b1. This is a legal comparison composition, not a recorded game position. It has no original-game reference.

</details>

## Acceptance gates and limitations

- Positive intended moves must be within 0.40 pawns of the strongest unrestricted root candidate and at least +1.00, or the strongest positive mating candidate. These are selection thresholds, not a definition of chess truth.
- Roots are checked at 1 million and 3 million nodes. The king example required 12 million nodes when the smaller root search did not pass. Each displayed reply and continuation uses the first unrestricted MultiPV candidate at 1 million nodes.
- Replay and material accounting are independently tested with chess.js. Legal recaptures are checked in addition to geometric protection. These checks do not exhaustively establish every defensive variation.
- Four complex game positions test transfer. This six-position sample does not yet cover all defensive resources, an equal White/Black split, every rear-target type, or assessment reliability with real learners.
- Before expanding this set: verify additional near-best defensive branches and pilot difficulty with users. Bxd6 in position 4 is accepted in the website; its defensive reply is separately audited. Other unrecorded alternatives receive neutral feedback.

## Reproduce

```sh
python3 scripts/build-queen-skewer-pilot.py --rank-seed scripts/fixtures/skewer/queen-pilot-rank-seed.json
python3 scripts/build-queen-skewer-web.py
node --test scripts/test-queen-skewer-pilot.cjs scripts/test-queen-skewer-web.cjs
python3 scripts/render-queen-skewer-pilot.py
```

The renderer uses python-chess, CairoSVG, Pillow and the macOS Arial font. The auditor uses Stockfish at `/opt/homebrew/bin/stockfish` by default; override with `--engine`. Full engine evidence is in `scripts/fixtures/skewer/queen-pilot.json`.
