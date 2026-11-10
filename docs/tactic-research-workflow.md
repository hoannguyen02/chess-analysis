# Reusable tactics research workflow

The workflow separates reusable computation from editorial approval. Discovery
is the first integrated adapter. The cache, source index, worker orchestration,
checkpoints and metrics are shared infrastructure for future tactics adapters.
Other topics must implement their own motif and objective checks before joining
the adapter registry. There is no generic publication approval from engine score.

## Executable workflow checks

Source-derived batches now require a scoped run, for example `start-run --topic
fork --additions A=4 B=5 --task 'Four A and five B additions' --run-file /tmp/run.json`.
This starts the ledger before reading the current instructions and owner data,
synchronizing decisions and querying the persistent candidate store. Unsupported
topic/level combinations stop before engine review. Use the same `--run-file`
for subsequent commands; an unscoped ledger remains suitable for timing a benchmark.

The CLI records content-bound receipts only after actual review, packet creation
and editorial merge. Named timing stages and free-text completion notes cannot
replace these receipts. Rehearsal and final visual publication both check them.
Changed instructions, owner decisions or verification code require `preflight
--run-file /tmp/run.json` and renewed affected command receipts, retaining the
original elapsed time. Exact engine caches remain reusable. Combined review
reports may reuse results only with identical candidates, policies and complete
tactical evidence from this run. Final copy belongs in reviewer inputs before
merge; use `editorial-merge --coverage /path/to/checklist.json` for final coverage.

`finish-run` requires the requested additions to have completed publication and
visual review, using exact finish-report receipts. It cannot turn an unfinished
batch into a completed task. Inspect `run-status` for receipts, stages and gaps.
Run `python3 scripts/test-research-run.py` and `python3 scripts/test-research-finish.py`
when changing these gates. They guard the supported commands, not direct local
file edits. Editorial judgment, actual page inspection and adapter quality still
require review; no completion-time guarantee follows from these checks.

## Cross-topic starting positions

The shared candidate lookup and review skip a position already active in
another practice topic. Diagnostics identify the existing topic and exercise.
The publication workflow checks the selected FENs again in rehearsal and under
the publication lock. Both checks use the effective practice catalogs after
owner removals, transfers and manual edits. The position key includes pieces,
side to move, castling rights and legal en passant, and ignores the FEN clocks.
The manual position editor asks before saving a cross-topic duplicate. The
explicit Beginner source-import flow continues to support intentional reuse.

## Execution audit: six Fork D additions (2026-11-06)

The efficient-execution rules already existed in `AGENTS.md` and this document.
The 64.3-minute run exposed inconsistent execution and implementation defects;
it does not establish that a routine six-position extension needs an hour.
Do not add duplicate instructions or relax verification to explain this delay.

| Existing requirement | What went wrong | Apply the existing requirement this way |
| --- | --- | --- |
| Use a topic-specific adapter and validate reusable tools | D support, sacrifice accounting and recovery handling were developed while candidate selection and editorial review were already running. | Check topic/level capability first. Complete a small representative positive/negative pilot before issuing independent review packets. Record necessary adapter work separately within the authorized task. Fix genuine defects when found and rerun affected checks. |
| Apply inexpensive material, motif and level checks before deep analysis | Incidental forks and an immediately recovered equal exchange reached expensive review. | In the early triage, identify the actual checking piece, explain why both fork threats matter, check whether the gain is already secured, and settle immediate exchanges. A geometric match or nominal offer remains a lead. Full independent tactical/editorial review is still required. |
| Diagnose poor yield before enlarging a search | An initial query excluded metadata-only master games because they had no fork tags. More collection happened before this source-coverage problem was identified. | Check source inventory, eligibility counts and representative rejection reasons before widening a window or downloading another corpus. Reuse complete untagged games through the cached scan path. |
| Reuse identical results while retaining independent checks | Validator changes caused repeated packet creation, handoffs and binding refreshes. | Keep verification code stable during editorial review when possible. After a necessary change, rerun affected tactical checks with exact caches. Reuse existing editorial notes only after exact candidate and complete tactical-evidence equality checks; refresh current packet bindings and retain prior reviewer/version history. Changed evidence needs renewed review. |
| Record each phase and keep finalization concise | A broad 55-minute stage obscured source/development costs; about 6.7 minutes remained after visual publication for documentation, audits and cleanup. | Time adapter work, lookup, source retrieval/import, collection, triage, tactical review, editorial review, publication/checks, PDF inspection and finalization separately with existing ledger commands. Keep documentation to decisions, gaps and measured results; use the shared finalization tools. |

The ledger recorded about 30.4 minutes of editorial windows after removing
parallel overlap. The final 13-candidate verification used completed caches and
took 27.8 seconds; the final build/check/PDF command took 32.5 seconds. These
figures overlap other work and are not an exclusive breakdown of the full run.
Source collection and development were not separately timed well enough to
assign the remaining elapsed time precisely.

For subsequent batches, use the existing small-batch process: early suitability
triage, full tactical evidence, disjoint independent review packets, final copy,
then one shared publication/check/PDF pass. Repeat checks or exports only when
changed inputs, a failure or an unresolved concern warrants it. Stop expanding
the search after the requested additions pass review; retain unused leads.
Every existing legal-root, defence, recovery, provenance, level, alternative,
access and visual-inspection requirement remains in force.

The audit alone did not enforce those steps. The executable checks above now
require scoped runs and current command evidence; automatic carry-forward of
editorial decisions remains unimplemented. Existing packet integrity checks and
reviewer binding remain required. No end-to-end speedup or future completion-time
guarantee has been measured.

## Beginner-only position authoring

This position-first authoring flow is **Beginner only**. On new tactics pages,
the owner fills Beginner through the UI. Keep the tab visible with its actual
count, including zero, and connect the shared importer and editor. Agent-created
or prefilled Beginner exercises require an explicit request. Preserve any
existing Beginner entries.

All registered practice topics reuse one source-FEN extractor, preview/import
dialog and manual editor. The owner selects and confirms positions through
**Lấy thế cờ từ B, C, C*, D, D*, E, E\*** or opens **Thêm thế cờ Nhập môn** to set up a
position directly. The editor supports free piece placement and optional
Beginner solutions.

