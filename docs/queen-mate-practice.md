# Queen checkmate practice

`/queen-mate` and `/vi/queen-mate` are private, noindex pages in the existing
private hub. Protected exercise and game-source endpoints use the same access
checks as the rook-mate pages; the public static page contains no lesson data.

The page reuses `ChessPractice`, `DrawTrainer`, `PracticeBoard`, and
`DrawGameViewer`. It keeps Beginner, A, B, C, C\*, D in that order, the visible
starting side and checkmate goal, fullscreen, timer, hints, branch exploration,
analysis links, and locally saved original-game replay. Shared bounded
alternative-mate verification accepts proven alternative preparation and
immediate mates, distinguishes stalemate from mate, and leaves moves unverified
when its search budget is exhausted.

## Published collection

Beginner 24, A 30, B 30, C 20, C* 20, D 12: **136 exercises**.
There are 44 sparse compositions and 92 distinct real-game positions from
31 public source archives. A and B each contain 10 compositions and 20
real-game examples; C, C*, and D use real games throughout.

Under the 24-position requirement, C and C* are each four positions short;
D is twelve positions short after the recorded-mate
and both resignation-candidate searches. Longer non-sacrificial lines and
uncertain combinations were not used to fill the gap. Durable exclusions and
review evidence are retained with the collection.

## Scope and levels

The 24 Beginner mates in one retain eight clear king-supported positions and
include four each supported by a rook, bishop, knight, or pawn. Every support type
includes both sides to move. The first eight introduce king support, the next
eight direct queen protection, and the next four control of an escape square.
Four additional examples (21–24) reinforce direct queen protection with the defending king away from a corner.
New positions have four pieces, no captures, preparation, or sacrifices.
The 10 A mates in two and 10 B mates in three remain unchanged.

`beginner-reviewed.json` keeps stable review IDs, exact positions and solutions,
support squares and roles, and the 12 replaced positions. Those replacements
reduce repetition; they are not tactical rejections. All 24 Beginner positions
are explicitly identified as compositions in web and PDF copy. Hints and answers
name the relevant supporting piece and explain its role.
Higher-level positions are real-game combinations with exactly one attacking
queen at the start and finish. The queen must deliver the final check and
removing it must break mate. Other pieces can support the mating net or be
sacrificed to open lines; advanced exercises are not all bare king-and-queen
endgames.

Master-game A positions are direct one- or two-move mates; B involves short
preparation. C contains a simple sacrifice within three solver moves. C\* has
no material sacrifice and requires five or six solver moves. D requires more
than three solver moves and multiple sacrifices (or a queen sacrifice followed
by a new queen). Equal trades and immediate material recovery are reviewed
before classifying an offer as a sacrifice. Longer quiet lines do not become D.

## Research and validation

Source games come from the project's cached public
[PGN Mentor archives](https://www.pgnmentor.com/files.html). The local source
manifest preserves archive URLs and SHA-256 hashes. Each record retains its
complete legal game, headers, stable move-sequence hash, exact FEN and source
ply, previous move, mating line, and review evidence. Original moves remain
separate from analyzed continuations after a resignation.

- `build-queen-mate-intro.py` publishes the curated Beginner fixture and preserves
  the approved A/B compositions and their original engine evidence. For every
  Beginner position it enumerates all legal starting moves and all replies,
  records every mate in one, and verifies that removing the queen or the
  non-king supporter breaks each mate. This is exhaustive mate-in-one proof,
  not an engine-score inference. Replaced positions cannot return on rebuild.
- `test-queen-mate.cjs` independently repeats the Beginner audit with chess.js,
  checks both colors for each support type, and tests acceptance of all immediate
  mates through the shared trainer.
- `render-queen-mate-beginner.cjs` exports all 24 positions and their answers
  through the shared worksheet/PDF generator to `output/pdf/`.
- `collect-queen-mate-games.py --prepare` extracts candidate recorded mates.
  Collection checks root mating distance at 400,000 nodes and defensive
  positions after attacking moves at 200,000 nodes.
- `prepare-queen-mate-resignations.py` prepares additional candidates from
  games ending before checkmate; pass its seed path to the collector.
- `review-queen-mate-games.py --new-only` reviews roots at 1,200,000 nodes and
  defensive positions at 350,000 nodes. Shorter mates are regraded or excluded;
  uncertain lines are excluded with durable reasons.
- `build-queen-mate-games.py` publishes only reviewed, non-excluded records,
  deduplicated by original game, alongside the composed snapshot.

Engine checks are finite, not exhaustive proofs of all published positions.
All displayed lines are independently replayed to actual checkmate. Alternative
move verification in the shared trainer separately considers every legal
response within its bounded search.

```sh
python3 scripts/test-queen-mate-games.py
node --test scripts/test-queen-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs
npm run build
```

Tests cover source-game identity and replay, exact position markers, preceding
moves, level evidence, actual queen checkmates, both colors in introductory
lessons, shared trainer completion, alternative moves, and private access.
