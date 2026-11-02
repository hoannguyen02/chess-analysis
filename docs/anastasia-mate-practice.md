# Anastasia Mate practice

## Selection checklist (recorded before selection)

Use the classic self-obstruction pattern: a rook checks along an edge file or
rank, a knight covers the two inward diagonal escapes, and the defending side's
own pawn blocks the middle escape. The knight, rook and pawn blockage must each
matter: removing the knight or rook breaks mate, and removing the pawn gives the
king a legal escape. Exclude corner Arabian mates and incidental knights.

Review both colors and edge orientations; quiet and capturing rook arrivals;
knight preparation; checking and quiet preparation; opening the mating line
through sacrifices; blocking and capturing defences; promotions, en passant and
castling when suitable. Map selected aspects to stable IDs in coverage data.
Special cases without an accepted example remain coverage gaps.

Use Beginner, A, B, C, C*, D, 24 verified positions each. Composed and modified
positions must be clearly identified; retain master-game provenance and local
full-game replay only for genuine game positions. Verify the full line, all
legal defensive replies, immediate alternatives, shorter mates and level grade.

The page reuses shared practice, side/objective display, alternative-mate
handling and worksheet generation. All research/review fixtures are retained
under `scripts/fixtures/anastasia-mate`.

## Sources and reproducibility

Pattern reference: [Anastasia's Mate, Chess.com](https://www.chess.com/article/view/mating-patterns-anastasias-mate).
Master-game research reuses the 30 cached PGN Mentor archives (78,021 distinct
games). Game positions retain full games and archive checksums locally.
Compositions are labeled separately and cannot masquerade as master-game FENs.

Pipeline: `collect-anastasia-mate-games.py`, `research-anastasia-mate.py`,
`compose-anastasia-mate-levels.py`, `review-anastasia-mate-games.py`,
`prove-anastasia-mates.py` (also `--composed`),
`review-anastasia-compositions.py`, `build-anastasia-mate-games.py`.
All-defence legal certificates establish the mating bound. Deeper finite engine
review checks shorter alternatives and grading; it is not an exhaustive proof
that no shorter mating strategy exists.

## Published collection

144 positions: 24 each for Beginner, A, B, C, C*, D. Includes 10 distinct
master-game positions with full local replay and 134 clearly labeled composed
or modified positions. All longer published lines have legal all-defence mate
certificates; source FENs, preceding moves, game headers, archive checksums,
analysis variations and editorial rejections are retained locally. The saved
game viewer shows actual game continuation; a teaching variation may differ.

Coverage by stable exercise ID is in `coverage.json`. Both colors, quiet moves,
captures, knight preparation, edge ranks/files, opening the mating line and
blocking/capturing defences appear in the selection. Special moves are included
only where accepted by the same verification and grading process; no castling
or en passant example was selected. Beginner exercises repeat the core sparse
pattern and are not claimed to be 24 different tactical mechanisms.

Validation: `test-anastasia-mate-games.py`, `test-anastasia-mate.cjs`, shared
`test-mate-alternatives.cjs`, `test-practice-access.cjs`, `test-worksheets.cjs`,
`audit-worksheet-copy.cjs`, production build, and browser review of level counts,
fullscreen objective, local game replay and worksheet source selection.