When the owner opens the importer, extract the FEN immediately before the
named tactic from an existing exercise.
Use B, C, C*, D, D*, E, E* as source levels, respecting current owner level choices; exclude
A because its direct positions overlap Beginner. Replay to the tactical move.
Keep the source reference and skip duplicate positions. Show
the proposed batch and one confirmation before adding the Beginner entries.
There is no requirement to generate solutions or run engine review before the
owner reviews these positions. Importing does not simplify pieces automatically:
the owner removes irrelevant pieces in the editor. A source FEN may still need
simplification and is not an agent-approved Beginner exercise. The shared
extractor derives positions on demand from existing local topic data; no
candidate JSON sidecar or full-game copy is saved for each request.

The owner can arrange pieces freely in **Chỉnh sửa thế cờ**, including adding,
moving and removing pieces, setting the side to move, and importing/exporting
FEN. Keep **Ghi phương án — tùy chọn** as a separate legal-move recording mode.
Beginner saving requires its topic, intended objective and a playable position;
solutions are optional. Basic FEN/position validity and duplicate checks remain.
Editing updates the same entry. A changed starting FEN must prompt a clear reset
of incompatible recorded lines and stale preceding-move context; Cancel keeps
the previous position and lines. Preserve the original source separately and
identify edited boards as modified teaching positions.

Without a solution, Beginner uses free practice with no automatic correct/incorrect
or completion verdict. Allow a solution to be added later. Worksheets may include
the diagram; answer output must not fabricate a continuation. Saved position
counts must not be described as tactically verified counts without that evidence.

For the later levels, retain their exercises, source games,
required solutions, level rules, research/verification requirements, trainer
behavior and publication workflow. Do not overwrite or reclassify an original
exercise when deriving a Beginner board. Do not make solutions optional for these
levels. Shared UI/API changes must preserve their existing behavior. The
agent-verified research process below remains available with its existing checks;
it does not impose an approval queue on this owner-reviewed Beginner flow.

### Reusable automatic FEN extraction

`BeginnerTacticImport` is connected through the shared practice page's
`managementScope`. `/api/beginner-tactic-candidates?scope=...` resolves only
registered topics and reads their existing local data. Standard topics use
`src/lib/server/<route>-exercises.json` or
`src/lib/chess/<route>-exercises.json`, as flat exercise arrays or category arrays.
Manual-only topics reuse `manual-tactics.json`. Legacy Discovery, Skewer and
draw-family layouts are handled centrally. Production tracing includes these
source files; access protection and local-only writes remain unchanged.

The pure `beginnerTacticFrames` replays each saved legal line once. It uses a
reviewed `tacticPly` marker first (zero-based, counting both sides), then bounded
geometric checks for familiar motifs: forks, pins, skewers, discoveries,
promotions and actual mates. New source exercises should record their explicit
`goal`; for example `goal: "material", tacticPly: 2` selects the board immediately
before the solver's second move. Existing reviewed Fork/Discovery markers are
read without rewriting their source collections.

For unrecognized motifs, the same dialog offers legal solver-turn positions.
The owner must choose a move before selecting/importing that source. It does not
pretend the first or last move is the tactic. The owner may also change an
automatically suggested move, edit its board and set an optional solution later.
Edits are isolated by source and selected ply; viewing a previous move never
changes the FEN that will be imported. Goals and full-game references follow the
selected position, with played and analysis continuations labeled separately.

The shared loader applies current owner levels/removals/transfers before
extracting B, C, C*, D, D*, E, E* sources, skips existing/original Beginner FENs, preserves
preceding moves and checks a current source snapshot before confirmation. It
reads no external network sources, calls no engine and writes nothing during
lookup. Candidate counts are authoring choices, not tactical approvals. Unknown
objectives, illegal lines and missing referenced sources remain unavailable with
diagnostics rather than being silently fabricated.

### Extraction validation and measured lookup (2026-11-06)

A read-only sweep of 24 current registered scopes completed in 11.415 seconds
with zero exceptions and unchanged runtime JSON hashes. It included the main
tactics, mate patterns, promotion, draw-family storage and a manual-only topic.
A separate six-topic regression measured Fork 885 ms, Pin 1697 ms, Skewer
1659 ms, Discovery 655 ms, Promotion 118 ms and Stalemate 24 ms. These timings
cover local catalog lookup and legal replay only, excluding owner review,
position editing, import, research and PDF inspection. They are not a speedup
measurement against earlier engine research tasks. A synthetic future topic
using standard JSON plus `goal`/`tacticPly` passed without extractor changes.

Reproduce the functional checks with
`node --test scripts/test-beginner-tactic-candidates.cjs scripts/test-practice-exploration.cjs`.
Tests use temporary synthetic catalogs for mutations and preserve real source,
manual and owner data. They cover authorization, legal frames, per-position
provenance, source deduplication, changed snapshots, manual anchor gating and
isolation of board edits between selected moves.

## Adaptive workflow for all tactics

Use this process for agent-generated additions and collection reviews across
tactics topics. The shared CLI uses topic-specific source adapters and
supports supplied Fork and Hanging Piece compositions through
`review-compositions`. Add a verifier for each new topic and objective as
needed. Preserve approved collections and use the separate owner workflow
for manual positions and FEN imports.

### Choose the route from the request

Read `AGENTS.md`, current owner decisions, existing topic evidence and the
[topic suitability assessment](tactics-level-suitability.md) first. Suitability
metadata is a planning lead, not approval or automatic grading. Missing metadata
requires assessment. Record the requested topic, objective, levels, number of
additions, preserved IDs and actual remaining coverage/count gaps in the existing
topic documentation or review bundle. Preserve the shared level order
Beginner, A, B, C, C*, D, D*, E, E*.

