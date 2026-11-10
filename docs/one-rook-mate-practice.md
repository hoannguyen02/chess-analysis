# One-rook checkmate practice

`/one-rook-mate` and `/vi/one-rook-mate` are private, noindex routes in the
existing private hub. Exercise and game-source endpoints require the same access
as the two-rook page. No exercise data is embedded in the public static page.

The page reuses `ChessPractice`, `DrawTrainer`, `PracticeBoard`, and
`DrawGameViewer`. It retains the exact Beginner, A, B, C, C\*, D order, visible
starting-side/checkmate goal, timer, fullscreen, hints, branch exploration,
analysis links, and local reference-game playback. Shared bounded alternative
mate verification remains connected, including acceptance of verified unsaved
preparation and honest feedback when verification reaches its search budget.

## Published collection

Current counts: Beginner 20, A 29, B 26, C 20, C* 25, D 17 (137 total).
There are 40 composed king-and-rook exercises and 97 distinct real-game
positions from 36 source archives. A and B each contain 10 sparse composed
exercises, with 19 and 16 real-game positions respectively. C, C*, and D use real games throughout.
D is three positions below the 20-position target: the completed corpus searches
have not yet supplied enough additional examples passing the sacrifice,
shorter-mate, and defensive review. Keep this gap explicit rather than filling
it with weaker examples or counting multiple starts of the same combination.

## Lesson scope

Introductory composed positions contain just two kings and one rook. Beginner
has direct mate in one; A and B teach short king-and-rook coordination. Advanced
positions come from real games: the attacking side has exactly one rook at the
start and finish, and that rook gives the final check. Other pieces may help
close escape squares or be sacrificed to open the mating line. This is not a
claim that every advanced exercise is a bare king-and-rook endgame.

The requested level B assignment for Jumabayev–Morozevich (World Blitz 2019,
`530546d7c40e8f3b`) is retained in `level-overrides.json`, guarded by the exact
FEN and solution `Nf3#`. This discovered rook mate uses supporting pieces to
cover the escape squares. Its position, solution and provenance are unchanged.

Five additional user-requested assignments move these three-solver-move examples
from B to C*, with exact positions and solutions retained in `level-overrides.json`:

- Ivanchuk–Suyarov (`2bc72e40d1373a09`).
- Hafiz–Jobava (`417a207ac041dea8`).
- Aronian–Andreikin (`8d25152e11937c98`).
- Aronian–Vokhidov (`b59a27159dec699a`).
- Chigorin–Bird (`cbcecd1e4d999fdd`).

These explicit assignments are exceptions to the automatic length-based grading
below; they do not change the saved lines or claim a longer mating distance.

Other A master examples are direct one- or two-move mates; B requires short preparation.
C contains a simple sacrifice within three solver moves. Automatically graded C\* contains no material
sacrifice and requires five or six solver moves, two or three deeper than B.
D requires more than three solver moves with a queen sacrifice or multiple
sacrifices. Longer quiet lines are not relabeled D to fill a quota.

## Research and reproducibility

The public source is [PGN Mentor](https://www.pgnmentor.com/files.html), reusing
the project's previously downloaded master-game corpora. The source manifest
retains the original archive URLs and SHA-256 digests. Complete legal games,
headers, stable move-sequence hashes, exact source FENs/plies, and preceding moves
are stored locally. The recorded game and analyzed exercise continuation remain
separate; a resignation game can have a fully analyzed mate in the exercise.

- `build-one-rook-intro.py`: deterministic sparse positions, verified at 150,000
  Stockfish nodes; evidence in `validation.json`.
- `collect-one-rook-games.py --prepare`: extract candidate recorded mates from
  cached corpora. Collection validates root mating distance at 400,000 nodes
  and fresh defensive positions at 200,000 nodes.
- `prepare-one-rook-resignations.py` (and `--extra`): find mating continuations
  in games ending before mate. Pass the generated seed path to the collector.
- `review-one-rook-master-games.py --new-only`: review roots at 1,200,000 nodes
  and defensive positions at 350,000 nodes. Shorter mates are regraded or
  excluded; uncertain lines are excluded. Material recovery is considered
  before treating an offered piece as a sacrifice.
- `build-one-rook-master-games.py`: publish only reviewed, non-excluded records,
  deduplicated by original game, with the composed snapshot and source viewer.

These are finite engine reviews, not exhaustive mathematical proofs of all
positions. All displayed lines are independently replayed through actual
checkmate; removing the final rook must break mate. The shared trainer's
alternative verification separately checks all legal defensive replies within
its bounded search.

## Validation

```sh
python3 scripts/test-one-rook-master-games.py
node --test scripts/test-one-rook-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs
npm run build
```

Checks cover original-game replay, exact exercise and previous-move markers,
source identity, grading evidence, the one-rook mating payoff, both colors in
introductory lessons, shared trainer completion and alternatives, and guarded
APIs. Browser checks cover the new route and original-game dialog.
