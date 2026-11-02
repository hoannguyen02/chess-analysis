# Two-rook checkmate practice

`/two-rook-mate` (including `/vi/two-rook-mate`) is a private, noindex page
listed in the private hub. Protected exercise and reference-game endpoints
supply 138 exercises and 78 distinct original games saved locally.

| Level    | Composed | Master games | Total |
| -------- | -------: | -----------: | ----: |
| Beginner |       20 |            0 |    20 |
| A        |       20 |            0 |    20 |
| B        |       20 |           10 |    30 |
| C        |        0 |           22 |    22 |
| C\*      |        0 |           22 |    22 |
| D        |        0 |           24 |    24 |

The approved 60 composed exercises are preserved in
`scripts/fixtures/two-rook-mate/composed.json`. Beginner covers direct mate in
one, A covers direct coordination in two moves, and B covers short ladder
coordination. Master-game B additions require short preparation without a
sacrifice. C requires a simple sacrifice, C\* requires deeper calculation without
a sacrifice, and D requires a queen sacrifice or multiple sacrifices over more
than three solver moves. These are combination-based editorial grades, not
move-count-only difficulty ratings.

Every exercise identifies the starting side and checkmate objective. The page
reuses `ChessPractice`, `DrawTrainer`, and `PracticeBoard`, including fullscreen,
timer, hints, analysis, and branch exploration. Reference games open in the
shared `DrawGameViewer`. Composed exercises do not display a game button.

## Research and provenance

The master positions come from 36 cached public PGN Mentor archives. Archive
URLs and SHA-256 checksums are retained in `master-corpus-sources.json`. Each
published record retains its exact FEN, previous move, source ply, complete
original game, headers, stable game identifier, solution and review evidence.
The exercise's analyzed continuation can differ from the recorded game,
particularly when the original game ended in resignation. Original-game replay
always shows the recorded moves.

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

`python3 scripts/build-two-rook-master-games.py` merges the approved composed
snapshot with reviewed master records, verifies the motif and any certificates,
and writes the exercise JSON, local source games, and publication manifest.
`python3 scripts/build-two-rook-mate.py --regrade` reapplies composed grades and
then merges master records when present, so it does not erase researched games.
The composed generator's original engine evidence remains in `validation.json`.

Run:

```sh
python3 scripts/test-two-rook-master-games.py
node --test scripts/test-two-rook-mate.cjs scripts/test-practice-access.cjs
npm run build
```

Tests replay original games and solutions, verify exact source positions and
previous moves, check actual mate and both-rook involvement, independently
verify certificates, preserve the composed exercises, enforce counts and
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