| Request or condition | Route |
| --- | --- |
| New tactics page | Keep all nine levels visible and connect the owner's Beginner UI. Research A, B, C, C*, D, D*, E and E* where suitable. Beginner may launch with zero positions. |
| Explicit request for [verified Beginner additions](beginner-one-move-game-requirements.md) | Use at most 10 pieces, including kings and pawns. Verify exactly one legal move that wins, draws or saves according to the stated objective. Prefer original positions from complete indexed games and keep their preceding move and source. Apply the same checks to allowed compositions. |
| A–D additions | Reuse the indexed complete master games and existing staged research pipeline, with full provenance and the established level definitions. |
| Review or cleanup of a level | Review the complete requested set before replacement. Respect explicit cleanup counts and record specific keep/remove reasons. |
| Topic whose defining idea exceeds Beginner | Retain the visible level and explain the suitability gap. Do not remove a defining sacrifice or hide necessary preparation. |
| Owner manually authors a position | Preserve the explicit manual workflow in [manual tactic positions](manual-tactic-positions.md). Legal sample validation remains distinct from agent tactical/editorial verification. |

The standard target is 24 verified positions per suitable level in the research
scope. On a new tactics page, the Beginner count reflects the owner's entries
and any preserved approved positions. A zero count awaiting owner authoring
does not require research to finish the page. A scoped request for additions
finishes those additions and their integration. Reaching a target does not
justify removing approved positions or reopening other levels. Document the
search or construction history for any research gap in the requested scope.

For verified Beginner additions, check the candidate bank first, then search
suitable positions throughout complete indexed games. Existing A–E* exercises
are one source of leads. Apply the piece limit and compare all legal moves
before selecting a position. If two moves achieve the objective, or the
evidence for an alternative is unresolved, hold the position out of this
format. Keep the proof and preceding move with the source. Store only the
learner's answer as the playable line and keep follow-up analysis in the
evidence and explanation. See the [one-move requirements](beginner-one-move-game-requirements.md).

The shared `beginner_one_move.py` gate checks the board and legal answer and
requires one resolved result per legal starting move. Source review runs it
before engine analysis and recomputes its proof at publication. A source
adapter supplies `beginner_outcomes(board, record)` and registers Beginner
support after its motif, provenance, collection and publication paths are
ready. Defensive Move currently supports this source route. The Fork and
Hanging Piece composition profiles use the same gate and retain their
reply and recovery evidence. Historical builders reproduce existing
approvals. New additions go through the current gates.

For new reviews, D and D* require four or five solver moves. E and E*
require six or more. D and E require a genuine complex sacrifice and advanced
coordination. D* and E* require a strong defence that makes the stated depth
necessary, without a sacrifice. C* still requires two or three solver moves
without a sacrifice and a defensive resource beyond B.

Count solver moves through the point where the objective is achieved or
secured against the relevant strong defence. Record the defence, shorter
alternatives, and the payoff after any relevant recaptures. If a shorter sound
line reaches the same objective, use that line for grading. Forced mate still
requires coverage of all legal defensive replies and a check for a shorter mate.
Earlier published grades remain valid records of their review until each
position is reassessed. A six-move saved sample alone cannot justify regrading.

The shared level check validates the move range and recorded sacrifices before
publication. It does not establish tactical necessity. Hanging Piece supports
C* and D* in its source workflow. Discovery's earlier C* workflow uses the old
depth rule. New E and E* research runs require explicit topic adapter support
for the deeper objective checks before those levels are enabled for publication.

### Define the topic's teaching and verification rules

Each supported topic needs a small reusable profile. Reuse the existing topic
implementation where possible; add behavior to the shared workflow rather than
creating a script for each position. The profile describes:

- The exact objective, suitable levels, piece roles and relationships that create
  the motif, including what must change on the learner's move.
- Meaningfully different teaching families, relevant moving pieces, captures and
  quiet moves, checking and non-checking cases, defensive mechanisms and special
  moves. Assess en passant, castling and promotion where relevant; document
  unsuitable cases and unresolved gaps rather than forcing them into Beginner.
- Legal construction constraints, simpler alternatives that would bypass the
  lesson, relevant defensive resources and the required payoff/recovery checks.
- The teaching horizon in solver moves, verification budgets, completion criteria,
  and how to identify equivalent decisions for diversity review.

Use the following as topic-specific starting points, not a universal checklist:

| Topic | Beginner teaching decision | Required motif-specific review |
| --- | --- | --- |
| Fork | Create two meaningful threats, then gain material. | Check captures of the attacker, protection or movement of targets, blocks and counterchecks; attacking two squares alone is insufficient. Include suitable Pawn and King forks as well as other pieces. |
| Pin | Create a pin that enables a short material gain. | Establish which escape or defence is restricted. Check unpinning, interposition, exchanges, captures of the pinning piece and movement of a relatively pinned piece. Prioritize clear absolute pins; other forms need equally simple payoffs. |
| Skewer | Create a line attack that exposes a rear target after the front target responds. | Check blocks, exchanges, attacks on the slider, counterchecks and protection of the rear target. Start with clear checking skewers; a relative skewer is eligible only if the gain remains short and visible. |
| Discovery / discovered check / double check | Move a blocker to reveal an essential attack and its payoff. | Verify the stationary attacker, moving piece, targets and checking status. Check captures, blocks and counterattacks; cover suitable Pawn moves/captures, King/Queen clearances and quiet discoveries. |
| Removing or deflecting a defender | Safely remove a real defensive duty, then collect the target. | Establish why the direct target capture fails before the tactic; check refusal, replacement defenders, exchanges and recovery. Genuine sacrifices belong in later levels. |
| Clearance / interference | Open a necessary line or square, or interrupt a real defensive connection. | Verify that clearing or blocking the line enables the gain and that the moving piece remains safe or participates in an equal exchange. Test captures of the blocker and restored defensive connections. |
| Overloading / trapped piece | Exploit two conflicting defensive duties, or remove a piece's remaining safe escape. | Enumerate the relevant duties, escapes, exchanges and counterattacks. Keep the reason for the gain visible without lengthy coordination. |
| Hanging piece | Identify and safely capture genuinely undefended material. | Here the safe capture is the lesson itself. Check hidden defenders, recaptures and counterchecks; do not apply another topic's blanket rejection of direct captures. |
| Basic mate patterns | Deliver a direct mate using the named mating arrangement. | Verify actual checkmate and each essential piece's contribution. All-reply proofs apply to any claimed forced continuation; finite engine mate scores are insufficient. |
| Promotion / defensive or drawing tasks | Make the topic's simplest suitable decision toward its explicit objective. | Use the existing topic-specific restrictions and suitability assessment. Verify promotion safety and counterpromotion, or the stated defensive/draw condition; do not substitute an unrelated material gain. |

