# Fork practice

`/fork` (and `/vi/fork`) is a private, noindex page. It reuses `ChessPractice`,
`DrawTrainer`, `PracticeBoard`, the teaching timer, full-screen view, branch
exploration, analysis link and `DrawGameViewer`. Protected exercise/source APIs
keep original game data out of the static page. The private hub links to it.

## Collection

122 positions from 122 different recorded games: A 22, B 20, C 28, C* 32, D 20.
These are real-game positions, not beginner compositions. Publication and both
validation suites now require at least 20 distinct real games in **each** level.
A game contributes only one exercise; duplicate starting FENs are excluded.

Full games come from the previously downloaded public
[PGN Mentor archives](https://www.pgnmentor.com/files.html). Each published
record retains the source URL, headers, complete game, preceding move, FEN and
original-game ply. The relevant archive checksums are in
`scripts/fixtures/fork/corpus-sources.json`. A solution can differ from actual
play; the full-game dialog always shows the original recorded continuation.

## Selection and verification

`collect-forks.py` identifies an actual double attack by a single moving piece.
At least two enemy pieces (including the king) must be attacked simultaneously.
The opponent responds to the check or moves one of those targets; the same
attacker then captures a remaining target on its next turn. The captured target
must not already have been attacked by that piece before the fork. The line
must gain material from both its start and the position before the fork,
including two further principal-variation plies for exchanges.

Stockfish searches use 12,000 nodes for candidate screening, 300,000 nodes with
three principal variations, and a fresh 100,000-node defence search after each
solver move. The selected root scores at least +150 cp and within 40 cp of the
best searched root; defensive probes must retain at least +100 cp.

`build-forks.py` then enumerates **every legal reply immediately after the
fork**. Each response must allow a capture by the forking piece that gains at
least a pawn, even after any legal immediate countercapture. Stalemates and
immediate mating counterattacks are rejected. The primary capture must meet
this check too. These reply/capture branches are stored for the shared trainer.
Merely attacking two pieces does not complete the exercise: the capture must
be played.

This exhaustive local check covers the fork's immediate payoff, not every
possible earlier defence or indefinite play. Engine searches are finite
validation, not a proof of a forced game win or a unique solution.

Difficulty follows the existing teaching scale: A is a direct fork/capture,
B includes simple preparation, C one short sacrifice, C* four or five solver
moves without sacrifice, D more than three solver moves with multiple offers
or a rook/queen offer. Ordinary immediately recovered equal exchanges do not
count as sacrifices. Grades are suggestions and remain open to review.

## Reproduce

- Prepare complete PGN archives with `scripts/prepare-pin-corpus.py`.
- `python3 scripts/collect-forks.py --phase tactics --extra-corpus CORPUS.json --output scripts/fixtures/fork/CANDIDATES.json --target 20`
- `python3 scripts/build-forks.py` deduplicates and publishes the local payoff
  checks. It ignores `published.json` as input and respects `excluded.json`.
- `python3 scripts/test-forks.py` verifies game identity, exact FEN, fork geometry,
  material payoff, difficulty evidence and full local response coverage.
- `node --test scripts/test-forks.cjs scripts/test-practice-access.cjs scripts/test-draw-game-viewer.cjs`
  checks independent chess.js replay, capture-before-completion, protected
  endpoints, navigation and the shared viewer.
