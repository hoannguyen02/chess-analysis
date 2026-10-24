# Skewer practice

`/skewer` (Vietnamese: `/vi/skewer`) is an unlisted, password-free page,
with `noindex, nofollow`, matching `/hoa-co`. It reuses the practice board,
timer, fullscreen layout, promotion picker, previous-move context, original-game
viewer and analysis links. Levels are exactly **A, B, C, C*, D**, initially A.
The current route is `/skewer`; the legacy redirect is disabled in `next.config.ts`.

## Teaching set

246 independently checked exercises from 246 distinct recorded games in A–D:
**A 45, B 50, C 51, C* 50, D 50**. Four additional recorded-game positions
appear exclusively in Xiên Hậu. Counts reflect accepted positions,
not all automatically mined candidates. Each exercise retains its exact source
position, preceding move, complete original game, and separately audited solution.

## Teaching rubric

Count the learner's moves, not both players' plies:

- A: direct skewer, then capture the rear piece; no preparation or sacrifice.
- B: one preparatory move before the skewer; no sacrifice.
- C: one simple sacrifice and a short sequence (at most three learner moves).
- C*: two or three preparatory moves without a detected sacrifice.
- D: more than three learner moves, with multiple sacrifices or a rook/queen
  sacrifice in a longer combination. These are **suggested** levels for teacher
  review; move count and piece value cannot fully measure human difficulty.

The board accepts saved alternative solutions. An unrecorded legal move receives
neutral feedback, rather than being called wrong. This is a stored-variation
trainer, not an exhaustive live engine evaluator. Hints progress from the idea,
to the piece, to the move. The motif explanation is revealed in solution mode
or after completion. Grading reasons remain in the data for teacher review,
but are not displayed in the skewer practice UI.

## Sources and validation