For topics not listed, derive the same profile before generating positions.
Sacrifice-defined themes, attraction and other themes outside the current
Beginner teaching plan need their own level assessment. Broad attacking themes
also need a concrete decision and objective; an attacking location alone is not
a sufficient teaching family. Never inherit a parent's suitability or approval.

### Run the common stages

| Stage | Work and decision |
| --- | --- |
| 1. Scope and reuse | Start the timing ledger; capture owner decisions and requested scope. Read approved records, exclusions and available unused leads. Identify the missing decisions, not just the missing count. |
| 2. Construct or research | For Beginner, prefer original positions in complete indexed games. Use the same piece limit and one-move rule for allowed compositions. For A–E* use complete indexed master games. Mark compositions and modifications accurately. |
| 3. Cheap filtering | Check position validity, legal moves, explicit objective, terminal positions, material, visible free gains, immediate mates and level conflicts. Deduplicate positions and group equivalent decisions before engine work. Review offers of moving and stationary pieces; a declined offer can still be a sacrifice. |
| 4. Motif and objective verification | Compare all legal roots; verify the essential motif, relevant defences, full stated payoff and material recovery. Run the existing required engine and objective-specific checks with exact cache identities. Incomplete searches stay unverified. |
| 5. Editorial selection | Independently inspect the diagrams, lines and evidence for clarity, difficulty, motif necessity and distinctness. Review hints, alternatives and solutions together. A technically winning position can still be unsuitable teaching material. |
| 6. Publication and integration | Update existing topic approval/evidence stores and builders. Rehearse changes while preserving prior exercises, owner decisions and provenance. Reuse protected APIs, shared trainer, alternative handling, side/objective display, game viewer and worksheet source. |
| 7. Validation and measurement | Run affected preservation, tactical, access, API and worksheet checks. Audit shared copy and inspect affected rendered PDFs once content is stable. Record full elapsed time, actual additions, counts, coverage and unresolved gaps. |

Constructed Beginner positions use at most 10 pieces, one direct decision,
no sacrifice and a short visible payoff. Review the full proof and
alternatives. Prefer a meaningful material contest
and retain necessary defenders/counterplay; removing all defence to simplify a
real game may destroy its teaching value. Do not turn routine conversions of an
overwhelming advantage into new tactical exercises.

### Preserve the verification boundary

For short Beginner material lines, enumerate every legal reply at the relevant
defender nodes within the declared teaching horizon, allowing different verified
solver continuations. Continue through the target capture, relevant recaptures,
counterchecks and material recovery. Check endpoints for stalemate and dead
positions. State what this finite verification establishes; it does not prove
an eventual game win or exclude every longer alternative. If a defensive resource
leaves the advertised payoff doubtful, extend the targeted review or withhold
the candidate. Do not label a search limit a refutation.

Compare the intended line with every legal starting move. Check immediate mates,
simple captures/exchanges, forcing checks, quiet mating threats and competing
tactical payoffs under the existing standards. A smaller safe gain that bypasses
a pin, fork or other named motif can invalidate its instructional purpose.
Use equivalent motif-based solutions in formats that support multiple answers.
Each newly verified Beginner exercise requires a unique sound move.
Distinguish a draw, material gain, winning position and game win in all copy.

Forced-mate claims require all legal defensive replies within the stated solver
move limit, plus shorter-mate review. Drawing and defensive objectives need their
own verification. Existing promotion counterpromotion requirements and stricter
topic-specific standards remain in force. Engine scores and cooperative sample
lines cannot replace those checks. Legal alternatives retain the shared trainer's
objective-specific handling and neutral feedback when unverified.

Separately explain why the motif enables the payoff: identify the restricted
defence, conflicting threats, exposed target or necessary mating control. Where
useful, analyze a legal alternative showing why an ordinary capture fails.
Removing pieces to test a relationship is an editorial diagnostic, not proof
about the original position: it can change checks, legal moves and material.

### Adapt effort from measured yield

Start with a small batch, for example four to eight leads, adjusted to the number
needed and previous acceptance rates. Prioritize missing teaching decisions and
low-ambiguity constructions. Retain unused leads so a later request can resume.
Do not repeatedly generate mirrored or shifted variants of an approved exercise
as if they were new coverage. Revalidate every changed position independently.

After each batch, inspect counts and specific rejection reasons. Illegal positions
call for better construction constraints; decorative motifs need a different
defensive relationship; repetition needs a different teaching family; unsuitable
difficulty needs a simpler decision or an honestly reviewed later-level candidate.
When verification is unresolved, deepen only the relevant analysis or select a
clearer candidate. Repeated low yield should trigger this diagnosis and a changed
approach before larger random searches, downloads or engine budgets. Continue
toward the authorized additions until they pass or a concrete limitation is
documented; a slow batch alone is not a blocker.

Reuse completed analysis only for the exact position/history, line, objective,
topic, level, verifier and engine settings it supports. Template-level approval
does not approve its variants; evidence for one topic does not approve another.
An unchanged early-filter result can be cached independently of more expensive
searches. Distinctness is finally judged by the learner's decision and defensive
mechanism, not a geometric signature, side-to-move quota or engine evaluation.

### Keep evidence compact and implementation honest

Use existing record formats and bundles where possible. For each selected or
excluded candidate retain a stable ID, exact FEN/line/objective/level, source type,
teaching family and covered aspects, reason for the decision, material and motif
review, relevant roots/defences/recovery, verification bounds/settings/version,
and exact-record editorial approval. Composed positions need composition identity
and legal context, not invented game headers; real games retain complete local
provenance. Preserve full FEN rights and legal preceding-move context for any
special move. Track meaningful modifications explicitly.

Local unused leads and disposable computation stay in the ignored/external
candidate bank. Durable approvals, exclusions, selected evidence and source games
stay in topic stores; do not add scripts or JSON sidecars per position/request.
Use `research/scratch/`, `research/runs/` and `research/benchmarks/` for disposable
work under the existing ignore rules. Do not add an approval step to the owner's
manual authoring interface or use that interface to bypass agent review.

