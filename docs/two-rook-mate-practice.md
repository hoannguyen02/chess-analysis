# Two-rook checkmate practice

`/two-rook-mate` (including `/vi/two-rook-mate`) is a private, noindex page
listed in the private hub. Protected exercise and reference-game endpoints
supply 133 bundled exercises and 133 distinct original games saved locally.

| Level    | Composed | Master games | Total |
| -------- | -------: | -----------: | ----: |
| Beginner |        0 |            0 |     0 |
| A        |        0 |           30 |    30 |
| B        |        0 |           27 |    27 |
| C        |        0 |           26 |    26 |
| C\*      |        0 |           26 |    26 |
| D        |        0 |           24 |    24 |
| D\*      |        0 |            0 |     0 |

Beginner starts empty. In local development, use **Lấy thế cờ từ B, C, C\*, D, D\***
in **Nhập môn** to choose and save positions through the shared importer, or use
**Thêm thế cờ Nhập môn** to set up a position directly.

The 40 earlier A/B compositions were retired from practice. A now uses direct
checkmates in one or two moves from master games. B requires three solver moves
and covers short preparation such as cutting off a rank, removing a defender,
or coping with a countercheck. The new C examples require one simple sacrifice.
The new C\* examples require three solver moves without a sacrifice and show a
strong defensive choice that changes the solver's continuation. Earlier C\*
grades retain their original review. D requires a queen sacrifice or multiple sacrifices over more
than three solver moves. These are combination-based editorial grades, not
move-count-only difficulty ratings.

Every exercise identifies the starting side and checkmate objective. The page
reuses `ChessPractice`, `DrawTrainer`, and `PracticeBoard`, including fullscreen,
timer, hints, analysis, and branch exploration. Reference games open in the
shared `DrawGameViewer`.

## Research and provenance

The earlier master positions come from 36 cached public PGN Mentor archives.
Their URLs and SHA-256 checksums are retained in `master-corpus-sources.json`.
The A/B replacement batch uses indexed PGN Mentor and The Week in Chess games,
with archive references, checksums and master credentials in the cumulative
`expansion-evidence.json` bundle. Each
published record retains its exact FEN, previous move, source ply, complete
original game, headers, stable game identifier, solution and review evidence.
The exercise's analyzed continuation can differ from the recorded game,
particularly when the original game ended in resignation. Original-game replay
always shows the recorded moves.

The short-mate adapter (`two_rook_mate_research.py`) compares every legal starting
move to the published mate limit, rejects shorter forced mates and unrelated
mate routes within that limit, then certifies the displayed line against every
legal defensive reply. The certificate checks both rook roles in the displayed
mate and material recovery after defensive captures. Stockfish
provides a separate root comparison. The editorial review checks the two rook
roles, distinct defensive mechanisms, level, provenance, and Vietnamese copy.
Of the 38 new positions, 15 use the recorded finish and 23 use a verified
analysis line from the recorded position. The 10 previously reviewed B games
retain their original records and grades.

For the four C additions, the all-reply mate proof covers both acceptance and
other defences. The shown accepting branch needs both rooks. The root comparison
rules out a mate in the same number of moves without a sacrifice. Exchanges of
equal minor pieces do not count as sacrifices. For the four C\* additions, the
review records the shortest mate and the available continuations after every
first reply. Each sample shows a defence that requires a different response or
survives longer than a weaker choice. Inferior replies can allow an earlier
mate. All eight examples start from recorded game positions and show verified
analysis continuations alongside the complete original replays.

`collect-two-rook-games.py` searches recorded mating finishes;
`prepare-two-rook-resignations.py` prepares additional mating positions from
resigned games. Both use the previously collected local master-game corpora.
The collector checks legality, requires exactly two attacking rooks, and verifies
that both are indispensable to the final mating position: removing either rook
must eliminate checkmate. Sacrifices are assessed through the subsequent
material recovery, rather than treating an equal exchange as a sacrifice.

Candidate roots are searched with Stockfish at 400,000 nodes, and fresh searches
at 200,000 nodes check the remaining mate after each attacking move. Review uses
1,200,000 nodes at the root and 350,000 after attacking moves, checking shorter
solutions and grading again when necessary. These are finite engine checks,
not exhaustive proofs of every published position.

