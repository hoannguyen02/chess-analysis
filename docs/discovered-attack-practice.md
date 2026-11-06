# Discovered check and attack practice

`/discovered-attack` (and `/vi/discovered-attack`) is a private, noindex page.
It reuses `ChessPractice`, `DrawTrainer`, `PracticeBoard`, the timer,
full-screen mode, branch exploration, analysis link and `DrawGameViewer`.
Exercise and full-game APIs require the same access as `/fork`.

The active collection contains **125 positions**: 24 Beginner compositions
and **101 positions from distinct games**, after saved user removals, transfers
and level changes. Current counts are Beginner 24, A 24, B 24, C 22, C* 9,
D 22 as of 2026-11-05. The remaining count gaps are C: 2, C*: 15 and D: 2.
Including Beginner, there are 67 discovered checks and 58 discovered attacks.

The durable source bank retains 129 records, including three removed exercises
and one transferred to another topic. Five source-B records are shown at C*
under saved user decisions. These source records preserve review history and
reference games; they are not extra active B exercises. Builders read saved
decisions without rewriting them, and the protected API applies the authoritative
management rules to both practice and worksheet selection.

The topic filters are All, Discovered check and Discovered attack. Editorial
quality takes priority over the target of 24 positions per level. Every level must remain nonempty, but no rejected lesson is restored
to meet a quota. One game contributes one position; duplicate FENs are excluded.
The builder enforces these publication checks.

## Sources