Implement this specification by extracting reusable existing checks and adding
topic/objective support to the shared tools incrementally. Each supported path
must declare what it can verify and fail closed when support is absent. Reuse
existing working topic tools during migration, preserve their required checks,
and avoid parallel trainer or publication implementations. There is no new CLI
command implied by the stage names in this section.

Begin implementation validation with fresh fork, pin and skewer candidates so
different motif rules are exercised, then extend to other suitable topics. A
pilot is a validation stage, not a substitute for completing an authorized full
collection. Measure generation/search, filtering, engine/objective verification,
editorial review, publication, tests and actual PDF inspection, including waits
and gaps. Compare cold/warm runs of the same fixed inputs with unchanged checks;
report fresh-content elapsed time separately from known-position replay. Publish
no speed claim or ETA from unmeasured composition performance.

## Research and review

```sh
python3 scripts/research-tactics.py start-run --topic discovery --additions B=4 \
  --task 'Four Discovery B additions' --run-file /tmp/run.json
python3 scripts/research-tactics.py sync-decisions
python3 scripts/research-tactics.py import-corpus \
  --input /path/to/prepared-corpus.json --manifest /path/to/source-manifest.json \
  --run-file /tmp/run.json
python3 scripts/research-tactics.py collect --topic discovery --level B \
  --phase tactics --target 6 --output /tmp/discovery-candidates.json \
  --review-output /tmp/discovery-review.json --workers 4 --run-file /tmp/run.json
```

Re-review an explicitly changed candidate file without collecting more games:

```sh
python3 scripts/research-tactics.py review --topic discovery --level B \
  --input /tmp/discovery-candidates.json --output /tmp/discovery-review.json \
  --workers 4 --batch-size 4 --need 4 --run-file /tmp/run.json
```

The shared `collect` command now queries the candidate-position bank first.
It indexes complete games only when more source positions are needed, then
screens independent positions in a bounded worker pool. The direct
`collect-discovery.py` command remains the serial legacy path for comparison.
The default shared collection target is six leads per requested level, not an
approval quota; use smaller batches for small additions.

`--need` counts candidates awaiting editorial review, not approved exercises.
Inspect the accompanying Markdown review packet and continue with another batch
when too few candidates pass editorial review. It lists exact FENs, solutions,
record hashes, defensive replies, material balances and reasons for withholding.
Cluster suggestions group similar mechanisms; a reviewer must explain the
concrete additional decision before retaining related examples.

The source manifest has a `sources` array with `url`, `sha256` and `retrieved`
for each archive. Use previously verified preparation manifests. Import replays
complete games and verifies their identities; it does not establish a player's
master credentials from a puzzle link or an engine score. Metadata-only imports
save complete games and provenance quickly without claiming that geometric tags
were scanned. `--index-motifs` also runs the existing shared motif detectors;
the older `tactics-index.py import-archive` can populate tags later.

Discovery decisions are synchronized from durable reviews and current owner
adjustments into a level-aware table in `research/tactics-index.sqlite`. A B-only
rejection does not reject a potentially suitable C example. Removed, transferred
and manually classified positions are excluded from new additions. `--recheck`
explicitly reopens older editorial decisions but does not override owner choices.

## Preserved quality checks

Early triage checks legal replay, complete-game provenance, initial material,
the discovery payoff, offers declined in the sample line, prior gains and the
proposed level. Suspicious offers are withheld for review; equal exchanges are
not automatically called sacrifices. The two historic false B leads, Navara's
Rh8+ and Karpov's g4+, are regression cases.
En passant offer detection records the captured pawn's actual square separately
from the capturing pawn's destination.

Survivors retain the existing budgets: every legal starting move receives the
million-node root comparison, immediate mate and mate-in-two checks; local
two-solver-move material shortcuts use their existing 18,000-node bound; the
complete solver timeline records legal defensive replies and three defensive
engine lines at 500,000 nodes. Preparation retains its separate 150,000-node
probe. Exact mate certificates and shorter-mate searches keep their all-reply
proofs and explicit search-limit status. Engine scores remain finite evidence
for material objectives, not a proof of an eventual win.

An unresolved shortcut budget, failed mate proof, missing provenance or a
tactical/editorial flag cannot become automatic approval. Rejected/withheld
candidates can skip expensive later stages because they are not published.

## Cache and resume

The shared source `review` and `collect` commands default to the writable,
ignored `research/scratch/tactics-engine-cache.sqlite`. Legacy tools use
`~/Library/Caches/chess-analysis/research-v1.sqlite`; use `CHESS_RESEARCH_CACHE`
or `--cache` to point them at the same cache. Engine work checks writability
before starting. The source index remains the existing ignored SQLite file.

An engine request is keyed by binary checksum, options, external network
checksums, Python-chess version, full FEN, complete supplied move stack, exact
search limits, MultiPV, permitted roots and the cold-hash policy. Failed requests
are not saved. Every fresh request clears the engine hash so results do not
silently depend on unrelated earlier worker jobs. Each worker owns its engine.

Review results additionally bind the topic, full candidate record, settings and
verification-code checksums. Changing a FEN, solution, objective, level or source
invalidates that review. Completed negative collector scans are checkpointed too;
an interrupted current game can resume through exact engine cache hits. Legacy
review scripts also use the shared engine cache, with `--no-cache` available for
baseline measurement. Old output files without exact review identities are not
trusted as resume hits.

The cache is disposable computation, not durable approval. Keep approved source
games, selected evidence, editorial decisions and exclusions in project fixtures.

### Persistent research memory

The shared source review commits the actual outcomes of each completed batch to
`research_assessments` in the existing index. Editorial merge records its bound
decisions there as well. `sync-decisions` only refreshes the owner/publication
projection; it does not erase assessment history. The existing game and geometry
checkpoints still govern source replay. Assessment history includes the exact
record, tactical facts, flags, settings, evidence and original artifact reference.