Four D examples produced inconsistent engine search results. Their saved lines
instead have bounded mate certificates in `mate-proofs/`: one winning attacking
move and every legal defensive reply at each node, terminating in actual
checkmate within the advertised bound. `two_rook_mate_proof.py` independently
verifies those trees without an engine, including membership of the displayed
solution. Original review failures and their resolutions are retained in
`master-resolved-reviews.json`. Other exclusions remain durable in
`master-excluded.json`; reviewed overrides are in `master-reviewed.json`.

## Publishing and validation

Use `scripts/research-tactics.py` with `--topic two-rook-mate` for indexed A/B/C/C\*
collection, exact tactical review and editorial packets. Publish through
`finish-batch` with `scripts/fixtures/two-rook-mate/expansion-evidence.json` and
the original scoped `--run-file`. The shared publication gate rehearses
`build-two-rook-master-games.py`, preserves existing games and owner data,
and exports the affected worksheet and answer pages for visual review.
The archived `composed.json` and `validation.json` retain historical evidence.
The A/B compositions cannot return to practice through either builder when the
approved expansion bundle is present.

The replacement run screened 10,952 indexed games in 291 seconds on its first
pass. A second 3,000-game pass with the direct mate-in-one route reused 3,043
engine results and made no new engine calls. Final tactical review compared
3,287 legal roots in 105 candidate positions; 47 candidates were withheld and
50 distinct source games reached the editorial packets. In a separate cold
benchmark on the same six positions and budgets, one worker took 4.84 seconds
and three took 1.95 seconds with identical findings. This comparison measures
the tactical review only. The full run ledger measured 56 minutes 6 seconds,
including 32 minutes 35 seconds outside named stages.

The six later Level A additions came from 75 eligible saved leads. The
shortlist contained 16 positions. Tactical review compared 512 legal starting
moves in 4.40 seconds with three workers. Nine positions reached independent
editorial review and six were selected. All six finishes were played in their
original games. Four are mates in one, two are mates in two, and each colour
solves three. No archives were rescanned for this batch. The full run took
6 minutes 3 seconds, including 2 minutes 50 seconds outside named stages.

The three later Level B additions came from 57 eligible saved leads. Tactical
review compared 755 legal starting moves across 26 candidates in 5.30 seconds
with three workers. Six reached editorial review. The recorded continuation of
one finalist received a separate exact review using cached engine analysis.
All three additions force mate in three. One uses the recorded finish and two
use verified analysis continuations. No archives were rescanned. The full run
took 7 minutes 12 seconds, including 2 minutes 53 seconds outside named stages.

For the C/C\* batch, the 10,914-game indexed pass reused 16,655 engine
results. Six additional PGN Mentor archives contributed 15,704 unique decisive
games to the index. A targeted pass screened 5,200 games from those sources in
215 seconds. The final tactical review compared 551 legal roots in 16
candidates, with 11 reaching editorial review and eight selected. In a cold
comparison on the same six positions and budgets, one worker took 5.43 seconds
and three took 2.51 seconds with identical findings. This comparison covers
tactical review only. The full run took 21 minutes 35 seconds, including
6 minutes 3 seconds outside named stages.

Run:

```sh
python3 scripts/test-two-rook-master-games.py
node --test scripts/test-two-rook-mate.cjs scripts/test-practice-access.cjs
npm run build
```

Tests replay original games and solutions, verify exact source positions and
previous moves, check actual mate and both-rook involvement, independently
verify certificates, enforce the A/B replacement and source counts and
provenance, and exercise shared trainer completion and private API access.

Saved alternative solutions are accepted by the shared trainer. Any legal
immediate checkmate is accepted even if absent from the saved lines. Unsaved preparatory moves now receive a bounded legal-move proof in the shared
trainer: one mating continuation must exist against every defensive reply,
within the remaining solver moves of the original sample. The search is limited
to 6,000 nodes and 150 ms; exceeding either limit leaves the move unverified,
not classified as incorrect. Verified lines supply the automatic reply and
subsequent hints. Completion requires reaching the mating position.

Regression: composed B lesson 10, FEN
`8/8/8/7K/8/4r3/4r3/3k4 b - - 0 1`, accepts
`Rg2 Kh4 Reg3 Kh5 Rh3#`. After `Reg3`, `Kh5` is the only legal reply;
`Rh3#` checks on the h-file while the other rook controls the g-file.
Run `node --test scripts/test-mate-alternatives.cjs` for this case, the
opposite color, inadequate remaining depth, an unsafe rook move, and stalemate.
This validates checkmate alternatives, not motif quality or material-winning
tactics; saved research and editorial grading are unchanged.
