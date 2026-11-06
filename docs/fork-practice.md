# Fork practice

`/fork` (and `/vi/fork`) is a private, noindex page. It reuses `ChessPractice`,
`DrawTrainer`, `PracticeBoard`, the teaching timer, full-screen view, branch
exploration, analysis link and `DrawGameViewer`. Protected exercise/source APIs
keep original game data out of the static page. The private hub links to it.

## Collection

122 positions from 122 different recorded games: A 22, B 20, C 28, C* 32, D 20.
These A–D records are real-game positions. Publication and both
validation suites now require at least 20 distinct real games in **each** level.
A game contributes only one exercise; duplicate starting FENs are excluded.

Full games come from the previously downloaded public
[PGN Mentor archives](https://www.pgnmentor.com/files.html). Each published
record retains the source URL, headers, complete game, preceding move, FEN and
original-game ply. The relevant archive checksums are in
`scripts/fixtures/fork/corpus-sources.json`. A solution can differ from actual
play; the full-game dialog always shows the original recorded continuation.

## Beginner position-first authoring

Fork Beginner currently has **17 active source-derived FEN-only positions** for
owner review. The 7 reviewed compositions remain in their source bundle but
are hidden by current owner removals. The target is 24; the shared picker may
suggest up to 7 additions, subject to the owner's confirmation. These manual
positions are not claimed to be tactically verified or already simplified.
The current owner-adjusted A–D counts remain A 21, B 21, C 26, C* 34, D 20.

On Beginner, choose **Lấy thế cờ từ B, C, C*, D**. The protected API
uses the shared topic extractor to replay each source solution up to, not
including, its forking move. The selected move can be adjusted in the preview.
Only current source levels B, C, C*, D are eligible; A is excluded to reduce
overlap with Beginner. The four earlier A-derived imports were retired and
replaced with B–D source boards; the seven original compositions were retained.
The preview retains the original game reference, labels teaching-analysis
positions, skips duplicates and owner removals/transfers, and suggests only
the number needed to reach 24. Select boards, optionally edit them, then use
the single confirmation to import. More candidates remain available on demand.

Choose **Chỉnh sửa thế cờ / lời giải** on any Beginner board to arrange pieces
freely, change the side, paste/copy FEN, or record an optional solution. The
piece editor is separate from legal-move recording. Changing FEN resets old
lines; Cancel discards the draft. Save keeps the same entry ID and source.
Without a solution, the shared exploration board permits free practice with no
correctness or completion verdict. Worksheet diagrams remain available; answer
pages explicitly say no solution is recorded.

The 7 reviewed compositions and evidence are in
`scripts/fixtures/fork/beginner.json`, built into
`src/lib/server/fork-beginner-exercises.json`. The 17 imported boards use the
existing `src/lib/server/manual-tactics.json`; no per-request candidate bundle
is committed. Original A–D records, solutions, source games and owner decisions
are preserved. See [manual authoring](manual-tactic-positions.md) and the
[Beginner workflow](tactic-research-workflow.md#beginner-only-position-authoring).

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

## Beginner authoring validation (2026-11-06)

86 focused JavaScript tests and 5 Python Fork tests passed, with TypeScript,
ESLint and the worksheet copy audit. Browser checks covered batch confirmation,
saving without a solution, piece removal and undo, FEN import, Apply/Cancel and
stable identity after a saved FEN change. The test edit was restored to its
source board. All 24 diagrams and the answer export were rendered and visually
inspected; the 17 FEN-only entries explicitly have no recorded answer. Source
A–D JSON, complete games, publication records, owner adjustments and all prior
manual entries matched their pre-import snapshot.