The neutral position/line identity has no grade or tactic. Applicability still
requires the exact record revision, topic, objective, level, proof dependencies,
engine identity, budgets and scoped rule version. A hold for one line does not
blacklist its game. Current ready/unselected candidates rank ahead of unexamined
leads. Current withholdings, unresolved searches and editorial holds stay out of
the normal queue. A deferral only for a full batch may record
`"retryWhen": "next-selection"` in the reviewer decision to stay available.
Use ordinary `defer` for an outstanding tactical/editorial question.

```sh
python3 scripts/research-tactics.py memory-backfill --from-run /path/to/previous-run.json
python3 scripts/research-tactics.py memory-explain --topic fork --level D --game-id GAME_ID
python3 scripts/research-tactics.py memory-coverage --output /tmp/tactic-coverage.json
python3 scripts/research-tactics.py candidates --topic fork --levels D \
  --aspect mover-B --limit 8 --output /tmp/bishop-fork-leads.json
python3 scripts/research-tactics.py memory-backup --output research/backups/index-snapshot.sqlite
```

Backfill checks exact prior command artifacts. Missing or changed artifacts are
reported, not treated as completed evidence. Unrecognized verifier versions
remain historical. Add `--evidence` to inspect the complete stored assessment.
Back up the index separately from engine cache cleanup and test restoring to a
separate index path. Backup refuses to overwrite an existing file.

Use `candidates --memory-mode stale` for previously assessed records whose
verification policy no longer matches. To mark a teaching-rule revision for a
single scope, set e.g. `"topics": {"fork": {"D": "fork-d-v2"}}` in
`scripts/fixtures/tactics-index/research-rules.json`. Update the topic adapter
when the verification itself changes. A rule marker queues reconsideration;
it does not change a grade or relax a check. Refresh preflight for an active run
when the manifest changes. Other level assessments and exact engine requests
remain reusable unless their own dependencies changed.

For a focused retry at a higher budget, `review --settings FILE.json` accepts
the existing budget keys. Use `candidates --memory-mode force --reason TEXT`
and `review --force-review TEXT` to reconsider an existing hold explicitly.
These modes retain exact caches and owner protections. Normal publication still
requires scoped receipts, independent editorial decisions and visual approval.

`memory-coverage` lists all map topics and all nine levels with their current
source review capability and stored research counts, not verified exercise
counts. Fork A/B/D and Discovery A–D have source review adapters; other scopes
remain unsupported until their own objective checks exist. Beginner position
authoring and its owner review stay separate. Coverage tags are legal-replay
observations and do not prove the motif is essential.

On the Nov 7 Fork D history, six exact review artifacts and two editorial
merges imported 27 assessment records; one earlier overwritten artifact was
skipped. The normal queue skipped 21 matching holds with zero source-game
replays. A fixed replay of the 23 previously examined inputs reused two complete
tactical results and made zero engine calls. This is a warm reuse check, not
fresh-position research or a measured end-to-end speedup.

## Editorial handoff and packaging

Write a decision file with a `reviews` array. Each kept record needs its
`gameId`, exact `recordHash` from the packet, `decision: "keep"`, a tactical
`reason`, concrete `distinctness`, reviewed `solutionVi` and `hintsVi`.
Create packets and merge their decisions with the commands below before packaging;
a handwritten decisions file cannot replace the merge receipt.

```sh
python3 scripts/research-tactics.py prepare-publication \
  --review /tmp/discovery-review.json --decisions /tmp/editorial-decisions.json \
  --output /tmp/approved-discovery.json --run-file /tmp/run.json
```

This prepares only explicitly approved, current, clean results. Benchmark-only
records cannot be packaged for publication. A packet made with changed or
unrecorded verification code must be reviewed again. A Discovery B, C or D batch can
also be emitted directly in the existing builder format. Add the recorded
level-specific `coverageChecklist` to reviewer inputs or pass `--coverage` before
the editorial merge. Do not edit its bound output afterward:

```sh
python3 scripts/research-tactics.py prepare-publication \
  --review /tmp/discovery-review.json --decisions /tmp/editorial-decisions.json \
  --format discovery-expansion \
  --output /tmp/level-b-expansion.json --run-file /tmp/run.json
```

Use `level-c`, `level-c-star` or `level-d` for the eventual expansion manifest. The
converter refuses duplicate/excluded games, owner decisions and overwriting an
existing batch. It writes selected evidence and source references first, then
atomically commits the manifest. Beginner and A retain their existing curated
workflows. Use `finish-batch` below for isolated curation/building and publication; its builders
preserve owner choices, build practice/game-source data and feed protected APIs
and the worksheet selector.
Finalize the selection before running required validation and rendering affected
worksheet/answer PDFs, avoiding exports of an unfinished candidate selection.

## Reproducible speed benchmark

```sh
python3 scripts/benchmark-tactic-research.py \
  --workers 1 2 4 --output /tmp/tactic-research-benchmark.json
```

The fixed 63-position fixture is the historical Discovery B review batch. The
baseline reruns all three legacy passes, including both all-root searches, with
their original budgets and caching disabled. Optimized runs use the same
verification budgets, early withholding and a shared root result; each cold
worker configuration has a fresh cache and is followed by a warm repeat.

Reports record input/engine checksums, settings, elapsed wall time, worker-stage
times, physical engine calls, cache hits, every-survivor root coverage, mate
proofs, historical nine-position eligibility and the two declined-offer cases.
Historical approvals are test expectations, not permission to restore a newer
owner exclusion. Cache-hit runs must preserve decisions and make no engine calls.

These timings measure automated tactical review only. They exclude downloading
and indexing archives, human coaching/editorial judgment, publishing, tests and
PDF inspection. They must not be advertised as turning the earlier two-hour
end-to-end task into the benchmark's review time.

### File lifecycle

Keep approved batch manifests: their ordered selection, proofs and preservation
snapshots are builder/test inputs. Discovery's review and source sidecars now
share `scripts/fixtures/discovery/expansion-evidence.json`, addressed by
`bundle.json#record-key`. The publisher updates this bundle atomically and writes
the small batch manifest last. Future batches reuse it instead of adding two
more sidecar files. Use the existing review bundles for other topics.

