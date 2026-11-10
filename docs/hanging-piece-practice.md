# Hanging Piece practice

The protected route is `/hanging-piece`, titled **Bắt quân không được bảo vệ**.
The title follows Phùng Đức Tường's beginner lesson in
[*Chiến thuật cờ vua từ con số 0*, tập 1](https://duongsinhbook.com/sach-chien-thuat-co-vua-tu-con-so-0-tap-1).
The introduction explains the term *quân treo* and covers insufficient defence,
as in [Lichess's puzzle theme](https://github.com/lichess-org/lila/blob/master/translation/source/puzzleTheme.xml#L64-L65).
The learner finds a loose piece, captures it safely and keeps the material gain
against relevant counterplay. In normal and full-screen practice the starting
side and material objective remain visible. The game dialog shows the original
game at the exercise ply. The practice solution can follow a separate analysis
line.

| Level | Verified | Gap to 24 | Focus |
| --- | ---: | ---: | --- |
| Beginner | 24 | 0 | Sparse original compositions. Find the safe capture or answer a direct threat. |
| A | 24 | 0 | One-move captures from master games, including check evasions and choices between capturing, checking and trading. |
| B | 33 | 0 | Two or three solver moves. Account for counterchecks, capture races, promotion and threats to another piece. |
| C | 0 | 24 | The safe-capture scope has no reviewed simple-sacrifice family. |
| C* | 0 | 24 | No reviewed exercise meets the two- or three-move grade against a strong defence without a sacrifice. |
| D | 0 | 24 | No reviewed advanced sacrifice uses the loose piece as the central decision. |
| D* | 4 | 20 | Four or five solver moves are needed against a strong defence without a sacrifice. |

## Level B additions · 2026-11-08

The first expansion brought the verified B bank to 29. After the owner's
removals and level choices, 23 were active at that publication. The
new decisions are choosing between two loose rooks, clearing a rook file with
tempo before a favorable exchange, capturing a passed pawn before it promotes,
lifting a rook against a countercheck, and evacuating a rook when an exchange
is no longer available. Two solution lines were played in full; three are
teaching continuations after the played capture.

The saved bank supplied 36 leads without a new corpus scan. The four-worker
tactical pass took 28.3 seconds with 201 engine calls and 77 engine-cache hits;
12 leads reached editorial review. Three reviewed reserves remain unpublished.
The isolated rebuild preserved prior exercises, games and owner decisions.
The access, replay and worksheet checks passed, and all six worksheet pages
and four answer pages were inspected.

The second expansion brings the verified B bank to 33, with 26 active after
the owner's latest removal. The four new exercises cover a three-square
capture race, a pin that prevents a recapture, a king capture followed by a
bishop defense against rook entry, and a bishop retreat after the opposing
queen reinforces a capture. Three lines were played in full; one continues
as teaching analysis after the played capture.

The second expansion reused one previously unselected position and screened
38 fresh leads in two batches from the saved bank. The two fresh tactical
passes took 22.8 and 11.8 seconds, with 232 engine calls and 40 engine-cache
hits combined. The revised played line was verified separately. The protected
practice, replay and worksheet checks passed, and all six worksheet pages and
three answer pages were inspected after refreshing the owner decisions.

## D* grade review

The four exercises originally published at C* passed individual review for
D*. The practice-management records apply the new grades to practice, the
Beginner source bank and worksheets. The original publication bundle retains
the FENs, sample lines, game sources and approval evidence. The move counts
below describe the saved lines.

| Game and exercise ID | Solver moves | Strong defence and shorter alternatives |
| --- | ---: | --- |
| Firouzja–Tabatabaei · `35d57f7464e91417` | 5 | After `Bxd8 Nd5`, `Bg5 exf3 Bxf3` appears to keep the gain. `...Rf2+ Kg1 ...Rxf3` reduces it to 170 cp, below the 200 cp target. The saved `Rh3 Ne3+ Kg1 Bf4 Kf2 f5 gxf5` answers the check, protects the e2 bishop and keeps the gain. |
| Qin–Karpov · `03f8fc110c333ca6` | 4 | `Ra2` and `Rda1` bring both rooks against the a3 knight. `...b4 Bxb4 ...Bxb4` preserves the gain through an immediate favorable exchange. The three-move try `...Rxc6 Ra2 ...Nb8 Rda1 ...Nb5` allows `Rb2` and a sequence of exchanges that reduces the gain to 90 cp, below the 200 cp target. `...Ra6` holds the a-file for now but leaves further work after `Bd2` and `Bc1`. |
| Kramnik–Karpov · `249c68a2e2444e23` | 4 | After `Kxg2 Rfd8`, the threat to the d7 knight rules out a settled gain within three solver moves. `Nf3` attacks the queen, and `Nde5 Bxe5 Nxe5` completes the knight-for-bishop exchange. Against the stronger `...Qg4`, `Nde5 Qf5 Qxf5` also needs the fourth move. |
| Reyes–Fischer · `c584e8997695ffc9` | 4 | After `...Nxb6 Qd4 ...Rc6 Rfe2`, `...Be6` blocks the e-file and `...fxe6` wins the rook on the fourth move. The shorter try `...Nxb6 Qd4 ...Rxf3 Qxb6 ...Rxf2` allows `Kxf2` and `Qxd6` in the tested recovery lines, cutting the gain to 10 cp against a 110 cp target. |

The regrade compared 121 legal starting moves and screened for a settled
material gain within three solver moves. Focused Stockfish 17 probes used
up to three million nodes to check apparent shortcuts, counterchecks and
material recovery. Capture offers in the saved lines were checked for
immediate compensation or equal exchanges. None of the four lines requires
a sacrifice.

## Evidence and rebuild

The Beginner bundle in `scripts/fixtures/hanging-piece/beginner.json` stores
original positions, explicit objectives, editorial decisions and proof. The
compositions cover all six moving piece types and split evenly between White
and Black. Every legal initial move was compared and every immediate defence
against the solution was checked. Bounded engine probes supplement those local
material checks. The builder applies the terminology update to approved prompts
and hints after validating their original review evidence.

The source-derived bundle in `scripts/fixtures/hanging-piece/published.json`
retains 61 full games, source headers, checksummed archive references, exact
FENs, previous moves and analysis lines. It also records tactical evidence,
editorial decisions and the publication order. The adapter checks every legal
starting move at the shared root budget, then probes the strongest defences,
all legal immediate captures and checks, and the recorded reply. Its material
payoff is a bounded tactical claim. Editorial review checks alternatives,
recapture sequences, grade and whether a longer line is needed.

Use the shared [research workflow](tactic-research-workflow.md#executable-workflow-checks)
with topic `hanging-piece` for new source work. The current source adapter
supports A, B, C* and D*. Start the ledger before lookup. Use the shared collection,
review, editorial and isolated publication commands with the same run file.
For agent-verified original positions use `review-compositions --topic
hanging-piece`. The owner-reviewed Beginner importer currently has B and D*
sources here. It retains the real preceding move and supports optional solutions.
Owner-authored positions are separate from the verified composition count.

The protected exercise endpoint also supplies the worksheet builder. The
trainer accepts an unsaved direct capture only if its bounded material check
covers the legal immediate replies. Longer unsaved variations can be explored
on the board. The game viewer loads complete original games through the
protected game-source endpoint.

```sh
python3 scripts/test-hanging-piece.py
node --test scripts/test-hanging-piece.cjs scripts/test-worksheets.cjs \
  scripts/test-practice-access.cjs scripts/test-mate-alternatives.cjs
node scripts/audit-worksheet-copy.cjs
```

## Initial collection

On 2026-11-07 the shared index supplied 25,571 complete games. The initial
collector replayed 15,541 eligible decisive master games and looked for safe
captures in the final 28 plies. The scan took 363 seconds with four workers,
found 10,382 geometric positions and made 9,527 shallow engine calls with
1,305 cache hits. It retained 3,421 A, 604 B and 192 C* leads in the local bank.
Full-budget triage examined 399 candidate records across the three levels.
Of those, 144 reached editorial review. The 52 selected records passed
isolated rebuild, access, replay, worksheet and copy validation. The two
publication batches produced 23 worksheet and 16 answer pages, all visually
inspected before applying the generated files. The source run took 67 minutes
and 12 seconds through final validation and gap reporting, including the time
between commands and overlapping reviewer intervals.

This initial search used the existing indexed corpus and prioritized a loose
piece already capturable in the starting position. The initial counts and run
ledger use the earlier C* rubric.
