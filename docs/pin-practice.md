# Pin practice

`/pin` and `/vi/pin` reuse the private access, shared trainer, board, timer,
full-screen mode, branch exploration and original-game dialog from skewer
practice. Authorized APIs serve the exercises and original games separately;
the static page contains neither dataset.

## Published collection

Current real-game counts: **A 20 · B 74 · C 39 · C* 67 · D 21**
(**221 distinct games**), plus 24 Beginner exercises, fifteen composed exercises in A and two composed exercises in C. Published level A now has 35 positions (20 master-game positions and fifteen compositions). Published level C now has 41 positions (39 master-game positions and two compositions).

- **24 beginner exercises**: twenty-three pin-creation positions and one composed pinned-defender position. The original 60
  recognition-only positions were audited on 2026-10-25; 52 were removed,
  including the three reported positions. All 30 original relative-pin recognition
  positions failed the immediate material-win criterion. The new reviewed
  relative-pin exercises use a concrete capture and recapture payoff instead;
  all retained compositions share the single Beginner tab.
- Beginner ordering is saved in `scripts/fixtures/pin/beginner-order.json`.
  The twenty retained positions mix pin creation with concrete defender-pin payoffs; the original ten retain their order, followed by ten new exercises.
- The original 20-position review is recorded in
  `scripts/fixtures/pin/beginner-quality-review.json`. Ten examples are now
  excluded, including the earlier four screenshots and the newly reported pawn
  position. The previous review incorrectly treated a larger immediate pin gain
  as sufficient reason to keep a simpler competing direct gain.
- `scripts/fixtures/pin/beginner-benefit-review.json` records the complete
  re-review of all twelve survivors: exact FENs, primary and alternative lines,
  decisions, and fresh 60,000-node Stockfish probes of all legal initial captures
  plus each saved root. The pawn example is removed because `Rxe5+` already
  wins a pawn safely with check. The rook example is removed because `Bxe4+`
  wins at least the exchange after `Kxe4`. A smaller direct gain still defeats
  the purpose of these introductory exercises. Both exclusions are durable.
- The re-review initially left ten exercises, ten below the minimum target.
  The subsequent verified expansion below brings the total to twenty. The six pin-creation examples
  restrict knight escape; the original four defender-pin examples prevent a recapture
  or make it lose a more valuable piece. Their direct captures and all stored
  branches were rechecked. Engine probes are bounded supporting evidence,
  not exhaustive proofs. The 221 master-game exercises were not changed by
  this Beginner re-review.
- The builder checks that retained defender-pin compositions do not offer a
  profitable immediate capture of the pinned piece by its pinner, even when
  that gain is smaller than the saved solution. This regression guard supplements
  the per-position editorial review; it does not replace it.
- Each of the six retained pin-creation roots must win material on the solver's next turn
  against **every legal opponent response**. Every response and safe capture
  is saved as a three-ply branch. All legal replies after the capture are also
  checked for material recovery and checkmate. Creating a pin alone no longer
  completes an exercise. The rejected roots and escape replies are retained
  in `scripts/fixtures/pin/beginner-audit.json`; regeneration repeats the audit.
- The real-game collection must contain **at least 20 distinct games in each
  level A, B, C, C*, D**. The builder and both validation suites enforce this
  minimum independently of the beginner compositions. One game contributes
  only one exercise across the entire collection.
- The collection covers captures of pinned pieces, captures exploiting pinned
  defenders, and relative pins to higher-value pieces. A pin-dependent mating
  line is labeled with a checkmate goal instead of a material-win goal.

Each master exercise retains its starting FEN, preceding position and move,
full original game, player/event/date headers, original-game ply marker and
source URL. The saved tactical variation may differ from the moves played;
those two lines are never combined in the original-game viewer.

## Research sources and selection