Put disposable scripts in `research/scratch/`, full run logs and PDF previews in
`research/runs/`, and measured benchmark reports in `research/benchmarks/`.
These directories are ignored. The four machine-specific reports from this
trial were moved there; their measured findings remain in this document.
Keep `research-benchmark/discovery-b.json` as the fixed benchmark input and
`discovery-b-c-extension-20261105.json` as a preservation regression fixture.
Do not replace either with transient timing output or ignore all fixture JSON.

Reuse a parameterized script for new work. Completed per-player review scripts
can be removed once their evidence and focused replay checks are retained.
Check builders, imports, tests and documentation before removing a file.

### Measured on 2026-11-05

The measured review benchmark used Stockfish 17 on this 11-logical-CPU Apple ARM host, with one engine
thread per worker and the fixed 63-position batch.

| Automated review | Wall time |
| --- | ---: |
| Legacy three passes, one worker | 165.24 s |
| Staged review, one worker, fresh cache | 76.72 s |
| Staged review, two workers, fresh cache | 42.81 s |
| Staged review, four workers, fresh cache | 27.94 s |
| Four workers, cached repeat | 0.29 s |

The fresh four-worker run was 5.91 times faster, using 83.1% less wall time.
All worker counts produced identical statuses, flags and candidate hashes.
Every historical approval reached editorial review; both declined-offer cases
were withheld early. Surviving candidates retained all-root comparison and
all-reply mate proofs. Each fresh configuration made 165 engine requests;
the cached repeats made none. The default pool is bounded at four workers.

Separately, importing the 13,471 prepared games into the final index schema
took 16.41 s; recognizing the same completed corpus took 0.007 s. The first
export of all 21,348 indexed games took 9.05 s and repeat export took 0.44 s.
These source measurements exclude downloads and motif scanning. Historical
benchmark approvals never override later owner removals or level changes.

## Workflow regression checks

Run `python3 scripts/test-tactic-research.py` for exact cache identities, safe
resume, declined offers, en passant, provenance, worker shutdown, publication
gates and corpus reuse. Keep the existing topic, index, practice-access,
alternative-mate and worksheet checks; this suite does not replace them.

## Candidate-position lookup and parallel editorial review

The ignored source index now stores normalized complete-game source records,
searchable FEN/line/level/aspect leads, saved unselected candidates, and positive
and negative per-game geometric checkpoints. Source moves and detector version
identify geometry work; requested levels and owner decisions are applied at
lookup time. Provenance metadata is refreshed without replaying unchanged moves; a corrected
result regenerates that game’s near-resignation inventory. Superseded detector
rows remain ineligible. Metadata changes invalidate affected evidence. A cached negative
played-game scan does not prove that no unplayed analysis tactic exists.

```sh
python3 scripts/research-tactics.py candidates-import --input /path/to/saved-leads.json
python3 scripts/research-tactics.py candidates --levels B C --limit 8 \
  --output /tmp/available-leads.json
python3 scripts/research-tactics.py index-positions --workers 4 \
  --output /tmp/position-index.json --run-file /tmp/run.json
```

`index-positions` is the one-time geometric population step; unchanged complete
games are not legally replayed again. Saved leads still need the same current
full tactical review and editorial approval. Owner removals and transfers remain
protected even with `--recheck`. `--no-bank` bypasses direct candidate-bank success
for a controlled collection test; use fresh isolated databases and engine caches
when measuring a genuinely cold run.

Create a run ledger before lookup, and attach it to subsequent commands:

```sh
python3 scripts/research-tactics.py start-run --run-file /tmp/run.json \
  --task 'Two additions each to Discovery B and C' --topic discovery --additions B=2 C=2
python3 scripts/research-tactics.py collect --topic discovery --levels B C \
  --target 4 --workers 4 --output /tmp/leads.json \
  --review-output /tmp/review.json --run-file /tmp/run.json
python3 scripts/research-tactics.py editorial-packets --review /tmp/review.json \
  --reviewers 4 --output-dir /tmp/editorial --run-file /tmp/run.json
```

The coordinating agent delegates the disjoint packets to parallel reviewers.
Each JSON packet contains the entire source game and tactical evidence; its
Markdown summary highlights material, sacrifices, real recapture restrictions,
competing roots and strong defensive lines. Templates begin `undecided`.
Reviewers record explicit keep, reject or defer decisions, all five tactical
notes, concrete distinctness and reviewed Vietnamese copy. Their decisions bind
the exact record, evidence, packet ownership and verification-code hashes.
Counterfactual highlights are leads, not tactical proofs. Timing and cache-hit
counters are excluded from the editorial evidence hash, so an unchanged cached
review does not discard work already in progress. All tactical findings remain
bound.

Record the real reviewer interval with `stage-start --name editorial-review:NAME`
and `stage-finish --stage-id ID`, or use `RunLedger.begin/end`. Record copy and
final consistency work too. The coordinator checks variety across the requested
level before merging; conflicting ownership, missing decisions, changed evidence
and undecided templates are rejected. Deferrals remain distinct from rejections.

```sh
python3 scripts/research-tactics.py editorial-merge --review /tmp/review.json \
  --packets /tmp/editorial/manifest.json \
  --decisions /tmp/editorial/reviewer-01-HASH-decisions.json \
              /tmp/editorial/reviewer-02-HASH-decisions.json \
  --output /tmp/decisions.json --run-file /tmp/run.json
```

Supply every generated packet decision file. Keeps still pass the existing
publication gates; packets never create approval automatically.

## One publication/check command and reusable PDF previews

Fork A/B/D now also uses `review --topic fork`, candidate import/query, owner
decision synchronization, immutable editorial packets, approved-bundle
packaging and `finish-batch`. Its source collector remains `collect-forks.py
--index ...`; shared `collect` and `index-positions` explicitly reject Fork
until a collection adapter exists. The Fork adapter checks every legal starting
move, meaningful preparation, captures of the moving piece and future attacker,
equal recaptures, material recovery and every immediate fork reply. Mate goals
and other levels fail closed. An engine evaluation alone never approves a lead.

