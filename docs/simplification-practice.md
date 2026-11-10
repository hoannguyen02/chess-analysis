# Simplification practice

`/simplification` (also `/vi/simplification`) uses the same private access,
`ChessPractice`, `DrawTrainer`, `PracticeBoard`, timer, full-screen mode,
branch exploration, analysis links and `DrawGameViewer` as `/fork`.
The page is noindex. Protected APIs supply exercise and full-game data;
neither is embedded in the public static page.

Published collection: **113 distinct real games** — A 21, B 25, C 24,
C* 22, D 21. Every level meets the requested range of 20–30 positions.
There are 82 winning liquidations and 31 defensive draws.

## Scope and teaching goal

This initial collection focuses on **liquidating to a king-and-pawn ending**.
The exercise ends after the complete exchange, including the opponent's
recapture. Success means reaching the intended ending, not that the actual
chess game has already ended. Winning and defensive-draw exercises state their
goal separately. A defensive example must start at least a pawn down by the
collection's material scale; a bishop/knight valuation difference is not enough.

This follows the idea of exchanging pieces to reach a favorable remaining
position, including sacrificing an exchange when appropriate; see
[Chess.com's simplification overview](https://www.chess.com/terms/simplification-chess).
The named motif contributes directly: both sides lose their remaining non-pawn
pieces and the resulting pawn ending has an exact known outcome. A gain from
simply taking an undefended piece is excluded. Every lesson includes the final
king and pawn locations and its outcome in the explanation.

## Provenance and verification

Full games are sourced from [PGN Mentor](https://www.pgnmentor.com/files.html).
Source URLs and archive SHA-256 hashes are in
`scripts/fixtures/simplification/corpus-sources.json`. Every exercise retains
its original game ID (hash of the full UCI move sequence), headers, complete
game, starting FEN, source ply and preceding move. Analysis can differ from
actual play; the reference dialog always shows the original recorded game.

`prepare-simplification-corpus.py` searches already validated complete games
for transitions into pawn endings. `collect-simplification.py` checks candidate
positions with Stockfish: 15,000-node screening for engine candidates, 300,000-node main analysis,
and a fresh 150,000-node defensive probe after every solver move. The
`--actual-lines` path also validates recorded continuations instead of assuming
the engine's first PV is the only suitable example. It checks every move by
both sides, rejects repeated positions and rejects a decision that deteriorates
that player's evaluation by more than 150 centipawns (scores capped at ±1500
for this comparison). Source games remain separate from the selected teaching
line. Candidate continuations may contain up to 20 plies. Preparatory
solver moves must capture, check, offer a trade by attacking an enemy piece,
or advance a pawn. Arbitrary quiet waiting moves do not qualify as preparation.

Publication requires:

- Both sides initially have a non-pawn piece; all such pieces disappear in the
  displayed solution, with at least one consecutive capture/recapture pair.
- The resulting material balance improves by at most one pawn: the lesson is
  liquidation, not an incidental exchange following a large material win.
- The endpoint contains at most seven pieces, including kings, and only kings
  and pawns remain. Its exact FEN is checked against Lichess's Syzygy service.
- Only definite `win`, `loss` or `draw` categories are accepted; ambiguous,
  cursed or blessed results are not treated as ordinary wins/draws.
- A claimed win is from the solver's perspective, accounting for whose turn
  it is in the endpoint FEN. Draw exercises must genuinely start material down.

The [Lichess tablebase API](https://github.com/lichess-org/lila-tablebase/blob/main/README.md)
returns outcomes from the side-to-move perspective. Responses are cached in
`tablebase.json`; practice itself requires no live engine or tablebase calls.
**The endpoint is exactly verified; earlier defence is checked with finite
engine searches, not an exhaustive proof of every possible branch.** The
stored continuation is not necessarily the only good plan. Branch exploration
and the analysis link remain available to examine alternatives.

## Difficulty and editorial decisions

A: direct liquidation within two solver moves. B: three solver moves without
sacrifice. C: a short liquidation that gives up a material advantage in pieces.
C*: a longer calculation without sacrifice. D: more than three solver moves
with that material concession. A temporary equal exchange and losses of pawns
alone do not cause a piece-sacrifice classification. Captured officer values
are tracked separately from promotions: an equal queen trade after an opponent
promotes is not mislabeled as a queen sacrifice. Difficulty is suggested;
pawn-ending knowledge also affects how hard a position feels.

Quality takes priority over collection size. Review evidence is stored per
stable game ID, FEN and complete solution in `published.json`; durable editorial
exclusions in `excluded.json` are respected by both collector and builder.
`reviewed.json` stores exact replacement lines and reasons for grading changes.
`level-overrides.json` stores explicit editorial grades by game ID, exact FEN,
and solution; the builder applies these after validating the line and the
collector honors them in its counts. Marshall–Wolf (Ostende 1905,
`a81dda7bdbee044e`) is assigned C* at the user's request: although `Rxf3 Kxf3`
is short, evaluating the resulting pawn ending is the learning challenge.
Spielmann–Steiner (Budapest 1928, `3ff437b31a5310dd`) is assigned B at the
user’s request; `g4 Rxf5+ Kxf5` prepares the rook exchange into a winning pawn ending.

Longer lessons receive an additional 900,000-node, three-variation search for a
shorter liquidation. A replacement needs the same exact tablebase outcome and
fresh 300,000-node defensive checks. Where a shorter solution is found, the
lesson is regraded rather than retaining a harder label. This is a finite
search, not a proof that no other shorter solution exists. Regression tests
cover the per-level range as well as the promotion/equal-exchange distinction.

## Reproduce

1. Prepare public PGN archives with `scripts/prepare-pin-corpus.py`.
2. `python3 scripts/prepare-simplification-corpus.py CORPUS.json SEEDS.json`
3. `python3 scripts/collect-simplification.py --seeds SEEDS.json --actual-lines --target 22`
   Omit `--actual-lines` to search engine continuations instead. Collection
   counts honor durable grading overrides.
   After an initial build, run `scripts/review-simplification-lines.py` to compare
   shorter original-game solutions. Its durable `reviewed.json` overrides take
   precedence over mined lines on subsequent builds.
4. `python3 scripts/review-simplification-difficulty.py`, then
   `python3 scripts/build-simplification.py`
5. `python3 scripts/test-simplification.py`
6. `node --test scripts/test-simplification.cjs scripts/test-practice-access.cjs`

Tests replay source games independently, verify source hashes/FENs, validate the
complete exchange and cached endpoint result, distinguish exchanges from
sacrifices, and check trainer completion after both odd- and even-length lines.

Saemisch–Spielmann (Teplitz-Schoenau 1922, `3119df21c60c6f80`) was removed
at the user’s request and is durably excluded in `excluded.json`.