The research corpus contains 121 public player archives from [PGN Mentor](https://www.pgnmentor.com/files.html), covering historical and modern masters.
Archive URLs and downloaded PGN SHA-256 hashes are preserved in `corpus.json`
and the `*-corpus.json` manifests under `scripts/fixtures/skewer/`.
Sources are games featuring an established master/world champion, not a claim
that both opponents held GM titles. Restrict player identity and dates; exclude
simultaneous, blindfold, odds and consultation games. A namesake in an archive
does not establish the famous player's participation.

- `scripts/fixtures/skewer/audit.json` preserves each accepted game's full PGN,
  headers, source URL, exercise ply, exact FEN, actual preceding move, suggested
  grade, sacrifice evidence and engine checks, plus rejected candidates.
- `src/lib/chess/skewer-exercises.json` is the generated training payload.
- `src/lib/server/skewer-game-sources.json` contains only actual game moves,
  served lazily by `/api/skewer-game-sources`.
- Analysis continuations are **not appended to the original game**. The viewer
  labels this distinction and marks the exercise position with the existing star.

Mining screens real positions for a bishop, rook or queen attacking a more
valuable enemy piece in front of a second enemy piece. The selected line must
move the front piece away and capture the rear piece with the same attacker.
Require at least one pawn of material gain after the immediate exchanges.

Before publication, Stockfish 17 rechecks each starting position with 1,000,000
nodes and MultiPV 3. A selected skewer line must score at least +1.50 pawns from
the learner's perspective and be within 0.40 pawns of the strongest root line.
Fresh unrestricted 150,000-node searches after every learner move must retain
at least +1.00. These bounded checks are evidence, not a mathematical proof or
an exhaustive enumeration of all defences. Ambiguous classifications are omitted.

Difficulty evidence distinguishes delayed acceptance of a sacrifice from an
ordinary exchange. Source positions and games are deduplicated; publish at most
one exercise per game across all levels. No fabricated games or mirrored copies fill quotas.

The expanded collector searches up to six preparatory moves before game skewers
and also winning game endings, then confirms promising lines among three engine
candidates. Explicit name aliases handle PGN abbreviations and transliterations
without accepting arbitrary namesakes. The validator independently replays the
source PGN, checks the source identity, exercise ply/FEN and preceding move, and
reclassifies difficulty from its deeper analysis. Quota-deferred candidates are
separate from rejected positions and can be reconsidered when the target rises.

## Reproduce

Install python-chess and Stockfish separately. Download the public archives and
unpack them into a directory (named `Alekhine.pgn`, `Anand.pgn`, etc.).

```sh
python3 scripts/collect-skewers.py --input /path/to/masters --target 70 --include-endings --output scripts/fixtures/skewer/new-candidates.json
python3 scripts/collect-skewers.py --input /path/to/masters --target 70 --include-endings --levels C D --output scripts/fixtures/skewer/new-sacrifice-candidates.json
python3 scripts/validate-skewers.py --target 50
python3 scripts/test-skewer-pipeline.py
python3 scripts/build-skewers.py
node --test scripts/test-skewers.cjs scripts/test-draw-trainer.cjs scripts/test-draw-game-viewer.cjs
```

The engine path defaults to `/opt/homebrew/bin/stockfish`; override with `--engine`.
`--target` controls the mining target per level, default 10. Validation resumes
from its audit (default target 50 per level); use `--retry-rejected` to revisit rejected candidates after a
method change. Collector outputs resume without overwriting existing candidates;
use distinct output names for different source batches. The builder reads only
independently audited records and refuses publication below the requested minimum.

Tests replay every full game, verify the exact exercise FEN and preceding move,
complete each main solution locally, check alternative moves, and independently
check the skewer's geometry and capture sequence. Shared draw-practice regression
tests also remain in place.

## Explore alternative replies

“Thử nước khác” opens a separate, local exploration board. In solve mode,
entry rewinds before the latest automatic opponent reply; in review mode it
starts at the displayed position. Only already-seen moves are included. The
teacher can select any included position, move both sides, navigate branches,
and open the displayed FEN in Analysis. New branches preserve existing branches
for comparison during this exploration session; leaving exploration discards
these temporary branches, not exercise progress.

The practice state remains untouched, the teaching timer pauses, and returning
restores the exercise position and feedback. A small indicator records that
exploration was used until the exercise is restarted. Promotion choices,
castling and en passant use chess.js legality. Replay from the exercise FEN
preserves repetition history within the exercise; positions preceding that FEN
are not counted. The external Analysis link passes only FEN, not repetition
history. Exploration does not judge alternative moves or claim that a saved
reply is forced. Engine explanations and defence validation remain separate.

## Private teacher access

Set the server-only `PRACTICE_PASSWORD` environment variable in `.env.local`
for development and in the hosting environment before deploying. Do not use
an environment variable prefixed with `NEXT_PUBLIC_`. A missing password leaves
access disabled. Deploy a fresh build: previously generated public static data
from older builds must not be retained or served.

`/skewer` (including localized routes) redirects unauthenticated browsers to `/access` without exercise
props. `/api/practice-access` validates the password and issues a signed token
valid for 30 days. The browser stores only that token in localStorage, never the
password. `/api/skewer-exercises` and `/api/skewer-game-sources` require the token
in the Authorization header and send private/no-store cache headers. The source
game viewer uses the same access token. Public navigation omits the skewer link.

“Khóa lại” removes saved access from the browser and reloads to clear in-memory
exercise data. Changing `PRACTICE_PASSWORD` invalidates all previously issued
tokens. Login throttling is per server instance; use an edge or shared rate
limiter when deploying across multiple instances. Use HTTPS in production.

Run `node --test scripts/test-practice-access.cjs` for access checks.

## Private navigation hub and URL changes

Set `PRIVATE_HUB_PATH=/workspace-v8k4m2` in `.env.local` and in the hosting
environment. Use a unique single URL segment, 1–80 lowercase letters, digits,
or hyphens, starting with a letter or digit. Do not choose an existing public
page route. No `NEXT_PUBLIC_` variable is needed.

The dynamic page checks this setting on the server for every request. A missing
or invalid setting disables the hub; other unmatched routes return 404. The hub
uses the same password and 30-day saved access as the exercise pages. Its page
list comes from the protected `/api/private-pages` endpoint. Add new protected
pages to `privatePages` in `src/lib/server/private-hub.ts`.

To rotate the URL monthly, update `PRIVATE_HUB_PATH` and restart the development
server or redeploy production with the new value. Update your bookmark after
rotation. The old hub URL returns 404; saved login tokens remain valid because
the password has not changed. This rotates the hub URL, not the individual
protected page routes. Exercise pages obtain the current hub link through their
protected API response. There is no public `/private` alias or navigation link.


## Dedicated password page

`/access` (or `/vi/access`) is the common password page. PrivateContent checks
browser-stored access before loading protected content. Missing or rejected
tokens redirect to `/access?next=...`; after login, the server validates the
return path against the protected page registry and current hub path. The
original locale, query and fragment are preserved for valid return paths.
External URLs, the login page, and retired hub paths fall back to the current
hub to avoid open redirects or login loops. Visiting `/access` with valid saved
access skips the form and opens the requested page or hub.

Because access is stored in localStorage, this navigation happens in the browser
after hydration, not in server middleware. The server APIs still independently
verify every private-data request. “Khóa lại” clears access and opens the login
page, retaining the original destination for the next login.

## Additional private pages

The hub also includes `/hoa-co`, `/chien-thuat`, and `/lich-hoc`. Each uses
PrivateContent and the shared login/return flow. Draw exercises and source games
are served by authenticated `/api/draw-exercises` and `/api/draw-game-sources`.
Tactics topics and schedule data are served by `/api/private-tactics` and
`/api/private-schedule`. These endpoints check access before importing their
content and return private/no-store responses. Shared source-game caching is
scoped to the access token for both draw and skewer collections.

## Beginner compositions (October 2026)

The separate **Nhập môn** group precedes A and is the default on `/skewer`.
It adds 57 original composed positions, not source-game excerpts. The existing
250 game exercises and A/B/C/C*/D classifications are unchanged. Compositions
have no game reference or invented player names and therefore no replay icon.

Design: rook and queen puzzles have four pieces (two kings, attacker, target).
Bishop puzzles add one friendly non-rook pawn: five pieces total, so the capture
does not leave a bare king and bishop. Every bishop continuation is checked
with Stockfish at 50,000 nodes for an evaluation of at least +3 pawns; this is
finite engine evidence, not a tablebase proof. Captures and all legal replies
are revalidated after adding the pawn.
Rooks and queens each have 20 exercises; bishops have 17. Rooks and queens each face five queen targets,
five rooks, four bishops, four knights, and two pawns. Bishops face six queens,
six rooks, three knights, and two pawns. Bishop-on-bishop targets would require
same-color bishops, an already drawn four-piece position, so they are excluded. There are 29 White-to-move and 28 Black-to-move positions.
Original lessons 17, 26 and 35 were removed at the user’s request; the generator
excludes them and renumbers the retained lessons. Rooks cover files and ranks, bishops both diagonal directions,
and queens all four geometries. Target type does not fix the attack axis.
All legal replies must allow a safe capture; this teaches material gain,
not a claim of tablebase-proven play.
The generator keeps
20 rook, 17 bishop, and 20 queen exercises, interleaved rook → bishop → queen so all three appear from the start. White and Black alternate in batches of three. Each has
one immediate skewer move, followed by an exposed-piece capture: no setup,
sacrifice, promotion, or requirement to calculate a long variation. Capturing
the target completes the tactical task; it does not promise a won endgame
The bishop exercises retain a pawn to avoid an immediate insufficient-material draw.

Conceptual references consulted: [Chess.com, Skewer](https://www.chess.com/terms/skewer-chess)
and [Lichess, The Skewer](https://lichess.org/practice/basic-tactics/the-skewer/tuoBxVE5/0sv7wGO3).
These inform the basic alignment/king-skewer concept; their exercises were not
copied. Positions are generated by `scripts/build-beginner-skewers.py` with a
fixed seed. All positions are legal and initially out of check, with no immediate
capture available. Every legal defence to the checking move is a king move;
every such move permits the same safe capture of the rear piece. All those
branches are stored as accepted solutions. Only positions with a unique first
move satisfying that full skewer criterion are retained. This is a tactical
verification, not an engine claim that no other move can win.

Run `python3 scripts/build-beginner-skewers.py` to reproduce data, and
`node --test scripts/test-beginner-skewers.cjs` for independent chess.js checks
of all legal defences, piece counts, alignment, captures, and branch coverage.
Data remains behind the existing authorized skewer API.

### Non-checking queen skewers


The active **Xiên Hậu** tab serves 16 lessons: 10 original sparse compositions
from `src/lib/server/queen-skewer-intro.json`, followed by the six preserved
pilot positions from `src/lib/server/queen-skewer-pilot.json` as lessons 11–16.
Former lessons 14–24 were removed at the user’s request because they were too complex.
The introductory set includes 10 skewer puzzles (five diagonals, three files,
and two ranks). The guided exchange exercise formerly at lesson 5 was also
removed at the user’s request, as were original lessons 9 (Rd4 Qxd4 Bxd4) and 12 (Rb5 Qf7 Rxg5). The remaining boards contain six or seven pieces
and use five supporting piece types. `build-queen-skewer-intro.py` retains
separate engine audit evidence and excludes the removed slots.
For the full skewer puzzles, root moves must appear in a 600,000-node MultiPV comparison within 40
centipawns of its best score (or share its shortest positive mate distance), and sample
replies are selected by fresh unrestricted searches at 400,000 nodes. This is
a finite engine check, not a claim of perfect play. Lessons teach material gain;
a favorable exchange need not imply a theoretically won endgame.
The 57 king-skewer exercises use the varied four-piece design above. Four pilot positions have been
removed from Level A to avoid repetition, leaving 246 A–D exercises. See
[the pilot review](queen-skewer-pilot.md) for boards and teaching coverage.
Four original-game references open in the existing DrawGameViewer dialog.
The rank-skewer composition and altered counterexample have no game reference.

The final exercise asks whether Ba3 works. Its `decision` field provides two
choices in DrawTrainer; moving pieces cannot solve this exercise. The correct
choice completes the task, and “Xem mẫu” replays the refutation. Restart clears
the decision, feedback and completion state. Position 4 accepts both Rxd6 and
the audited near-best Bxd6 alternative. The private endpoint still authorizes
before importing any data, and does not expose engine audit records.

Regenerate the web payload with `python3 scripts/build-queen-skewer-web.py`.
Run `node --test scripts/test-queen-skewer-web.cjs scripts/test-queen-skewer-pilot.cjs scripts/test-practice-access.cjs`.

#### Archived 30-position composition set

The following describes the previous dataset, retained for research and
regression checks; it is no longer returned by the lesson API.

A second beginner choice, **Xiên Hậu**, adds 30 original composed exercises
alongside the 60 royal skewers. The beginner tab now contains 90 exercises,
with separate buttons for the two ideas; A/B/C/C*/D remain unchanged.

The set now covers **18 bishop skewers on diagonals, six rook skewers on
files, and six rook skewers on ranks**, interleaved in groups of five. There
are 20 White-to-move and ten Black-to-move positions, with no rotated,
reflected or color-swapped duplicates. The shared trainer and game viewer
behavior remain unchanged. Neutral numbered titles avoid revealing the reply.

Bishop exercises use seven pieces and include queen retreats, profitable
bishop-for-rook exchanges, and captures of a protected bishop. The automatic
reply is chosen by the engine audit below, rather than alternating illustrative
reply types. Rook
exercises use eight pieces. An additional knight supports the eventual capture
square: if the queen recaptures the attacking rook, the knight can take the
queen. This is why a validator that stops at the loss of the rook can wrongly
reject a valid skewer.

The task is specifically to find a queen skewer, not to find the only move that
wins material. Some rook compositions also allow a knight to exchange itself
for the defended rear rook immediately. The generator excludes an already-free
capture worth more than two material points and an immediate capture by the
attacking rook. Those other legal moves retain the trainer's neutral
unrecorded-move feedback; no unique-best-move claim is made.

Conceptual references: [Ward Farnsworth, Simple Skewers Through the Queen](https://www.chesstactics.org/the-pin-and-the-skewer/the-skewer/simple-skewers-through-the-queen/4_5_2_1.html)
explains protection of the attacker and queen/rear-piece alignment;
[ChessBase, The Skewer](https://learn.chessbase.com/en/page/chess-tactics-the-skewer)
explains the motif and winning the exchange. Positions are original
compositions, not copied examples or attributed games.

Every legal reply to each recorded initial skewer is covered. Bishop branches
end after three half-moves. Rook branches normally do too, but where an exchange
needs calculation, every next opponent reply is also stored. A quiet reply can
end the task at four half-moves; a recapture continues to five. Terminal lines
must retain at least two material points (pawn=1, minor=3, rook=5, queen=9),
including all captures in the line and subtracting the largest immediately
available opposing capture when it is the opponent's turn. Stalemate and
immediate mating counterattacks are excluded. This bounded tactical check is
not a proof of a won endgame. Defensive reply selection is separately
engine-audited as described below.

Generate with `python3 scripts/build-quiet-beginner-skewers.py`. Validate with
`node --test scripts/test-quiet-beginner-skewers.cjs scripts/test-beginner-skewers.cjs`.
Independent chess.js tests check geometry, all legal replies at both defence
steps, captures and material balance, shared trainer completion through
recaptures, all three line orientations, and symmetry deduplication.

### Strong automatic queen-skewer defences

`scripts/audit_queen_skewer_replies.py` runs Stockfish with one thread, a cleared
128 MiB hash, 1,000,000 nodes per defender position, and unrestricted MultiPV 3.
At every stored defender turn (including replies after a capture), it orders
branches so the shared trainer selects the highest-ranked engine move.
Searches are **not** restricted to the saved replies: if the engine's first
choice is missing, publication fails. Other legal replies remain available
for exploration. The original initial skewer moves remain unchanged; this
audit selects defensive replies, not new learner solutions or a promise of
optimal play for every learner continuation.

The generator invokes this audit before writing the exercise payload. Existing
data can be re-audited with:

```sh
python3 scripts/audit_queen_skewer_replies.py --engine /opt/homebrew/bin/stockfish
```

`scripts/fixtures/skewer/queen-reply-audit.json` preserves the engine identity,
position/prefix, top three moves, scores from the defender's perspective, depth,
node count, and a digest of the exercise FEN and all branches. Regression tests
verify that the first matching branch selects the audited first choice at
every defender turn and reject stale audits. These bounded engine searches
identify the strongest move found at the recorded search budget, not a
mathematical proof of optimality.

For the first exercise, the old illustrative line `Bf3 Qc8 Bxh5` is replaced
by `Bf3 Qg5 Bxh5`. The queen on g5 still protects h5, so the subsequent
`Qxh5` exchanges a rook for a bishop instead of giving away a free rook.
Solution wording now explains protected rear pieces and exchanges without
assuming that the queen cooperates.

### Reviewed level correction

Maroczy – Blackburne (Vienna 1898), source ID `7ffe2bbc362d63a7`, is
assigned C at the user's teaching judgment. `level-overrides.json` preserves
that decision during regeneration. The engine audit's A classification and
measured sacrifice count are retained as research evidence, not rewritten as
if the classifier had detected a sacrifice. After also reserving the four
recorded queen-pilot positions for Xiên Hậu, published counts are A=45,
B=50, C=51, C*=50, D=50 (246 exercises total).

`build-skewers.py` excludes active queen-pilot positions from Level A on each
rebuild, while retaining all 250 full games for the original-game viewer.
The queen-pilot generator reads the canonical audit rather than Level A,
so regenerating either collection preserves source provenance.