D additionally verifies actual unequal sacrifice costs through the complete
immediate capture chain, including recaptures on another square. Ordinary equal
exchanges do not become sacrifices because the line is long. Promotion
compensation is recorded separately. Every legal preparation reply is compared;
captures, counterchecks, the sample and near-best declines receive focused
full-budget probes. A truncated defensive PV triggers a bounded solver-turn
continuation with full source history, at least one million nodes and three
variations. It still needs a concrete recovery/fork witness; a high score or
unresolved search never approves publication. Editorial review separately
rejects incidental forks and unnecessary preparation.

The indexed Fork collector scans complete metadata-only games even when they
have no motif tags yet. Per-game positive and negative geometry results use
exact game/source/code fingerprints, independently of requested levels and owner
choices; current eligibility is applied on retrieval. Independent games and
engine screens use bounded worker pools. `--source-contains` selects an archive,
and the bank can retry different source frames while publication retains only
one exercise per game.

For a new Fork batch, pass the cumulative
`scripts/fixtures/fork/expansion-evidence.json` path to the same `finish-batch`
command. Fresh approvals append in staging; prior records, decisions, evidence
and metadata remain unchanged. `publicationBatches` retains exact per-batch
budgets and engine/code identities, without relabeling old reviews with newer
limits. Conflicting identities/outcomes fail closed. It rehearses
`build-forks.py`, preserves prior
exercises/games and owner data, runs Fork/worksheet/access/mate/viewer and copy
checks, and exports the affected PDFs with the shared renderer. Visual approval
uses the same exact-artifact hashes, publication lock, snapshot checks and
rollback. Existing Fork evidence bundles are not silently replaced.

```sh
python3 scripts/research-tactics.py finish-batch --review /tmp/review.json \
  --decisions /tmp/decisions.json \
  --manifest scripts/fixtures/discovery/level-b-expansion-DATE.json \
  --output-dir /tmp/finish-batch --run-file /tmp/run.json
```

This rehearses a new batch in an isolated copy and runs the existing builders,
previous-content preservation checks, Discovery/worksheet/access/mate tests,
copy audit, selected-ID PDF export and PNG previews. It replaces the temporary
per-task rendering harness. An existing Discovery manifest is refused here; use
`inspect-batch --manifests PATH... --output-dir PATH` for an explicitly named
already-published-batch rehearsal.

The default new-batch rehearsal never commits. Add `--apply` when preparing an
authorized content addition for final commit. In both modes, rendering finishes
at `awaiting-visual-review`. The coordinating agent inspects affected diagrams
and answer pages, then records what was checked:

```sh
python3 scripts/research-tactics.py approve-visual \
  --report /tmp/finish-batch/finish-report.json \
  --reviewer agent --note 'Inspected affected diagrams, moves, copy and pagination.' \
  --run-file /tmp/run.json
python3 scripts/research-tactics.py finish-run --run-file /tmp/run.json
```

Visual approval is tied to exact PDF/PNG, input, code, asset and source-bank
hashes. In apply mode it commits only the rehearsed files, under a project
publication lock, and rechecks current snapshots inside the lock. A concurrent
publication or owner change requires a fresh rehearsal. Failed commits restore
only this operation's own writes. Tests cover simultaneous approvals, stale
artifacts/inputs and rollback. Existing-batch rehearsals never modify live data.

The ledger records all elapsed time from its initial start, including review
windows and gaps between commands. Parallel intervals overlap and are not
summed into a false total. Unattributed time stays visible and included. Pending
editorial/visual requirements and unresolved failed stages prevent completion;
`resolve-stage` links a failed attempt to its completed retry without erasing it.

## Measurements after the full workflow trial

The 21,348 existing games were indexed once in 158.26 seconds with four workers:
8,077 geometric leads and 65,975 near-resignation FENs. The full unchanged-game
repeat took 1.58 seconds and replayed zero games. These are research leads,
not verified exercise counts. The normal candidate lookup returned six eligible
saved leads in about 0.003 seconds with zero source-game replays; a bank-only
collection smoke test completed without opening a deliberately absent corpus.

The collection benchmark compares the same four complete games, including a genuine negative case. It
checks identical geometry decisions, shortlist and screened lines across one
and four workers, exact unchanged engine budgets, and zero warm replay. It
measures collection stages, not new-position editorial approval.

The known-four workflow rehearsal took 18.7 minutes, including four independent reviewer decisions, isolated
build/tests, PDF exports and actual visual inspection. It includes coordination
gaps rather than hiding them; the build/check/PDF command itself took 23.9
seconds. This replay used known source positions and cached tactical analysis;
it does not establish a fresh-research end-to-end speedup over the earlier
39-minute task. An independent review caught and corrected a source-label
mistake: Seirawan's `Qd4 hxg6` line is teaching analysis, not played continuation.

Additional regression suites:

```sh
python3 scripts/test-research-collection.py
python3 scripts/test-research-editorial.py
python3 scripts/test-research-finish.py
python3 scripts/test-research-run.py
node --test scripts/test-render-tactic-batch.cjs
```

Reproduce the collection comparison with `benchmark-tactic-collection.py`.
`benchmark-tactic-workflow.py prepare|finish|report --work-dir PATH` deliberately
stops for actual editorial decisions and visual inspection; it cannot replace
those steps with timed automatic acceptance.

## Hanging Piece pilot

The `hanging-piece` adapter uses the same source index, exact engine cache,
review memory, editorial packets and isolated publication as other registered
topics. It separates direct wins from short or deeper material recovery after
taking an undefended piece. Its source-level policy covers A, B, C* and D*. The
separate Beginner composition verifier retains an exact local reply certificate.
See [Hanging Piece practice](hanging-piece-practice.md) for the level counts,
scope and source scan results.

In the initial fixed eight-position source benchmark, two workers took 9.43 s
cold and four workers took 6.81 s cold at the same full budgets and 54 engine
calls each. Both returned the same tactical statuses. The warm runs took
0.14 s and 0.17 s with zero engine calls. An eight-position Beginner benchmark
took 1.33 s with two workers and 0.91 s with four, with 18 engine calls in each
cold run. Its four-worker warm run took 0.31 s with zero engine calls. These
are automated review timings. Source replay, editorial review, validation
and PDF inspection are measured separately in the run ledgers.
