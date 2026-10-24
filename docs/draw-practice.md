# Draw practice

The active collection contains only positions from complete, recorded games with
result `1/2-1/2`. Every exercise has a local full-game viewer; standalone study
positions and constructed examples are excluded from the page.

| Category | Distinct source games |
| --- | ---: |
| Perpetual check | 100 |
| Stalemate traps | 100 |
| Exchange into insufficient material | 100 |
| Non-check repetition | 306 |
| Fortress defense | 100 |

Each category is sorted by the original game's total number of plies, shortest
first. There is one exercise per source game within each category and no duplicate
starting positions across the active collection. Repetition exercises do not begin
within the first five moves.

## What is saved

- `src/lib/chess/draw-practice.ts`: category definitions and active collections.
- `src/lib/chess/draw-expansion.ts`: generated FENs, actual preceding moves,
  recorded solution lines and Vietnamese explanations for the four draw themes.
- `src/lib/chess/real-repetition.ts`: the non-check repetition collection.
- `scripts/fixtures/draw-practice/expanded-draw-sources.json`: complete PGNs,
  players, result, event/date, source URLs, starting ply and verification evidence.
  Fortress records also store the selected ending ply and exact WDL results.
- `scripts/fixtures/draw-practice/real-repetition-games.json`: equivalent full-game
  provenance for the non-check repetitions.
- `src/lib/server/draw-game-sources.json`: local full-game move lists fetched on demand by
  the viewer. It does not depend on a live source link.
- `src/lib/chess/draw-game-index.json`: maps each starting position to its full
  game and exact starting ply in that game.

The original study library and its historical audits remain in the repository as
research history. They are not imported into the active collection or game viewer.

## Sources and selection

Sources researched on 2026-10-22:

- [PGN Mentor's Carlsen archive](https://www.pgnmentor.com/players/Carlsen.zip).
- [Lichess public game database](https://database.lichess.org/): January and
  February 2013 standard rated games, released under CC0.
- [Lichess Syzygy WDL files](https://tablebase.lichess.ovh/tables/standard/3-4-5-wdl/)
  for exact fortress verification. The selected table files and hashes are recorded
  in the fixture metadata; table files themselves are not bundled with the app.

`collect-real-draw-games.py` retains existing qualifying real games and mines
additional complete PGNs. It never invents replies or extends the recorded game.

Perpetual checks must check on every solver move and reach threefold repetition
within the exercise's own history. New candidates are screened with Stockfish at
300,000 nodes per position: absolute starting evaluation at most 30 centipawns,
and at most 50 throughout the nonterminal recorded line. These are practical
screens, not proofs that the played replies were forced.

Stalemate exercises start two plies before an actual stalemate: the learner plays
as the side that becomes stalemated. The other player's reply is what happened in
the game, and may be a mistake. We do not call these forced draws. New starts are
screened at 150,000 Stockfish nodes, with absolute evaluation at most 30 centipawns.

Insufficient-material exercises use the actual final move producing a dead
position. Two knights against a bare king are not treated as automatically drawn
merely because mate cannot be forced.

Fortress exercises use short, unaltered segments from drawn games, beginning with
the defender to move. They cover four concrete geometric patterns:

- King holding a rook-pawn promotion corner.
- Wrong bishop and rook pawn.
- Bishop and king using the safe corner against a rook.
- Seventh-rank rook/bishop pawn holding a draw against a distant queen's king.

Every position in each selected fortress segment is an exact Syzygy draw
(`wdl = 0`), not a cursed win or an engine estimate. Material is stable through the
segment, and no earlier game-ending position is allowed. At most 40 games use one
motif. Ending the selected segment does not mean the original game ended there;
the viewer shows the rest of the actual game. A draw tablebase result means that
correct defense exists, not that every legal move draws.

## UI

`DrawTrainer` uses the app's board theme and piece images. Legal moves are checked
with chess.js. Normal exercises follow recorded replies; unsupported legal moves
are described honestly rather than declared incorrect. Fortress segments remain
guided two-sided playback. Promotion choices appear only when needed. The actual
preceding move can be viewed without consuming a solution move.

The book icon opens the original game at the exercise position. Users can click
moves, step with arrow keys, autoplay, flip the board or return to the exercise.
The modal preserves trainer progress and pauses the optional practice timer.
Closing the viewer does not automatically restart the timer. The source board
stays mounted between position changes to avoid image flashing.

Fullscreen practice retains the same trainer state. The viewer uses a native
modal dialog, including inside fullscreen, and returns focus when closed.

## Rebuild and verification

Run from the repository root. Python scripts require python-chess; mining also
requires Stockfish and the relevant local Syzygy WDL files.

```sh
python3 scripts/collect-real-draw-games.py /path/Carlsen.pgn /path/draw-2013-01.pgn /path/draw-2013-02.pgn --tables /path/syzygy --output /tmp/selected-draws.json
# Review the selected source records before replacing the active fixture.
node scripts/build-draw-expansion.cjs
python3 scripts/build-draw-game-viewer.py
npx prettier --write src/lib/chess/draw-expansion.ts src/lib/chess/draw-game-index.json
node --test scripts/test-draw-practice.cjs scripts/test-draw-trainer.cjs scripts/test-draw-game-viewer.cjs
python3 scripts/validate-draw-sources.py --tables /path/syzygy
```

The Node checks validate every playable line, preceding move, outcome, unique game,
shortest-first ordering and full-game viewer reference. The independent Python
validator replays all complete PGNs, checks fortress geometry and re-probes every
fortress position when `--tables` is supplied. Without that option, it checks saved
WDL evidence against the exact positions but does not claim a fresh tablebase probe.

The non-check repetition importer is `scripts/import-real-repetition.cjs`; it
preserves whole-game provenance and excludes early repetitions before sorting.

## Suggested teaching levels

The UI uses the requested labels `A`, `B`, `C`, `C*`, `D`. These are **suggested
teaching levels**, not calibrated student ratings or proofs of forced play. The initial view selects A and the first theme containing A exercises. A
level filter retains shortest-original-game ordering and stays selected when the
theme changes. Empty levels remain visible with an explanation and a return-to-all
button. The level rationale is tucked into the solution to avoid revealing the
idea before the student tries the exercise.

`src/lib/chess/draw-levels.ts` defines the labels and filtering. The FEN-keyed
`draw-level-ratings.ts` is generated by `scripts/rate-draw-levels.py` and attached
to active exercises in `draw-practice.ts`. Rebuild ratings after replacing source
records; missing ratings fail the collection tests.

The classifier replays the actual segment, truncates calculation at the first
repeated position, distinguishes net material sacrifices from equal trades, and
flags unaccepted offers rather than asserting they are sound sacrifices. Moves
following an already-terminal position do not create sacrifice flags. A 60,000-node
Stockfish MultiPV screen of up to three first defensive replies adds teacher-review
flags; it is not exhaustive and does not prove an assigned difficulty. Scores and
candidate replies are retained in `scripts/fixtures/draw-practice/draw-level-audit.json`.

A covers immediate recognition; B covers short combinations or familiar defensive
patterns; C requires a recorded material sacrifice; C* covers additional branches,
longer cycles or positional coordination without a confirmed accepted sacrifice.
D requires a complex sacrifice AND more than three solver moves before the idea
resolves. No current exercise meets that conservative D rule. Identifying hard
quiet moves, sound declined sacrifices and human difficulty still needs teacher
calibration. Actual-game reply mistakes must not be presented as forced defense.

Run `python3 scripts/rate-draw-levels.py`, format its TypeScript output, and run
`node --test scripts/test-draw-levels.cjs` along with the existing draw tests.

| Level | Exercises |
| --- | ---: |
| `A` | 100 |
| `B` | 423 |
| `C` | 25 |
| `C*` | 158 |
| `D` | 0 |

### First review set

Select the theme and level below; the number is the exercise number **inside that
filtered level**, not its number under “Tất cả”. Open “Vì sao ở mức này?” in the
solution to review its rationale. Five examples are supplied per populated level;
D has no examples rather than an inflated classification.

| Level | Theme | Filtered exercise | Game |
| --- | --- | ---: | --- |
| `A` | Không đủ lực chiếu hết | 1 | Carlsen,M — Ding Liren · 2019.08.25 |
| `A` | Không đủ lực chiếu hết | 2 | Vachier Lagrave,M — Carlsen,M · 2019.12.03 |
| `A` | Không đủ lực chiếu hết | 3 | Carlsen,M — Vachier Lagrave,M · 2017.06.12 |
| `A` | Không đủ lực chiếu hết | 4 | Giri,A — Carlsen,M · 2020.07.04 |
| `A` | Không đủ lực chiếu hết | 5 | Giri,A — Carlsen,M · 2020.11.26 |
| `B` | Chiếu vĩnh viễn | 1 | Nakamura,Hi — Carlsen,M · 2022.12.18 |
| `B` | Bẫy hết nước đi | 1 | lancelotukr — Krieg · 2013.01.01 |
| `B` | Pháo đài giữ hòa | 1 | pseudoknight — Romoda · 2013.01.02 |
| `B` | Lặp lại không chiếu | 1 | Carlsen,M — Nakamura,Hi · 2025.02.21 |
| `B` | Chiếu vĩnh viễn | 2 | Vachier Lagrave,M — Carlsen,M · 2023.09.29 |
| `C` | Bẫy hết nước đi | 1 | bimers — OBorchenko · 2013.01.16 |
| `C` | Bẫy hết nước đi | 2 | Maedhros — Messsi · 2013.01.20 |
| `C` | Bẫy hết nước đi | 3 | alexbc — JSpower · 2013.01.20 |
| `C` | Bẫy hết nước đi | 4 | Carlsen,M — Karjakin,Sergey · 2019.08.21 |
| `C` | Bẫy hết nước đi | 5 | Gannon — JJPCaesar · 2013.01.18 |
| `C*` | Chiếu vĩnh viễn | 1 | Carlsen,M — Shevchenko,Kirill · 2022.11.29 |
| `C*` | Bẫy hết nước đi | 1 | PacoMGM — deltaflyer · 2013.01.03 |
| `C*` | Pháo đài giữ hòa | 1 | isildur1 — James_dude · 2013.01.26 |
| `C*` | Lặp lại không chiếu | 1 | Ding Liren — Carlsen,M · 2022.02.21 |
| `C*` | Chiếu vĩnh viễn | 2 | Amonatov,F — Carlsen,M · 2005.12.01 |

## Unlisted practice route

Draw practice lives at `/hoa-co` (Vietnamese: `/vi/hoa-co`),
separate from `/chien-thuat` and omitted from public navigation.
All five themes, levels A/B/C/C*/D, timer, fullscreen and source-game playback
remain on this page.

Like `/chien-thuat`, this page uses static generation and a
`noindex, nofollow` robots meta tag. Anyone with the URL can open it;
there is no password or environment-variable setup.

Full games are stored in `src/lib/server/draw-game-sources.json` and served
on demand by `/api/draw-game-sources`, without authentication. The endpoint
also sends `X-Robots-Tag: noindex, nofollow`.