Complete games come from the public [PGN Mentor archives](https://www.pgnmentor.com/files.html)
and [The Week in Chess](https://theweekinchess.com/zips/).
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


## Five new B exercises — 2026-11-04

Added five newly researched positions to the retained 19, bringing B to 24.
The preceding 19 exercises keep their order and content. Other levels retain
their previous counts and selections. These additions do not restore any
previously excluded game or shifted start of an excluded combination.

| B number | Stable game ID | Game | Distinct decision |
| --- | --- | --- | --- |
| 20 | `0953aa6625d2d073` | Queipo Caballero–Donkeng Hussel | Rook alignment, then a checking Bishop clearance; both interpositions leave the target Rook lost. |
| 21 | `044835b0f98dd68c` | Sasikiran–Angada H P | The discovery prevents the real Nxh3+ countercheck and Bishop capture before the Rook collects the Knight. |
| 22 | `471a7ac876440e16` | Lam–Van Wely | Quiet Queen alignment and attack on a Bishop, followed by Bishop clearance with check and a simultaneous attack on the Queen. |
| 23 | `b07069c015311028` | Yuffa–Nikitenko | Rook-and-Knight coordination; the correct Knight check depends on whether the King chooses d8 or f8. |
| 24 | `3ff01cfb3ddd4181` | Nepomniachtchi–Bjerre | Remove the Knight, drive the King, then clear the h-file for a verified mate in three solver moves. |

The search reused 7,877 complete games in the shared tactics index. The played
combination scan completed; a separate near-resignation scan stopped after 30
candidates, at 7,234 visited games. After deduplication, 40 source games were
independently reviewed. Early material gains, shorter independent captures,
pawn offers unsuitable for B, repeated windmills, incidental discoveries and
unresolved mating leads were rejected from this B batch. This is a focused
expansion, not an exhaustive search of all master games.

`level-b-expansion-20261104.json` keeps the five complete games, exact FENs,
source plies, preceding moves, source references, approved reasons and Vietnamese
copy. It distinguishes actual played continuations from teaching analysis and
contains the new mate proof and shorter-mate search result. The mate proof covers
every legal defensive reply; material checks use bounded engine analysis and
professional tactical review, not an exhaustive long-term proof.

`expansion-evidence.json#level-b-expansion-20261104-review` saves every legal starting-move comparison
at one million total MultiPV nodes, exact settings, local two-move material
shortcut checks, complete timelines and defensive probes at 500,000 nodes. It
records the initial material and editorial decision for every candidate. Starting
material is close enough for a meaningful contest in the four material examples.
The mating exercise starts with White far behind in material but with a concrete
forcing attack; its task is mate, and the line contains no sacrifice.

`expansion-evidence.json#level-b-expansion-20261104-sources` records archive URLs, SHA-256 checksums,
retrieval dates, archive/import counts, title evidence from source headers and
possible cross-topic index tags. Those tags remain unreviewed leads for other
pages. Raw corpus exports and disposable scan files stay outside the repository.
The new records are merged only through the approved curation path. The existing
exclusion and second-pass decisions remain effective.

The coverage map now includes Bishop movers in B through three different roles:
checking clearance, a discovered-check double threat, and mating clearance.
Queen and King clearance, two-square pawn discoveries, newly exposed pin benefits,
en passant and castling discoveries remain B coverage gaps; they are not claimed
covered by a move elsewhere in the solution. B has no position-count gap.
C still needs two positions, C* twenty, and D two under the current approved sets.

Regression checks enforce exactly five additions, preservation of all prior
exercises, full-game replay, checksums, explicit objectives, the Nxh3+ restriction,
all-reply mate proof, and all 24 B positions in worksheet export. Rebuild through
`curate-discovery-upper.py`, `build-discovery.py` and `discovery-coverage-report.py`.

## Nine new active B exercises — 2026-11-05

After the saved user decisions, B contained 15 active exercises. Nine newly
reviewed positions bring it to 24. The preceding 15 retain their order and
content. Three removals, five B-to-C* changes and the transfer to the exposed-King
topic remain effective. None of the earlier rejected games is restored.

| Active B number | Stable game ID | Game | Distinct decision |
| --- | --- | --- | --- |
| 16 | `92b22f0f4da6a18f` | Spassky–Boleslavsky | Clear two blockers from the Queen's file through equal minor-piece exchanges, then win a pawn. |
| 17 | `ae9d43b1c118dddb` | Anand–Gelfand | Put a protected Bishop onto its own Rook's rank with check, forcing the King into that rank before clearing it with a double threat. |
| 18 | `b5be9bfe50794952` | Stefansson–Karpov | Align the Bishop, then move its blocking Queen with check; account for the defender's recapture and win the exchange. |
| 19 | `bf1257225a89bff1` | Fischer–Janushkovsky | An attacked Bishop escapes with discovered check and attacks the Queen, preserving the tactical gain. |
| 20 | `309400c511b2bc0f` | Gledura–Kramnik | Drive the King onto a Knight-check square before clearing the Queen diagonal; immediate clearance would lose Black's own Queen. |
| 21 | `69dbb25d85019a1e` | Kramnik–Han Yichen | Quiet Rook alignment prepares a Bishop clearance with check; the second defending Rook limits the payoff to an exchange. |
| 22 | `28abfaf127a68955` | Fischer–Petrosian | A quiet King move establishes the mating net before a Rook clearance opens the Bishop's mating diagonal. |
| 23 | `8bc8a1916e336e16` | Short–Harikrishna | Meet check with an equal Rook exchange, then use discovered check to prevent a real pawn recapture of the Knight. |
| 24 | `02767676b9337285` | Riazantsev–Kramnik | Escape check before a Rook clearance creates a discovered-check double threat; include White's pawn capture in the net gain. |

All nine use three solver moves without a solving-side sacrifice. Equal
exchanges and the opponent's defensive material offers are distinguished from
sacrifices. Eight exercises have a material objective; Fischer–Petrosian has
a verified mate-in-three objective. Solutions explain relevant recaptures rather
than describing a won exchange as winning an intact Rook or Queen.

Research first reused the shared 7,877-game index and then replayed 2,131
deduplicated saved games. The expanded PGN Mentor search scanned 13,471 new
deduplicated eligible games from Fischer, Spassky, Karpov, Kramnik, Short and
Gelfand archives, completing both played-combination and near-resignation scans.
The Navara archive separately verified the complete original game for a local
lead that was withheld during final review. Sixty-three distinct candidates received root, shortcut and complete-line
review. Repetitive windmills, independent earlier gains, sacrifices, unsuitable
levels and unresolved superior mating leads were withheld.

`level-b-expansion-20261105.json` stores the nine approved complete games,
exact positions, moves, original plies, preceding moves, editorial decisions,
Vietnamese copy and the coverage checklist used before selection. Its baseline
records the 15 active B IDs and the saved-decision checksum. The source-bank B
limit is 33 so rebuilding preserves the nine managed records as well as the
24 active B exercises; `effectiveCounts` and gaps use the saved decisions.

`expansion-evidence.json#level-b-expansion-20261105-review` records all legal starting moves at one
million total MultiPV nodes, immediate-mate checks, bounded two-solver-move
material shortcuts, intermediate material balances and relevant defensive lines
at 500,000 nodes. These material checks and tactical review are finite evidence,
not exhaustive long-term proofs. The Fischer–Petrosian proof covers every legal
defensive reply within three solver moves (248 proof nodes); a separate all-reply
search excludes mate within two solver moves (546 nodes).

`expansion-evidence.json#level-b-expansion-20261105-sources` records URLs, archive checksums,
retrieval dates, parsing results and the role of every downloaded archive.
The one malformed Gelfand game was skipped and is not a published source.
Actual game continuations remain separate from teaching analysis, with full
games available through the shared viewer. Raw archives and disposable scan
caches remain outside the repository.

Final defensive review withheld Karpov–Timman (`bb8a2206e82c4bf6`) from B:
after Qf4+ Kh3 g4+, both Kh4 and fxg4 are legal. The latter accepts the offered
pawn before Qxh6+, so this is a simple-sacrifice lead for C review. Choosing
Kh4 in the sample line does not establish no-sacrifice B suitability.
Navara–Shahaliyev (`3e2ceb3919bb1a37`) was likewise withheld because Rh8+
allows Kxh8, accepting a Rook offer. A sample line declining a sacrifice is
insufficient evidence for B, even when automatic main-line grading reports none.

The active coverage map now includes Queen clearance, ordered double clearance,
checking escapes, clearance that must be prepared to protect the stationary
Queen, and defenses that expose a recapture restriction. Existing pawn
discoveries are preserved. King *preparation* is not counted as King *clearance*.
B still lacks verified King clearances, two-square pawn discoveries, discoveries
with a newly exposed pin benefit, en passant and castling. These are coverage
gaps, despite reaching 24; unsuitable examples are not added to fill them.

Regression checks replay all nine full games, preserve the earlier source data
and Beginner set, verify the mate certificates, and exercise the actual protected
API with saved management decisions. The worksheet check selects all 24 active B
positions, including the nine additions, and rejects a request for 25. The full
B worksheet and answer PDFs were rendered for layout and copy review.

## Two additions each to B and C — 2026-11-05 speed trial

The current owner decisions left B and C at 22 active positions each. Two
additions per level bring both to 24. Beginner and A remain at 24, C* at 10,
and D at 22. Every earlier exercise and saved full game is preserved exactly;
the Beginner file and all owner decisions are unchanged.

| Level | Stable game ID | Game | Additional decision |
| --- | --- | --- | --- |
| B | `eef5583eeab818c6` | Castillo Beitia–Wagener | Escape a Knight check, then use discovered check to put a Rook on a Knight-attacked square safely before capturing a pawn. A Knight interposition changes the winning capture. |
| B | `51b6258a7c5e5a7b` | Terry–Erigaisi | Two checking placements prepare a Queen discovery on the eighth rank; the check makes the f7-pawn's apparent recapture on e6 illegal. |
| C | `043fa99a6866848c` | Seirawan–Spassky | Quiet Queen alignment offers a stationary Rook, attracts a pawn to g6, and enables a double-check fork. Count the Bishop's subsequent recapture of the Knight. |
| C | `765f315a6674451f` | Maurizzi–Marjanovic | A Rook sacrifice relocates the King before a Knight clearance. Review the Queen interposition and final pawn recapture: the exchange is two Rooks for Queen and Knight. |

The B pair contains no solving-side sacrifice and the C pair contains one
simple sacrifice each, with three solver moves in each teaching line. The
Seirawan position was previously withheld from B specifically because a Rook
could be taken. Its C review records the legal `hxg6` capture of the stationary
Rook in the teaching analysis and preserves the automatic B inference as a review lead. A legal-replay
regression verifies this correction independently of the mover-only heuristic.
No owner removal or global exclusion is restored.

The two new manifests are `level-b-expansion-20261105b.json` and
`level-c-expansion-20261105.json`, with selected review evidence and source manifests stored by batch key in
`expansion-evidence.json`. They preserve complete games, source plies, preceding moves, archive
checksums, title evidence and the distinction between play and teaching analysis.
All-root comparisons, material shortcuts, strong defensive lines and recovery
checks remain required. The C payoffs include the relevant final recaptures:
the nominal gains are 180 cp and 220 cp, not an intact Queen in either example.
Finite engine evidence and tactical/editorial review are not exhaustive
long-term material proofs.

The trial reused the 21,348-game index. The serial collector produced twelve
leads and withheld 431 early; its observed process interval was about 11.2
minutes. Candidate review passes finished in seconds and subsequent reviews
reused cached analysis. The protected API and full worksheet selections were
checked at 24 positions for both levels. The four new diagrams and all answer
text were rendered through the shared PDF generator and visually inspected.

The [trial report](../scripts/fixtures/research-benchmark/discovery-b-c-extension-20261105.json)
records full-task timing separately from the saved review-pass metrics. This is
an actual content-extension trial, not a matched end-to-end comparison with
the older nine-position task. Serial game scanning and editorial selection
remain the main time costs; the earlier 5.91-times figure applies only to the
fixed automated-review benchmark. Level-specific King/two-square-pawn,
pin-benefit and special-move coverage gaps remain documented in
`second-pass-coverage.json`; reaching 24 does not imply complete coverage.

The parallel workflow review clarified Seirawan–Spassky provenance: the saved
original game continues `Rc6 Qg7 Kf2` at the exercise position. The published
`Qd4 hxg6 Nxg6+` solution is a teaching analysis. The earlier review phrase
calling `hxg6` played was corrected; the FEN, solution and complete original
game are unchanged.
