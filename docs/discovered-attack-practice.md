# Discovered check and attack practice

`/discovered-attack` (and `/vi/discovered-attack`) is a private, noindex page.
It reuses `ChessPractice`, `DrawTrainer`, `PracticeBoard`, the timer,
full-screen mode, branch exploration, analysis link and `DrawGameViewer`.
Exercise and full-game APIs require the same access as `/fork`.

The published collection contains **115 positions**: 24 Beginner compositions
and **91 positions from 91 distinct games**. Current counts are Beginner 24,
A 24, B 19, C 22, C* 4, D 22. The target remains 24 per level; the gaps are
shown explicitly after the second-pass review on 2026-10-29. Including Beginner,
there are 61 discovered checks and 54 discovered attacks.

The topic filters are All, Discovered check and Discovered attack. Editorial
quality takes priority over the target of 24 positions per level. Every level must remain nonempty, but no rejected lesson is restored
to meet a quota. One game contributes one position; duplicate FENs are excluded.
The builder enforces these publication checks.

## Sources

Complete games come from the public [PGN Mentor archives](https://www.pgnmentor.com/files.html).
Each record retains headers, archive URL, complete game, original game ply,
exercise FEN and preceding move. Archive SHA-256 checksums are recorded in
`scripts/fixtures/discovery/corpus-sources.json`. Analysis continuations may
differ from the actual game; the reference viewer always replays the original.

## Editorial selection

The discovery should explain why the tactic wins material: for example, the
revealed check prevents a recapture, or answering the newly revealed attack
costs more material. A capture that happens to reveal check is not, by itself,
a useful lesson in this motif. Prefer continuations that make that benefit
clear; mating discoveries remain useful too.

The 28 positions marked in the user's screenshot review were removed from
level A. `scripts/fixtures/discovery/excluded.json` preserves their game IDs,
positions, moves, original exercise numbers and screenshot order. These are
editorial exclusions, not claims that the moves are illegal or unsound.
The builder excludes these games even if they occur again in candidate files.
The automated tactical checks below do not replace this editorial criterion.

A follow-up editorial review covered all 43 original level A exercises 51–93.
It retained 35 and excluded eight: original numbers 53, 58, 60, 63, 64, 68,
69 and 86. `scripts/fixtures/discovery/level-a-review.json` records each
decision, its tactical reason, and immediate recapture candidates and legality.
Seven exclusions are captures of undefended material or ordinary favorable
exchanges; number 86 has an insufficiently clear discovery-dependent payoff
in its short published line. This review used board analysis and legal-move
checks, not a new engine evaluation. Original numbering is retained only for
review traceability; the interface numbers the remaining exercises normally.

A subsequent user review removed another 12 level A positions: numbers 11,
18, 26, 29, 32, 35, 37, 41, 50, 51, 53 and 56 in the then-current collection
of 57. The exclusion batch `follow-up-12-screenshots` records that numbering
context and screenshot order. It overrides ten earlier keep decisions in the
level A review; their original decisions and reasons are preserved under
`previousDecision`. The other two positions were outside that review's scope.

The earlier advanced-level review (superseded by the 2026-10-28 curation below) covered all 140 positions in B, C, C*, and D.
It removed 26 and retained 114:

| Level | Reviewed | Removed | Retained |
| --- | ---: | ---: | ---: |
| B | 55 | 14 | 41 |
| C | 39 | 0 | 39 |
| C* | 25 | 10 | 15 |
| D | 21 | 2 | 19 |

`scripts/fixtures/discovery/advanced-level-review.json` records each position,
original within-level number, decision, tactical rationale, and immediate
recapture candidates. Borderline positions also have local Stockfish probes
at 200,000 nodes with three variations. These finite searches support the
editorial review; a winning evaluation alone does not establish that the
discovery teaches a useful material-gain mechanism.

The review retains checking sacrifices that expose another valuable target,
checks that prevent recapture, and discoveries that move a piece to safety
with tempo before taking material. For example, original C*18 uses Ne4+
before Bxc1 to avoid Kxf2; original D8 uses Ra7+ before Bxf1 to avoid Kxf7.
Both immediate-capture alternatives and king recaptures were legally replayed.
Exclusions include ordinary undefended captures, favorable exchanges whose
recapture remains possible, and lines that stop before demonstrating a useful
discovered-check continuation. They are editorial judgments about the current
exercise, not claims that the full game lacks tactical interest.

## Tactical validation

The moving piece must be the sole blocker between a stationary friendly rook,
bishop or queen and an enemy target. After moving, that stationary piece must
newly attack the target. A newly revealed attack on the king is discovered
check (including double check); a non-king target is discovered attack.
A direct check by the moving piece alone does not qualify.

A line ends with either actual checkmate or a concrete material gain. Simply
opening an attack does not complete it. For a non-checking discovered attack,
the next capture must either take the revealed target with the stationary
piece, or be made by the moving piece after the defender moves that target.
For discovered check, either participating piece can make the payoff capture.

Stockfish screens at 12,000 nodes, examines three variations at 300,000 nodes,
and probes the defence again at 100,000 nodes after each solver move. The
selected root must score at least +150 cp and be within 40 cp of the best
searched root; defensive probes must retain at least +100 cp.

The builder also enumerates every legal reply immediately after the discovery.
Each reply must allow a participating piece to capture safely, retaining at
least a pawn of net material gain after any immediate legal response. For an
immediate capturing discovered check, the gain must survive every immediate
response. Stalemate and immediate mating counterattacks are rejected. These
local alternatives are saved for practice and branch exploration.

This is exhaustive local payoff checking, not an exhaustive proof of all
preparatory moves or an eventual game win. Engine searches are finite; other
good moves may exist. Suggested grades depend on the verified continuation:
A takes up to two solver moves, B takes three without sacrifice, C is a short
single-sacrifice sequence, C* takes four or five without sacrifice, and D
requires a sacrifice and more than three solver moves. Equal exchanges that
immediately restore material are not treated as sacrifices. Grades remain
open to review according to teaching difficulty.

## Reproduce

1. Prepare an archive with `scripts/prepare-pin-corpus.py`.
2. Run `python3 scripts/collect-discovery.py --phase tactics --extra-corpus CORPUS.json --output scripts/fixtures/discovery/CANDIDATES.json --target 20`.
3. Run `python3 scripts/build-discovery.py` to deduplicate and publish. It respects
   `excluded.json` and does not use its own published output as source input.
4. Run `python3 scripts/test-discovery.py` and
   `node --test scripts/test-discovery.cjs scripts/test-practice-access.cjs scripts/test-draw-game-viewer.cjs`.

The tests independently replay full games, verify exact FEN and source identity,
recheck motif, grading and response coverage, and exercise the shared completion
logic and protected data routes.

## Difficulty overrides

`scripts/fixtures/discovery/level-overrides.json` preserves user grading
choices by game ID and exact exercise FEN. Shirov–Czarnota and
Blackburne–Martin were moved from A to B at the user’s request.
Golmayo Zupide–Blackburne, Shirov–Quinones and Anderssen–Kolisch were moved
from A to C* at the user’s request. Chigorin–Hruby was moved from A to C.
Morozevich–Remizov was moved from B to C*, and Caruana–Aronian from B to C. The builder
applies overrides after candidate selection and preserves the inferred grade
for tactical validation. Their positions and solution lines are unchanged.

## Beginner compositions — curated 2026-10-28

The user requested a full review of the 42-position Beginner collection and
exactly 24 varied positions. All 42 were reviewed; 18 were excluded as repetitive.
The published set has 13 discovered checks and 11 discovered attacks,
with 12 positions for each side. A–D master-game data is unchanged.

Duplication was judged by the decision and defensive mechanism, not merely
identical FENs. Mirrored colors, shifted squares and changed targets do not
justify automatic pairs. Retained related examples have explicit distinctions
in `scripts/fixtures/discovery/beginner-curation.json`; the order interleaves
ideas rather than grouping near-identical boards. Original position 25 was
removed. Original 26 is the single straightforward pawn-push/skewer example;
original 27 is retained separately because c4+ avoids Kxc3, possible after c3+.
They now appear at positions 5 and 20, not as a run of four similar examples.

| Coverage | Current exercise numbers |
| --- | --- |
| Knight, Bishop and Rook relocations | 1–4, 7–8, 10–11, 13–14, 16, 24 |
| One-square pawn advance | 5 |
| Pawn capture with check / quiet capture uncovering a pin | 6 / 9 |
| Queen as revealed attacker | 12, 15 |
| King vacates a line | 17 |
| Bishop captures while uncovering check | 18 |
| Quiet discovery creates two material threats | 19 |
| Two-square pawn advance avoiding capture | 20 |
| Knight captures while uncovering a pin | 21 |
| Double check with different cooperating pieces | 15, 22 |
| Queen vacates a line with check | 23 |

The set retains all nine previously added coverage areas, without requiring
both colors for each area. Special-move constructions involving en passant,
castling or promotion remain documented gaps, not a claim of complete coverage.

All retained positions preserve their exact FEN, objective, main moves and
accepted alternatives. Titles are renumbered to the displayed order. Where the
main continuation permits a material recovery, the solution explicitly gives
the defensive capture and explains the resulting exchange. A material gain is
not described as an intact piece gain or a won game. Source positions are
compositions; no invented master-game provenance is attached.

### Durable review and rebuilds

- `beginner-candidates.json` archives all 42 original exercises and their
  tactical evidence, keyed by stable IDs.
- `beginner-curation.json` records the exact FEN and moves, a specific keep/remove
  reason for every candidate, representative retained IDs for exclusions,
  solution clarifications and the 24-ID publishing order.
- `beginner-curation-engine.json` records fresh Stockfish all-root MultiPV
  screening at 200,000 nodes for each of the 42 positions.
- `beginner-review.json` contains the published 24 reviews, retaining original
  stable IDs independently of the new display numbers.

`python3 scripts/discovery_beginner_curation.py` publishes only the selected
IDs. Both `build-discovery-beginner.py` and `extend-discovery-beginner.py` honor
this manifest; rebuilding cannot refill excluded color pairs or expand to 42.
Changing the selection requires an explicit editorial update to the manifest.

### Validation

`python3 scripts/test-discovery-beginner.py` independently replays all 42 source
candidates, checking all legal starting moves, local material gains against
every legal defence and immediate recapture, and forced mate within two solver
moves. Starting captures may not bypass the motif. The published selection
also checks the 24-position count, both sides, retained coverage, exclusions,
renumbering and byte-identical output from both legacy rebuild commands.
Finite engine screening and local exhaustive checks do not prove uniqueness
or exclude every deeper tactic.

Run `node scripts/audit-worksheet-copy.cjs` and
`node --test scripts/test-discovery.cjs scripts/test-worksheets.cjs scripts/test-practice-access.cjs`.
The shared trainer accepts the saved alternative continuations; the protected
API, level selector and worksheet planner all use the same 24 positions.
Rendered worksheets and answers are inspected after prose/count changes.

## Level A curation — 2026-10-28

Reviewed all 39 Level A master-game positions and selected exactly 24. The
15 exclusions include repetitive mechanisms, simpler non-discovery captures,
incidental discoveries where the target was already undefended, and two
positions requiring a sacrifice against a relevant defence. The selection
has 20 discovered checks and four discovered attacks, including four immediate
mates. Both sides and Pawn, Knight, Bishop, Rook and Queen movers are represented;
Bishops, Rooks and Queens serve as the stationary attacker.

The order interleaves ideas. Current exercise numbers:

| Idea | Exercises |
| --- | --- |
| Capture uncovering check and preventing recapture | 1, 2, 4, 6, 7, 9, 11, 13, 16, 18, 21 |
| Direct Bishop/Queen check opening a material attack | 3, 10, 17 |
| Quiet Queen exchange opening a Bishop attack | 5 |
| Different immediate mating discoveries | 8, 12, 15, 19 |
| Quiet Knight setup uncovering check, then Queen capture | 14, 20, 23 |
| Two successive discoveries by different Bishops | 22 |
| Bishop relocation uncovering Queen check, then winning the exchange | 24 |

Related cases are retained only for a concrete distinction: different prevented
recaptures, a secondary threat, or winning a whole piece versus an exchange.
There are no forced color pairs. No quiet pawn-advance or King-clearance example
survived in this master-game pool, and special-move discoveries remain gaps.
These were not filled by relabeling harder examples or retaining incidental motifs.

`level-a-candidates.json` retains the original 39 records, exact FENs, solutions,
full legal games and provenance. `level-a-curation.json` records every keep/remove
decision, the 24-ID order, coverage gaps and reviewed Vietnamese copy.
`excluded.json` preserves rejected IDs under `level-a-variety-24-2026-10-28`.
The latest curation supersedes earlier keep decisions without rewriting their
historical review evidence. The builder enforces both exclusions and the fixed
selection after difficulty overrides. Beginner and B–D data remain unchanged.

`review-discovery-level-a.py` checks every legal starting move of all 39 sources
for immediate mate, forced mate within two solver moves against every defence,
and immediate material gain surviving every reply. It rechecks all saved
payoff defence branches and records 300,000-node all-root Stockfish MultiPV in
`level-a-curation-analysis.json`. Removing the stationary checker also exposes
whether a normal recapture exists; this rejected the incidental captures in
original 11, 12 and 16. An engine score is not a forced-mate proof.

`level-a-root-followup.json` records one-million-node searches of original
34's Nf2+, Ng5+ and Nf4+: the first two return to the same Nf4+ combination after
extra checks. Their initially higher shallow scores do not establish a simpler
superior payoff. Longer engine mating indications are distinct from the stated
short material objective and from a verified mate within its move limit.

The published data now explicitly labels each selected objective. Immediate-mate
positions use the shared checkmate alternative verifier; all legal immediate
mates are also saved, including the several Bishop moves in Pijpers–Shirov.
Material lines retain their original moves and defensive alternatives. Copy
explains recaptures and net exchanges without claiming every captured piece is
won intact. Full source games and source ply remain available in DrawGameViewer.

Rebuild with `python3 scripts/build-discovery.py`; validate with
`python3 scripts/test-discovery.py`, `node scripts/audit-worksheet-copy.cjs`, and
`node --test scripts/test-discovery.cjs scripts/test-mate-alternatives.cjs scripts/test-worksheets.cjs scripts/test-practice-access.cjs`.
The worksheet regression selects all 24 A exercises and rejects a request for
25. Rendered exercise and answer PDFs are inspected after count/copy changes.


## B, C, C* and D curation — 2026-10-28

Reviewed all 120 previously published upper-level positions and 106 replacement
candidates from saved master games and local PGN Mentor archives. The final set
has **24 positions per level**, with 64 retained sources and 32 newly selected
sources. There are 56 durable exclusions from the previous published set.
Beginner and A are unchanged. No game or FEN is counted twice.

| Final level | Retained sources, including regrading | New sources | Total |
| --- | ---: | ---: | ---: |
| B | 17 | 7 | 24 |
| C | 24 | 0 | 24 |
| C* | 9 | 15 | 24 |
| D | 14 | 10 | 24 |

Selection covers pawn advances and captures, promotion, exchanges, quiet
preparation, direct and discovered checks, non-checking attacks, different
stationary sliders, and mating discoveries. B includes Bishop, Knight, Rook and
Pawn movers; C and C* also include Queen clearance. Advanced King moves occur
in preparation. This does not claim every special move or a King-uncovering
move is represented in every level. En passant and castling discoveries remain
coverage gaps rather than forced filler. The order interleaves moving pieces
and attack types, avoiding long runs of the same diagram mechanism.

Manual sacrifice review corrects limitations of the historical miner. Three
former B positions move to C: the Bishop offer in Shabalov–Hecht, the pawn offer
in Meshkovs–Shirov, and the stationary Queen offer in Shabalov–Brown. Polgar–San
Segundo moves from C* to D because Bxd1 accepts a Rook sacrifice before the
longer recovery. Two new sources likewise belong in D: Movsesian's stationary
Rook offer and Shirov's f6 pawn offer. Equal immediate exchanges remain distinct
from these sacrifices. The original inferred classification is retained for
reproducibility; `upper-curation.json` stores the reviewed level and rationale.

`upper-candidates.json` preserves the complete original 120 records.
`upper-research.json` retains replacement games, exact source plies, provenance
and engine continuations; `upper-research-scope.json` records corpus scope and
ZIP checksums. These files are durable review evidence, not disposable caches.
`upper-curation.json` contains every decision, exact FEN and solution, final
24-ID order, coverage tags, explicit objective and Vietnamese explanation.
The builder applies this allowlist after grading overrides, so adding research
cannot silently publish unreviewed examples. Exclusions use batch
`upper-variety-2026-10-28`; historical decisions remain available.

`review-discovery-upper.py` screens every legal starting move for immediate
mate, mate within two solver moves against every reply, and safe immediate
material captures; it records finite all-root Stockfish searches and preparation
defences. `check-discovery-shortcuts.py` additionally checks bounded two-move
material gains against every immediate reply and recapture. These local material
checks and finite engine probes are not exhaustive long-term tactical proofs.
The review rejects early material gains before the named discovery, shorter
non-sacrificial routes, incidental motifs, repetition, and unresolved stronger
mating leads rather than treating a high evaluation as proof of the objective.

All six upper-level mating exercises have exhaustive proofs within their saved
solver-move limits in `upper-mate-proofs.json`. Searches at one fewer solver
move found no mate in all six cases (`upper-shorter-mates.json`). The builder
exports every defensive branch from each proof into the shared trainer's
alternative lines and sets the explicit checkmate objective. Material-winning
positions retain local payoff branches and their material objective.

Reproduce the editorial selection with `python3 scripts/curate-discovery-upper.py`,
then rebuild with `python3 scripts/build-discovery.py`. The Python tests verify
counts, exact positions, complete legal source games, local defensive coverage,
proof trees, level assignments and deterministic rebuilding. Worksheet tests
select all 24 positions in each level and reject 25. Run the discovery,
Beginner, worksheet-copy, worksheet, mate-alternative and practice-access checks;
inspect both worksheet and answer PDF renderings after changes to copy or order.


## User correction — 2026-10-29

Removed Muradli–Aronian (`9f0cc28d5b4447d5`), formerly Discovery B #2,
from publication at the user's request. Its saved line is Rad8 Rc2 Nf2+
Kc1 Bxc2. The user rejected its instructional suitability for B; no pin
benefit is asserted as a reason to retain it. The exact FEN, continuation
and exclusion remain in the curation data and are covered by a regression
test. The October 28 selection above is historical: current B has 23,
with a one-position gap. Do not restore this exercise to meet the quota.

Apply the standing AGENTS.md criteria before approving a position; passing
legal-replay tests and reaching 24 do not establish instructional suitability.


## Full second pass — 2026-10-29

Reviewed all 95 then-published positions in B, C, C*, D, after the separate
Muradli–Aronian exclusion. Removed 28 more positions and retained 67:

| Level | Reviewed | Removed | Remaining | Gap to 24 |
| --- | ---: | ---: | ---: | ---: |
| B | 23 | 4 | 19 | 5 |
| C | 24 | 2 | 22 | 2 |
| C* | 24 | 20 | 4 | 20 |
| D | 24 | 2 | 22 | 2 |

The previous count of 24 did not establish either coverage or suitability.
In particular, four-move C* lines were only one solver move beyond this B
collection's three-move lines. They are withheld from C* because the required
two-to-three-move increase in calculation has not been established. They have
not been padded or automatically reassigned to another level. Several also
fail the independent-payoff review. This does not assert that the withheld
positions are tactically unsound.

The new audit checks every solver position, including the discovery itself,
instead of stopping the early-payoff check immediately before it. This catches
Shirov–Gryshko: Nxe7+ wins the Queen by direct Knight check, while the discovered
Rook attack merely adds Rxc7. Similarly, exf5+ in Shirov–Grabarczyk has already
captured a Rook for the sacrificed Bishop before the Queen collects the
revealed target. Both D exercises are excluded. Queen preparation followed by
Knight clearance and a back-rank Rook capture no longer occupies three
consecutive B slots. Reversed or shifted checking-sacrifice examples in C and
repeated windmills in B are removed without claiming that a different moving
piece alone establishes an additional teaching decision.

`second-pass-candidates.json` preserves the exact 95 positions and full games.
`second-pass-analysis.json` records all legal roots at one million total MultiPV
nodes and every solver step with up to three defensive engine lines at 500,000
nodes. `second-pass-independent-payoffs.json` records follow-up probes excluding
the next revealed-target capture. These are finite engine probes and local
material checks, not exhaustive long-term material proofs. Engine mating
indications are review leads, not verified forced-mate claims.

`second-pass-curation.json` records every keep/remove decision, old number,
exact FEN, solution and previous rationale. It overrides the first curation;
exclusions use `second-pass-2026-10-29`. Three upper-level mating exercises remain
in B, with the previously checked all-reply proofs and shorter-mate searches.
Beginner and A are unchanged.

`second-pass-coverage.json` maps each level separately to stable exercise IDs:
all moving pieces, stationary sliders and targets, sides, pawn advances and
captures, checks/double checks, non-checking attacks, ranks/files/diagonals,
recapture restrictions, newly created absolute pins, and special moves. It
separates promotion in the line from a promotion that itself uncovers an attack.
Preparatory King moves do not count as King clearance. Missing aspects are
explicit gaps, not implied coverage from another level. All four levels lack
verified King-clearance, en-passant and castling discoveries; the reduced C*
collection has additional gaps, including no White-to-move example. These
are unresolved gaps, not a claim that the current four exercises form a balanced
C* collection. A geometric pin tag does not establish that
the payoff depends on the pin. Do not force missing aspects into unsuitable
positions or restore rejected exercises to fill the target count.

Rebuild with `python3 scripts/curate-discovery-upper.py`, then
`python3 scripts/build-discovery.py` and `python3 scripts/discovery-coverage-report.py`.
Regression tests enforce every second-pass exclusion, C* depth, counts, exact
coverage mappings and defensive/mate verification. Coverage changes require an
explicit review rather than silently dropping an approved aspect. The worksheet
planner exports each level's actual count and rejects requests above it.

The final advanced follow-up (`second-pass-shorter-lines.json`) probes the five
best engine roots at two million nodes for retained C*/D exercises, looking for
shorter A/B/C-length motif payoffs with local defensive coverage. No such lead
was found in that bounded probe; this does not prove uniqueness or exclude
every possible shorter continuation.
