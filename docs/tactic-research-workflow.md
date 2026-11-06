# Reusable tactics research workflow

The workflow separates reusable computation from editorial approval. Discovery
is the first integrated adapter. The cache, source index, worker orchestration,
checkpoints and metrics are shared infrastructure for future tactics adapters.
Other topics must implement their own motif and objective checks before joining
the adapter registry. There is no generic publication approval from engine score.

## Beginner-only position authoring

This position-first authoring flow is **Beginner only**. All registered practice
topics reuse one source-FEN extractor, preview/import dialog and manual editor.
The editor supports free piece placement and optional Beginner solutions. No
separate extraction adapter or UI is required for each new tactic.

Extract the FEN immediately before the named tactic from an existing exercise.
Use B, C, C*, D as source levels, respecting current owner level choices; exclude
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

**A, B, C, C*, D remain unchanged:** retain their exercises, source games,
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
extracting B, C, C*, D sources, skips existing/original Beginner FENs, preserves
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

This is the standing process for agent-generated additions and collection
reviews across tactics topics. The shared CLI retains the Discovery research
adapter and supports `review-compositions --topic fork` for supplied compositions.
Other topics still need their own checks. This is not a universal generator or
a measured composition speedup, and it is separate from owner-reviewed FEN import.
Preserve approved collections while adding support incrementally.

### Choose the route from the request

Read `AGENTS.md`, current owner decisions, existing topic evidence and the
[topic suitability assessment](tactics-level-suitability.md) first. Suitability
metadata is a planning lead, not approval or automatic grading. Missing metadata
requires assessment. Record the requested topic, objective, levels, number of
additions, preserved IDs and actual remaining coverage/count gaps in the existing
topic documentation or review bundle. Preserve Beginner, A, B, C, C*, D navigation.

| Request or condition | Route |
| --- | --- |
| Beginner additions with a suitable direct idea | Reuse eligible reviewed candidates, then construct simple original compositions around missing teaching decisions. Suitable existing real-game examples may also be used. |
| A–D additions | Reuse the indexed complete master games and existing staged research pipeline, with full provenance and the established level definitions. |
| Review or cleanup of a level | Review the complete requested set before replacement. Respect explicit cleanup counts and record specific keep/remove reasons. |
| Topic whose defining idea exceeds Beginner | Retain the visible level and explain the suitability gap. Do not remove a defining sacrifice or hide necessary preparation. |
| Owner manually authors a position | Preserve the explicit manual workflow in [manual tactic positions](manual-tactic-positions.md). Legal sample validation remains distinct from agent tactical/editorial verification. |

The standard target is 24 verified positions per suitable level. A scoped request
for additions finishes those additions and their integration; reaching a target
does not justify removing approved positions or reopening other levels. A new
page retains the full end-to-end requirements. A genuine gap needs a documented
search/construction history, not just one unsuccessful batch.

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
| 2. Construct or research | For Beginner, build backward from the intended motif and useful defence: place the related targets/defender/attacker, choose a legal starting move, then place Kings and only necessary supporting pieces. For A–D use complete indexed games. Mark compositions and modifications accurately. |
| 3. Cheap filtering | Check position validity, legal moves, explicit objective, terminal positions, material, visible free gains, immediate mates and level conflicts. Deduplicate positions and group equivalent decisions before engine work. Review offers of moving and stationary pieces; a declined offer can still be a sacrifice. |
| 4. Motif and objective verification | Compare all legal roots; verify the essential motif, relevant defences, full stated payoff and material recovery. Run the existing required engine and objective-specific checks with exact cache identities. Incomplete searches stay unverified. |
| 5. Editorial selection | Independently inspect the diagrams, lines and evidence for clarity, difficulty, motif necessity and distinctness. Review hints, alternatives and solutions together. A technically winning position can still be unsuitable teaching material. |
| 6. Publication and integration | Update existing topic approval/evidence stores and builders. Rehearse changes while preserving prior exercises, owner decisions and provenance. Reuse protected APIs, shared trainer, alternative handling, side/objective display, game viewer and worksheet source. |
| 7. Validation and measurement | Run affected preservation, tactical, access, API and worksheet checks. Audit shared copy and inspect affected rendered PDFs once content is stable. Record full elapsed time, actual additions, counts, coverage and unresolved gaps. |