The complete-game corpus is from [PGN Mentor](https://www.pgnmentor.com/files.html).
The collector examines full games retained in the existing source archives,
not merely the former skewer exercise positions. It finds new pin-specific
starting positions and performs fresh Stockfish searches. Supplementary scans
look for pin payoffs in played moves and also examine positions before
resignation, where the tactical continuation may not have been played. One exercise per
game and unique starting positions prevent repetition from inflating counts.

Supplementary full-game archives include Alekhine, Tal, Kasparov, Keres,
Bronstein, Shirov, Anderssen, Blackburne, Marshall, Polgar, Nunn, Ivanchuk,
Morozevich and others. URLs, SHA-256 checksums and eligible-game counts are
retained in `scripts/fixtures/pin/corpus-sources.json`. Exact source URLs and
full move lists are retained per accepted record in `researched.json`.
Lichess puzzle endpoints were investigated, but their truncated game snippets
were not used as substitutes for full original games.

Conceptual references: [Chess.com, Pin](https://www.chess.com/terms/pin-chess)
and [FIDE teaching curriculum](https://www.fide.com/docs/presentations/Curriculum%20Chess%20for%20Refugees.pdf).
Relative pins do not make a move illegal. Absolute pins prohibit moves that
expose the king, but a piece can sometimes move along the pin line. Beginner
positions are original compositions, not copied exercises.

## Validation and grading

`collect-pins.py` uses Stockfish 17, one thread and 128 MB hash:

1. Replay the source game; verify FEN and game identity from the complete UCI
   sequence. Find candidate positions near absolute or relative pins.
2. Probe at 12,000 nodes, then search three principal variations at 300,000
   nodes. Accept a pin line scoring at least +150 cp for the solver and no
   more than 40 cp below the strongest searched line.
3. Verify the pin's concrete effect. A different piece captures the pinned
   piece, or an otherwise pseudo-legal recapture is illegal because it exposes
   the defender's king. Relative-pin captures require a lower-value front piece
   pinned to a higher-value rear piece and a distinct capturing piece. A merely
   decorative pin is insufficient.
4. Require at least one pawn's net material gain, both from the start and
   around the final tactical capture, including the next two PV plies. A mating
   goal instead requires actual checkmate and a pinned defender whose otherwise
   pseudo-legal capture of the mating piece would expose its own king.
5. After every solver move, run a fresh 100,000-node defensive search. Reject
   lines whose solver evaluation falls below +100 cp. Retain the scores/PVs.

Finite engine searches are evidence, not exhaustive proofs or uniqueness
claims. Alternative saved root lines meet the same root score/motif threshold;
independent per-move defence probes are recorded for the primary line. Unstored
moves continue to receive the shared trainer's unverified-move treatment.

Grades remain suggestions: A is one or two solver moves, B three, C* four or
five without a sacrifice. C uses one temporary piece offer in at most three
solver moves. D requires more than three solver moves and multiple offers or
a rook/queen offer. Ordinary equal exchanges recouped immediately do not count
as sacrifices. A deliberate offer can count even if its tactical payoff follows
immediately. Existing skewer grades and manual overrides are untouched.

## Reproduce

- `python3 scripts/collect-pins.py --phase seeds`
- `python3 scripts/collect-pins.py --phase games`
- For a downloaded archive:
  `python3 scripts/prepare-pin-corpus.py ARCHIVE.zip --name Alekhine --output CORPUS.json`
  then `collect-pins.py --phase games --extra-corpus CORPUS.json --output OUTPUT.json`.
  Supplementary outputs must be reviewed/deduplicated before publication.
- `python3 scripts/merge-pin-research.py SUPPLEMENT.json ...` rechecks motif
  and grade evidence, deduplicates games/positions, and refuses to merge a
  collection below the per-level quota. Existing canonical records take priority.
- `python3 scripts/build-pins.py` publishes the canonical researched records
  and regenerates/audits the beginner set, enforcing the real-game quota.
- `python3 scripts/test-pin-pipeline.py` independently replays the records and
  checks stored motif, grading and engine-evidence invariants.
- `node --test scripts/test-pins.cjs scripts/test-practice-access.cjs scripts/test-draw-game-viewer.cjs`
  verifies legal chess.js replay, exact original-game positions, trainer
  completion, beginner geometry, source-viewer integration and authorization.

`engine-check.json` is historical evidence for the initial seven-game sample;
current publication uses the fresh evidence in `researched.json` instead.

## Editorial exclusions

`excluded.json` records user-rejected games. Burn–Pillsbury (Paris 1900) and
Tarrasch–Reggio (Monte Carlo 1903) were removed on 2026-10-25 as unsuitable
examples for the requested immediate pin payoff. Collection, merging and
publication all honor these exclusions, even when importing older research.

Ten further level-A positions were removed on 2026-10-25 at user request:
Navara–Koziak, Motylev–Naiditsch, Alekhine–Capablanca, Martinovic–Anand,
Chigorin–Tinsley, Ljubojevic–Short, Carlsen–Karpov, Karabalis–Movsesian,
Ivkov–Bronstein and Euwe–Alekhine. Their exact game IDs and starting FENs
are retained in `excluded.json` to prevent reintroduction.

## Editorial level overrides

`scripts/fixtures/pin/level-overrides.json` stores
publication grades separately from the automatic research grades. On 2026-10-25,
Reshevsky–Book (1952), Mestel–Polugaevsky (1990), and Byrne–Smyslov (1968)
were moved from A to C at user request. The builder applies these overrides
before sorting and checking published level counts.

On 2026-10-25, Illescas Cordoba–Polugaevsky (1991), Napier–Teichmann (1905),
Ding Liren–Carlsen (2017), Spielmann–Rubinstein (1911), and
Bologan–Rakhmanov (2015) were moved from A to B at user request, using
the same publication overrides.

On 2026-10-25, Bologan–Riazantsev (European Blitz 2016) was moved
from A to C* at user request using a publication override.

Two additional beginner bishop positions (previously 3/8 and 7/8) were
removed at user request on 2026-10-25. `beginner-excluded.json` preserves
their FENs; the builder records their editorial exclusion in the beginner audit
and omits them from publication, leaving six beginner exercises.

## Beginner expansion — 2026-10-27 (historical, before exclusions)

The initial expansion contained 20 composed positions: the six retained
pin-creation exercises plus fourteen reviewed defender-pin exercises. The new
positions include pinned queens, rooks, bishops, knights and a pawn; eight are
pins to the king, four to a queen and two to a rook. Seven new positions use
Black to move. Previously excluded compositions remain excluded.

`scripts/fixtures/pin/beginner-reviewed.json` retains stable IDs, exact FENs,
complete saved lines, pin geometry, editorial reasoning and Stockfish evidence.
`python3 scripts/review-pin-beginners.py` checks the defender restriction,
every legal reply for the three-ply exercises, and immediate material recovery.
Add `--engine` to repeat 30,000-node probes of every saved endpoint, including
eight further principal-variation plies. These bounded probes are evidence,
not an exhaustive long-term proof. Material gain is measured from the starting
position, not inferred from a winning evaluation. The six earlier compositions
retain their existing exhaustive short-horizon verification.

The new source copy identifies the compositions, gives an explicit material
objective, and explains relative pins without claiming the pinned piece cannot
legally move. The shared worksheet source initially included all twenty positions; it now contains the twenty retained positions described above.

## Essential-pin expansion — 2026-10-27

Ten new six-piece compositions bring Beginner to **20**; the previous ten
are unchanged and all rejected positions remain excluded. Five new exercises
use White to move and five use Black. Each asks for one capture exploiting a
pawn, knight or bishop pinned to its king. These are original compositions,
not master-game positions. The goal is material gain, not necessarily a won
position or checkmate.

Stable IDs `pin-beginner-essential-20261027-01` through `-10` are stored in
`beginner-reviewed.json`. Every target has exactly one defending piece, which
cannot recapture because of the pin. Removing the pinning piece makes that
recapture legal and produces an unfavorable material trade for the solver.
All immediate defensive replies to the published capture retain a material
gain. Each reply additionally has a fresh 80,000-node Stockfish probe and eight
further PV plies recorded. All initial captures and checks have 200,000-node
probes and explicit immediate material-recovery evidence. These finite probes
support the editorial review; they do not prove all future endgame play.

The selection also examined multi-move bypasses. One otherwise plausible
bishop composition was rejected because `Bxg6+ Kxg6 Bxe7` wins a net 90 cp of
material without exploiting the pin. Its exact FEN and bypass are in the
exclusion file. No mirror duplicates of existing exercises were added.

The builder rechecks geometry, legal replies, material recovery and the direct
capture editorial guard. Regression tests cover all ten counterfactual
recaptures, both colors and complete defensive-probe coverage. The existing
protected worksheet source automatically includes all twenty Beginner
positions; A–D and all master-game provenance are unchanged.

## User-requested move to C — 2026-10-27

“Mã bị ghim vào Hậu” (`pin-beginner-20261027-11`, FEN
`8/8/4K3/q3n2R/3Q2n1/8/P1k5/8 w - - 0 1`) now belongs to C.
The example `Qxg4 Nxg4 Rxa5` offers the queen to exploit the relative pin.
`publicationDifficulty` on its reviewed record makes this classification durable;
the builder removes its Beginner flags only in the published output. The source
position, all defensive continuations, objective and composed provenance remain
unchanged. Interactive and PDF selection use the same output: Beginner 19, C 40.
Earlier 20-position expansion counts above describe the set before this move.

## Five further Beginner positions — 2026-10-27

Added `pin-beginner-essential-20261027-11` through `-15`, bringing Beginner
from 19 to 24. Three use White to move and two Black. Each has six pieces and
a one-move material gain, using a pinned bishop (two examples), rook, pawn or
knight. Existing positions and the user-requested C assignment are preserved.

The exact geometry, counterfactual legal recapture after removing the pinner,
all defensive replies, and engine evidence are stored in `beginner-reviewed.json`.
Initial captures and checks were probed at 200,000 nodes with ten continuation
plies; every reply after the solution was probed at 80,000 nodes with eight
continuation plies. Direct captures of the defender do not offer a simpler
positive material gain. These finite probes support, rather than replace,
editorial review. The positions are distinct compositions, not mirrored copies
of existing or excluded exercises. Shared interactive and PDF data include all five.

## Bishop relative-pin assignment to C — 2026-10-27

At the user's request, “Tượng bị ghim vào Hậu”
(`pin-beginner-20261027-10`, FEN
`K7/1p2k3/1Q2B2r/8/8/5q1N/8/8 b - - 0 1`) moves from Beginner to C.
The example `Qxh3 Bxh3 Rxb6` offers the queen, then recovers the opposing
queen behind the bishop. Its durable `publicationDifficulty` retains the
position, all saved continuations, objective and provenance. Current counts
are Beginner 23 and C 41; earlier counts above describe prior revisions.

## User-requested knight-pin removal — 2026-10-27

Removed “Mã bị ghim vào Vua” (`pin-beginner-20261027-07`), FEN
`2k5/1n6/B7/p7/8/Q7/6K1/8 w - - 0 1`, with solution `Qxa5`.
The exclusion supersedes its earlier retain decision and prevents regeneration.
Beginner now has 22 positions; C remains at 41.

## Screenshot assignments to A — 2026-10-27

Using the user's original 24-position numbering, positions 6, 10, 11 and
14–24 move to A (14 unique positions; 18 is counted once). Exact IDs, FENs,
solutions and screenshot numbers are in `user-level-a-20261027.json`.
The existing `publicationDifficulty` mechanism preserves these assignments
for practice and worksheets. No positions, solutions, exclusions or prior C
assignments changed. Current counts: Beginner 8, A 34, B 74, C 41, C* 67, D 21.
Beginner is twelve below the usual 20-position target following these requested
moves; the level remains available with its actual count.

## Additional pawn-pin assignment to A — 2026-10-27

Original screenshot position 13, “Khai thác tốt bị ghim”
(`pin-beginner-essential-20261027-04`, solution `Rxg4+`), also moves to A
at the user's request. Its FEN is
`8/6r1/8/8/4K1B1/5P2/2k5/7b b - - 0 1`. The classification is saved in
`publicationDifficulty` and the screenshot assignment manifest. Current counts:
Beginner 7 and A 35; all solution content and other assignments are preserved.
Beginner is thirteen below the usual target following the requested moves.

The seven remaining Beginner positions all use White to move after this
requested assignment; Black-to-move compositions remain available in A.

## Beginner pin-creation expansion to 24 — 2026-10-27

Added 17 four-piece compositions (`pin-create-20261027-01` through `-17`)
in `beginner-creation.json`, preserving the seven existing Beginner exercises
and every prior exclusion and A/C assignment. Beginner now has 24 positions.
All additions create an absolute pin with a quiet first move, then capture
the pinned piece after the opposing king moves. The targets include knights,
bishops, rooks and pawns, with both colors represented. No initial capture
is available. A pseudo-legal escape that the new pin prohibits must actually
move the target out of attack; merely blocking a pawn is not enough.

`review-pin-creation.py` verifies all legal replies and safe captures, including
all immediate recaptures. Every branch is saved for the shared trainer and
worksheet answers. Stockfish 17 probes the selected root at 120,000 nodes and
each endpoint at 40,000 nodes, retaining at least a pawn of material gain after
eight PV plies. These are bounded tactical checks, not exhaustive endgame proof.
The primary sample follows the engine's first defensive reply where available.

Relative-pin candidates were not published when checking replies or longer
exchange sequences obscured the introductory idea. No cross-pin or situational
pin label was added merely to fill a category. The requested count is met by
clear pin-creation lessons. Three incidental pawn-pin candidates are durably
excluded. Original and post-pin positions were checked against existing and
excluded positions for reflected/color-reversed duplicates.

Run `python3 scripts/review-pin-creation.py`, `python3 scripts/build-pins.py`,
`node --test scripts/test-pins.cjs scripts/test-worksheets.cjs scripts/test-practice-access.cjs`,
and `node scripts/audit-worksheet-copy.cjs`.
