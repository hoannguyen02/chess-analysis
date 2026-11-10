# Back-rank mate practice

`/back-rank-mate` and `/vi/back-rank-mate` are private, noindex routes in the
"Chiếu hết" library group. Protected exercise and source-game endpoints use the
existing practice access checks. The public static page contains no lesson data.

The page reuses `ChessPractice`, `DrawTrainer`, `PracticeBoard`, and
`DrawGameViewer`: Beginner, A, B, C, C\*, D navigation, stable side-to-move and
checkmate goal, timer, fullscreen, hints, exploration, analysis links, and local
full-game replay. Shared alternative-mate verification remains connected.

## Published collection

Current counts: Beginner 20, A 20, B 20, C 20, C* 20, D 14 — 114 exercises.
The 94 real-game exercises come from 51 source archives; all A–D positions have
local full-game replay. Beginner uses 20 original compositions.

D remains six below the 20-position target. Keep this gap explicit: do not add
uncertain combinations, lengthen simple lines, or count multiple starts from
one game to fill it.

## Motif and selection

A published solution must finish with actual checkmate on the defending king's
home rank, checked horizontally by a rook or queen. At least two friendly
pieces block adjacent forward escape squares, including at least one pawn.
Removing at least one blocker must make that king escape legal. This conservative
counterfactual check excludes incidental mates on the first/eighth rank and
positions where all forward escapes are already controlled independently.

Beginner has 20 sparse composed mates in one: five each for White/rook,
White/queen, Black/rook, and Black/queen. A–D use distinct real games. A is a
direct one/two-move finish, B short preparation, C a simple sacrifice within
three solver moves, C\* five/six solver moves without a sacrifice, and D more
than three solver moves with multiple sacrifices or a queen sacrifice.
Material recovery is checked before calling an exchange a sacrifice. Longer
quiet lines do not become D merely to fill a quota.

## Provenance and verification

Real games come from the project's cached public
[PGN Mentor archives](https://www.pgnmentor.com/files.html). Archive URLs and
SHA-256 digests are retained. Each published record stores its complete legal
original game, headers, stable move-sequence hash, exact exercise FEN/source ply,
preceding move, analyzed solution, motif evidence, and grading review. Original
game replay remains separate from analyzed continuations after resignation.

- `build-back-rank-mate-intro.py`: deterministic introductions; 50,000-node
  engine verification and final motif checks.
- `collect-back-rank-mate-games.py --prepare`: candidate recorded mating games.
- `prepare-back-rank-mate-candidates.py`: reuse previous researched resignation
  candidates, independently checking their back-rank motif.
- `prepare-back-rank-mate-resignations.py`: additional candidates from the cached
  master-game corpora. The extra pass targets games with final rook/queen
  moves onto the back rank. Pass either generated seed path to the collector.
- Collection checks roots at 400,000 nodes and fresh defensive positions after
  attacking moves at 200,000 nodes.
- `review-back-rank-mate-games.py --new-only`: deeper root searches at 1,200,000
  nodes and defensive searches at 350,000 nodes. Shorter mates are regraded or
  excluded; uncertain candidates are durably excluded.
- `build-back-rank-mate-games.py`: publish only reviewed, non-excluded records,
  deduplicated by original game, plus the composed snapshot.

Finite engine review is not an exhaustive proof of every position. Displayed
lines are independently replayed to checkmate and checked against the motif.
The shared alternative verifier separately explores all legal defensive replies
within its search limits; reaching a limit means unverified, not incorrect.

```sh
python3 scripts/test-back-rank-mate-games.py
node --test scripts/test-back-rank-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs
npm run build
```

Tests cover full legal source games and exact markers, previous moves, grading,
back-rank payoff, composed color/piece coverage, trainer completion,
alternative mates, and guarded API access.