Constructed Beginner positions should use few pieces, a direct decision, no
sacrifice and a short visible payoff, usually one or two solver moves. This is a
design starting point, not an automatic grade or a rigid piece-count rule. Review
the complete line and shorter alternatives. Prefer a meaningful material contest
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
Equivalent motif-based solutions are welcome; uniqueness is not required.
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
python3 scripts/research-tactics.py sync-decisions
python3 scripts/research-tactics.py import-corpus \
  --input /path/to/prepared-corpus.json --manifest /path/to/source-manifest.json
python3 scripts/research-tactics.py collect --topic discovery --level B \
  --phase tactics --target 6 --output /tmp/discovery-candidates.json \
  --review-output /tmp/discovery-review.json --workers 4
```

Re-review an explicitly changed candidate file without collecting more games:

```sh
python3 scripts/research-tactics.py review --topic discovery --level B \
  --input /tmp/discovery-candidates.json --output /tmp/discovery-review.json \
  --workers 4 --batch-size 4 --need 4
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

The default cache is outside the repository at
`~/Library/Caches/chess-analysis/research-v1.sqlite`. Override it with
`CHESS_RESEARCH_CACHE` or `--cache`. It uses SQLite transactions/WAL for bounded
worker concurrency. The source index remains the existing ignored SQLite file.

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

## Editorial handoff and packaging

Write a decision file with a `reviews` array. Each kept record needs its
`gameId`, exact `recordHash` from the packet, `decision: "keep"`, a tactical
`reason`, concrete `distinctness`, reviewed `solutionVi` and `hintsVi`.

```sh
python3 scripts/research-tactics.py prepare-publication \
  --review /tmp/discovery-review.json --decisions /tmp/editorial-decisions.json \
  --output /tmp/approved-discovery.json
```

This prepares only explicitly approved, current, clean results. Benchmark-only
records cannot be packaged for publication. A packet made with changed or
unrecorded verification code must be reviewed again. A Discovery B, C, C* or D batch can
also be emitted directly in the existing builder format. Add the recorded
level-specific `coverageChecklist` and review `date` to the decision file:

```sh
python3 scripts/research-tactics.py prepare-publication \
  --review /tmp/discovery-review.json --decisions /tmp/editorial-decisions.json \
  --format discovery-expansion \
  --output scripts/fixtures/discovery/level-b-expansion-YYYYMMDD.json
python3 scripts/curate-discovery-upper.py
python3 scripts/build-discovery.py
python3 scripts/discovery-coverage-report.py
```

Use `level-c`, `level-c-star` or `level-d` for those expansion filenames. The
converter refuses duplicate/excluded games, owner decisions and overwriting an
existing batch. It writes selected evidence and source references first, then
atomically commits the manifest. Beginner and A retain their existing curated
workflows. The topic curation/builders remain the publication boundary; they
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
  --output /tmp/position-index.json
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
  --task 'Two additions each to Discovery B and C'
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

```sh
python3 scripts/research-tactics.py finish-batch --review /tmp/review.json \
  --decisions /tmp/decisions.json \
  --manifest scripts/fixtures/discovery/level-b-expansion-DATE.json \
  --output-dir /tmp/finish-batch --run-file /tmp/run.json
```

This rehearses a new batch in an isolated copy and runs the existing builders,
previous-content preservation checks, Discovery/worksheet/access/mate tests,
copy audit, selected-ID PDF export and PNG previews. It replaces the temporary
per-task rendering harness. An existing manifest is refused here; use
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
