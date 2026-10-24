# London System course

Private routes: `/london` and `/vi/london`. Listed in the existing private hub;
uses the shared access page and authenticated `/api/london-course` endpoint.
No course data is included in static props or imported by the client bundle.

## Teaching collection

31 Vietnamese themes across A, B, C, C*, D in two tracks. The original 100-game
collection (50 White wins, 50 Black wins; 127 positions) is preserved. A second
expansion adds Classical and Jobava positions, including drawn games. Exact counts
and topic coverage are recorded in `scripts/fixtures/london/coverage.json`.
Levels describe decision complexity rather than Elo.
The course teaches strengths, tradeoffs, common errors, White repairs, Black
counterplay, and conversion. Classical London and Jobava have separate track selectors and teaching notes.

Three anchor games supply the original 30 annotated positions:

- Ding–Nepomniachtchi, World Championship 2023, round 6, 1–0.
  [Game score](https://classicchess.com/games/ding-liren-vs-nepomniachtchi-ian-20230416/),
  [FIDE report](https://www.fide.com/the-pendulum-swings-ding-liren-equalises-again/).
- Carlsen–Aronian, Saint Louis Rapid 2019, round 5.1, 0–1.
  [Game score](https://www.365chess.com/game.php?gid=4211879).
- Keres–Fischer, Candidates 1959, round 15, 0–1.
  [Game score and exact date](https://www.365chess.com/game.php?gid=2547917),
  [second score source](https://www.chessbox.in/chessgame/keres-paul-fischer-robert-james-2/).

Multiple teaching positions are taken from each anchor game. The expanded
library contains 97 additional distinct games. Dates and move scores are
factual source data; annotations are original teaching text. The Fischer game
is round 15 (London), not the round 1 Sicilian against the same opponent.
Black wins do not establish a refutation of the opening. Some positions in a
Black win still favor White; lesson text explicitly distinguishes this.

## Interaction

London adapts its content through `london-practice.ts` to the same `DrawTrainer`
used by draw/skewer practice. Opening exercises use the `opening` outcome and
saved alternatives; unknown legal moves remain neutral. The shared trainer owns
board input, promotions, annotations, history, hints, review and exploration.
`onComplete` reports whether help was used so London retains its progress tracking.
Hint, review, exploration and reference-game use count as assistance until restart.

Reference games open in the shared `DrawGameViewer` native dialog. London supplies
an in-memory `GameSource` prop, avoiding a second fetch or a draw collection lookup;
other callers retain the existing authenticated loader. The dialog starts at the
exercise position and current board orientation, supports playback and keyboard
navigation, locks background scrolling, closes with Escape and restores focus.
Original game moves remain separate from practice analysis.

Key moves, opposing plans and common errors appear directly under the level
and color selectors, without content-mode tabs. Each theme expands to shared
practice and a paginated related-game list (six per page). All levels are freely
accessible. The two learning perspectives organize related games; White repair
positions deliberately include games Black won, with the result shown explicitly.

Progress is stored in browser localStorage under `lima-london-progress-v1`, with
assisted/independent completion. Opening a hint, solution, source game, or
exploration marks that attempt assisted. Revealing a solution alone does not
complete an exercise. Restart begins a fresh attempt; independently solved
records are retained. This is completion tracking, not a rating or mastery test.

## Reproduce and audit

Source records: `scripts/fixtures/london/games.json` (PGN, moves, FENs, URLs).
Editorial input: `scripts/fixtures/london/lessons.json`.
Generated server data: `src/lib/server/london-course.json`.
Engine evidence: `scripts/fixtures/london/audit.json`.

```sh
python3 scripts/build-london.py --engine /opt/homebrew/bin/stockfish
node --test scripts/test-london.cjs scripts/test-practice-access.cjs
npx tsc --noEmit
npm run build
```

Builder replays all source games and verifies exercise side/FEN. Stockfish root
searches use 1,000,000 nodes and MultiPV 5. Preferred teaching moves must be within
0.60 pawns of the bounded best; up to two other root moves within 0.35 are saved.
Each following ply is selected by a fresh unrestricted 250,000-node search.
The audit includes engine version, scores, depths, continuation positions and
source PGN SHA-256 hashes. These are bounded checks, not exhaustive proof.

Tests independently replay every game with chess.js, check every saved alternative
and automatic reply, test neutral feedback and progress parsing, and verify API
authorization ordering and the private registry. FEN comparisons normalize only
non-capturable en-passant targets (python-chess and chess.js serialize these
differently); other fields and legal en-passant targets remain exact.

## Expanded library provenance and selection

The source pool is 21 local master-game PGN archives from the sibling chess-video
project. `library-corpus.json` preserves archive filenames and SHA-256 hashes.
The PGN Mentor catalog/player viewer URLs are public archive references, not
claims that a byte-identical remote archive was downloaded in this session.
The original remote download attempt was unavailable; the existing local PGNs
were used. Selected full game scores and their original headers are preserved.

`collect-london.py --input /path/to/game-notes` screens the archives into
`library-candidates.json`. It requires an actual early White d4/Bf4/Nf3 position,
excludes early Nc3/Jobava and c4 queen-pawn transpositions, removes duplicate
move scores, excludes exhibitions, and selects decisive games. Modern games
require both recorded ratings at least 2200; historical Fischer/Keres archives
allow missing ratings. Event-based rapid/blitz tags are conservative; unknown
time controls remain unspecified. No claim that all examples are classical.

`build-london-library.py` distributes examples across concrete board features:
castling, recaptures, bishop exchanges, attacks on the queen, hxg3, Ne5/...c5,
a5/...f6, Nb3/...c4, play against Bg7, retreats from attacks, checks after captures,
and active pieces while converting an advantage. It prefers events without speed-format markers, then rapid, then blitz and
bullet, with higher recorded opposition ratings within each group. Event
labels alone do not certify a time control.
The two dedicated repair/punishment themes retain the detailed anchor examples.
This is a themed teaching collection, not an exhaustive opening repertoire.

Each added root uses Stockfish, 1,000,000 nodes, MultiPV 3. The **actual played
move** must be returned within 0.50 pawns of the bounded best. Conversion examples
also require at least +1.50 for the learner. Continuations use that search's legal
principal variation (unlike the separately re-searched anchor continuations).
`library-audit.json` records version, root scores/depth, exact lines and PGN hashes.
`library.json` caches selected games and exercises, so `build-london.py` rebuilds
the anchor set and merges the existing library without losing the expansion.
Rerun the library builder explicitly to select/audit a fresh expansion.

Tests assert at least 200 distinct games, at least 50 wins each, at least ten draws, complete game-to-exercise coverage,
all PGNs/FENs, authentic played roots, London setup screening, legal continuations,
audit thresholds, and protected API access. Quiet draws and dedicated ...Qb6
coverage remain useful future additions; a Black win never proves a refutation.


## Teaching mode

The header and each expanded idea offer a full-viewport teaching session. It uses
DrawTrainer and the same fullscreen/focus hook as draw/skewer practice. Select any
of the 15 ideas, either color, or a game without leaving the session. Left/right
arrows change examples, F flips and R restarts; Escape exits, except when the
reference dialog is open (Escape closes that first). The shared timer pauses for
review, exploration, reference games and completion. Other London trainers are
unmounted while teaching to avoid competing shortcuts. Desktop keeps the board
visible and lets long explanation content scroll independently; narrow screens
retain vertical scrolling for accessibility.

The regular overview uses three compact idea cards, optional opponent/error
notes, and places the expanded idea first. Selecting an idea scrolls directly to
it instead of requiring manual scrolling past the other ideas.

The shared reference dialog offers previous/next game controls when the current
idea/color (or draw/skewer category) has multiple source games. Games are
deduplicated by collection and source ID; the active exercise keeps its exact
marker. Changing source pauses playback, clears any loading error, starts at the
new example's marker and preserves board orientation. Browsing source games does
not change the underlying practice attempt. Controls disable at list boundaries.

## Classical and Jobava expansion

`collect-london-expansion.py --input /path/to/game-notes` includes decisive games
and draws from the same local master archives. In addition to the earlier Classical
screen, Jobava requires an early actual position with White d4/Bf4/Nc3 and a pawn
still on c2. This classification describes the played setup, not a PGN ECO label.
The full 1,182-game candidate pool and archive hashes are retained as
`expansion-candidates.json` and `expansion-corpus.json`.

`expansion-topics.json` contains original editorial descriptions for six extra
Classical themes and ten Jobava themes (two per level). `build-london-expansion.py`
selects up to four distinct games per theme and color, uses actual board features
to match each theme, and checks each played root at 1,000,000 nodes/MultiPV 3.
The played move must be within 0.50 pawns of the bounded best; no selected root
may be worse than -1.00 for the learner. For drawn games, the selected position
must be within ±0.80: a final drawn result alone is not evidence of sound defense.
The last selection round favors draws where the theme permits. Source outcomes
are preserved and the UI explicitly labels draws as HÒA.

Continuations are legal root-search principal variations, capped at one/three/five
plies by level and ending on the learner's move. These are bounded teaching lines,
not proof that all alternatives lose. Exact source PGN hashes and root evidence
are in `expansion-audit.json`. `expansion.json` is merged by the base builder;
rerunning the library builder reserves the expansion games to prevent duplication.

Coverage is broader, not an exhaustive repertoire. Detailed Dutch/Stonewall move
orders, dedicated early ...c6 systems, and deeper forcing sidelines remain useful
future work. The course does not claim to refute London or treat Nb5 as a forced win.

### Research references

These primary author/publisher materials informed the topic audit; teaching copy
is original and positions come from the independently retained game records:

- IM Siegfried Baumegger, [London System overview](https://www.modern-chess.com/opening/london-system/): move-order families, central play and opposing setups.
- [Chess Stars London contents/sample](https://www.chess-stars.com/resources/London_Contents.pdf): Classical structures and different Black development schemes.
- Simon Williams, [The Jobava London System sample](https://www.scacco.it/data/attachments/10893/the-jobava-system-chess.pdf): the Nc3/Bf4 family and its distinct plans.
