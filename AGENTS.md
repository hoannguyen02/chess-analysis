# Project audience and interface copy

# Start every practice-page task with these requirements

- Before planning or editing any current or future chess practice page, review
  this file's required levels and exercise-count rule. Use Beginner, A, B, C,
  C*, D in that order, with a target of 24 verified positions at each level.
- Keep every level visible even when research has not yet produced 24 suitable
  positions. Show the actual count and document the gap; never fabricate or pad
  examples to meet the target.
- Treat a request to create a practice page as an end-to-end implementation:
  finish research and position review, page and protected APIs, all six level
  counts (24 verified positions each where suitable), game replay, worksheet
  registration, access integration, documentation, and required validation.
  Do not present a scaffold as a completed page; report genuine research gaps.

# Practice research: execution and evidence

## Efficient execution for every tactics topic

- Scope an extension to the topic, levels and number requested. A request for
  nine B additions does not reopen every approved level or require finishing
  an entire archive. New practice pages still require all six levels and the
  end-to-end integration above. Keep the target of 24 and report actual gaps.
- Use `docs/tactic-research-workflow.md` and the shared
  `scripts/research-tactics.py` workflow. Reuse its engine cache, source index,
  resumable batches and review packets for future topics. A topic must supply
  its own motif/objective adapter; an unsupported topic must fail closed,
  never fall back to generic engine-score approval. Discovery is the first
  integrated adapter; existing topic proof requirements remain authoritative.
- Read current owner removals, transfers and level choices before research.
  Reuse complete indexed games, source manifests, approved evidence and
  level-specific rejections. Import a new validated corpus once. Keep bulk
  archives and disposable caches outside Git; retain durable approvals,
  exclusions and source evidence. Do not resurrect rejected positions or
  reuse an approval for a different topic, objective or difficulty.
- Apply inexpensive legal, source, material, motif and level checks before
  deep engine work. Review small batches, prioritize genuinely missing ideas,
  and stop expanding the search once the requested additions have passed
  tactical and editorial review. Preserve unused leads for later requests.
  Group similar decision patterns for editorial review; geometric signatures
  alone neither prove duplication nor justify including similar exercises.
- For non-sacrificial levels, inspect relevant legal captures of the moving
  piece and stationary attacker, including pawn offers and offers declined
  in the sample line. An offer triggers review, not an automatic sacrifice
  verdict: check immediate equal exchanges, recaptures and the teaching payoff.
  Do this before writing final copy or exporting worksheets.
- Cache only completed analysis using the exact engine binary/version,
  relevant options and networks, full position and relevant move history,
  search budget, MultiPV, allowed roots and hash-reset policy. Changed moves,
  objectives, levels, provenance or verification code invalidate affected
  review results. A shallow result must never stand in for deeper evidence;
  search limits remain unresolved and cannot become automatic approval.
- Reuse identical engine results between review passes, while retaining
  independent tactical/editorial checks. Every surviving candidate still
  requires comparison with all legal starting moves, simpler alternatives,
  relevant strong defences, material recovery, accurate provenance and level.
  Claimed forced mates still require every legal defensive reply. No speed
  target authorizes weaker verification, padding or automatic publication.
- Run independent positions in a bounded worker pool with one engine per
  worker; benchmark worker counts rather than assuming more is faster. Use
  atomic checkpoints for completed, rejected and pending work. Never resume
  by game ID alone when the position, line or settings may have changed.
- Query the persistent candidate-position store before exporting or scanning
  complete games. Retain unselected leads and their source records outside
  Git. Cache geometric game scans separately from requested levels and owner
  decisions; apply current eligibility and approval requirements when retrieving
  leads. A cached candidate is not an approved exercise.
- Use bounded parallel collection for independent games and disjoint editorial
  packets for parallel agent review when several candidates need decisions.
  Each reviewer must apply the same full tactical/editorial requirements and
  bind a decision to the exact candidate, evidence and verification version.
  The coordinating agent checks coverage, distinctness and consistency before
  merging decisions. If parallel review is unavailable, keep the same checks.
- Finalize editorial selection and copy before packaging approved records.
  Use the shared builders and required focused checks, then export and inspect
  affected PDFs once the content is stable. Repeat checks when a change or
  failure warrants it; do not repeatedly rebuild unchanged artifacts.
- Use the reusable publication/check and PDF-preview commands instead of
  creating a new render harness for each batch. Rehearse changes in isolation,
  preserve prior data and owner decisions, and inspect affected PDF pages once
  the content is stable. Generated previews await visual inspection; rendering
  success alone is not visual approval.
- Record stage wall times, cache hits, engine calls, candidate yields and
  unresolved results. Benchmark the same fixed input and verification budgets;
  distinguish cold and warm runs, automated review from human editorial work,
  and review timing from source downloads, publication and PDF inspection.
  Report measured speedups with their scope, not an unmeasured end-to-end ETA.
- Start a run ledger before candidate lookup and finish it after editorial
  review, publication, tests and required PDF inspection. Record each phase,
  including parallel reviewer intervals; include gaps and unresolved work in
  the full elapsed time. Do not replace whole-task timing with the sum of
  engine commands or advertise a replay of known positions as fresh research.

## Adaptive workflow for every tactic, including Beginner

- The owner's new position-first flow is **Beginner only**; see
  [Beginner-only position authoring](docs/tactic-research-workflow.md#beginner-only-position-authoring).
  Extract the FEN immediately before the tactic from existing exercises, retain
  its source reference, and let the owner edit the pieces and FEN. A recorded
  solution is optional for this flow. Validate the saved position and duplicates;
  do not require engine review or a mandatory solution before owner review.
- For source-derived Beginner imports, use B, C, C*, D only by default, based
  on the owner's current level choices. Exclude A because its direct positions
  overlap Beginner. Keep extracting the FEN immediately before the motif;
  retain original Beginner compositions and preserve source exercises.
- Preserve the actual preceding position and opponent move when importing a
  Beginner FEN. Show the last-move description and origin/destination highlights,
  with read-only access to the position before it. Keep this context outside
  solution moves and free-play branches. Do not invent a preceding move for a
  composition or retain one that no longer reaches an edited FEN; distinguish
  source-game play from a teaching-analysis continuation.
- Apply this Beginner workflow to every current and future tactics topic.
  Open **Thêm thế cờ Nhập môn** and **Chỉnh sửa thế cờ / lời giải** in the shared
  authoring dialog, with nested piece setup and optional solution recording.
  Closing, Cancel or Escape discard unsaved changes and restore trigger focus;
  a successful save closes the dialog. Reuse the existing manual data store.
- Keep A, B, C, C*, D content, required solutions, research, verification,
  grading, solving behavior and publication workflow unchanged. Deriving a new
  Beginner position must not edit or reclassify its source exercise or game.
  Do not extend solutionless practice to later levels. Shared code may support
  the Beginner exception only with preserved later-level behavior.
- For solutionless Beginner positions, use free practice without automatic
  correctness/completion claims or invented answers. Keep the editing mode
  distinct from legal-move recording; invalidate incompatible recorded lines
  when the starting FEN changes. Preserve the entry's identity during edits.
  Owner-reviewed position counts are not claims of tactical verification.
- The rules below retain the agent-verified research route and its evidence
  requirements when that route is requested. They do not add an approval queue
  to the new owner-reviewed Beginner authoring flow. The shared editor, manual
  API and preceding-move display are reusable across topics. Use the shared
  `BeginnerTacticImport` and protected `/api/beginner-tactic-candidates` for
  automatic source-FEN extraction on registered topics; do not add a separate
  importer or extraction script for each page. Standard topic JSON and manual
  sources are loaded by convention; legacy storage is handled centrally.
- For future source data, store the explicit objective and, when reviewed,
  `tacticPly`: the zero-based ply immediately before the tactic in the saved
  solution, counting both sides. The shared extractor uses this marker first,
  then bounded geometry checks for familiar motifs. These checks suggest a
  position for owner review; they do not establish a tactical payoff or grade.
  When no reliable marker is available, show legal solver-turn frames and
  require the owner to choose the tactical move before import. Never label an
  arbitrary first/last move as detected, or bypass this choice to fill 24.
- Follow the [adaptive workflow](docs/tactic-research-workflow.md#adaptive-workflow-for-all-tactics)
  when adding or reviewing positions. Scope the request, read owner decisions,
  check topic/level suitability, record coverage gaps, and reuse current evidence
  before generating or researching new candidates. Target 24 where suitable;
  a scoped addition does not authorize replacing the existing collection.
- Prefer simple original compositions for agent-generated Beginner additions.
  Construct from the intended decision and defensive relationships; reuse
  suitable reviewed candidates first. A–D retain the complete master-game
  research requirements. Do not reduce an advanced combination or remove its
  defining sacrifice merely to produce a Beginner version. Keep unsuitable
  levels visible and explain the gap.
- Share collection infrastructure, legal checks, exact caches, review packets
  and publication tools. Each topic must define its own teaching families,
  essential motif, defensive resources, objective checks and distinctness
  criteria. Unsupported checks or exhausted budgets mean unverified. The
  shared CLI supports `review-compositions --topic fork` for supplied,
  agent-verified compositions. It is not a universal position generator;
  other topics still need their own motif/objective adapter.
- For short Beginner lines, check every legal starting move and all legal
  defensive replies within the stated teaching horizon, including recaptures
  and counterattacks. Retain the existing alternative/engine/editorial checks;
  a finite material horizon does not prove an eventual game win. Pins should
  be created and restrict a real defence; skewers must survive alternatives to
  moving the front piece. Reject incidental motifs and unresolved payoffs.
- Use small resumable batches. When yield is poor, inspect rejection reasons
  and change the construction constraints, teaching family or source before
  increasing search. Preserve unused leads and stable exclusions. Select by
  the learner's decision and defensive mechanism; mirrors and color changes
  alone do not add variety. Do not force 24 mechanical variations.
- Publish only after tactical and editorial review, through the existing topic
  stores and shared practice/worksheet components. Keep the owner's manual
  authoring path unchanged; it must not become a shortcut for publishing
  agent-generated, unverified exercises. Benchmark fresh additions end to end,
  with unchanged required checks and full elapsed time.

## Repository hygiene for all future requests

- Reuse parameterized collection, review, publication and rendering tools.
  Do not add a script for each player, position, numbered batch or date. Extend
  the existing tool or pass candidate IDs/configuration when its behavior is
  reusable. For defender removal, use `validate-removing-defender-batch.py`;
  the completed per-position review scripts have been retired.
- Keep scratch scripts, candidate dumps, raw archives, run ledgers, logs,
  benchmark outputs and PDF previews outside Git. Use an external cache or the
  ignored `research/scratch/`, `research/runs/` and `research/benchmarks/`
  directories. Put concise measured results in the existing workflow docs;
  keep a benchmark JSON in fixtures only when it is a fixed regression input
  or contains preservation evidence that tests actually need.
- Keep durable approvals, exclusions, selected complete games, source manifests,
  tactical proofs and reproducible review evidence. Update the existing topic
  bundles rather than creating separate evidence/source JSON files for every
  request. Discovery uses `expansion-evidence.json#record-key`; defender-removal
  and promotion reviews use their existing review bundles. Preserve stable IDs,
  per-record checksums and historical owner decisions when consolidating data.
  A small approved batch manifest is appropriate when builders need its ordered
  selection and publication boundary; it is not a disposable research dump.
- Before deleting or ignoring an existing file, inspect its imports and its
  builder, test and documentation references. Consolidate necessary contents
  first and update readers/reproduction commands. Never ignore all JSON or
  `scripts/fixtures/`, and never remove evidence merely because it was generated.
- Before finishing, inspect the files added by the task, remove its temporary
  artifacts, and run the affected rebuild/preservation tests. Do not clean up
  unrelated user changes. `.gitignore` does not untrack staged/tracked files;
  remove only the exact obsolete paths from Git when cleanup is authorized.

## Research targets and approval

- Treat 24 positions per level as the target for the task, not a reason to
  stop after a small batch. For a new page or a requested full collection,
  continue across all six levels until the target is reached or a concrete
  limitation prevents progress. For a scoped extension, finish its requested
  additions and affected integration. Do not claim a gap is unavoidable
  without sufficient search.
- Follow the established skewer collection workflow for new or expanded
  practice collections: collect and deduplicate candidates from complete games,
  run staged engine screening, independently review candidates in batches, then
  build exercise and game-source data from durable approved records. Reuse the
  pipeline or adapt its focused stages to the motif; checkpoint work so it can
  resume. A new topic may need different motif detection and objective checks.
- Reuse the shared tactic map and game index in `docs/tactics-index.md` when
  scanning source games. Record possible cross-topic matches for later review,
  preserve full-game provenance and distinguish played moves from analysis.
  Indexed tags are leads only; follow the topic-specific review and publication
  requirements before using them as exercises.
- Treat automatic grades, engine scores and candidate lines as review leads,
  not publication approval. The batch validator must check the current legal,
  alternative-move, defensive-reply, material-recovery, provenance, level and
  editorial requirements, including topic-specific requirements below. Record
  accepted and excluded positions with stable IDs and reasons; publish each
  batch that passes rather than waiting for all six levels to reach the target.
- For material-winning exercises, compare all legal starting moves and review
  relevant forcing alternatives, strong defensive replies and material recovery.
  Bounded engine searches and documented professional tactical review are
  sufficient evidence when the stated payoff and likely recovery are clear;
  describe the evidence accurately, not as an exhaustive proof. Apply any
  stricter topic-specific proof requirements stated below.
- Require coverage of every legal defensive reply when claiming a forced mate
  within a stated move limit. For other objectives, document unresolved
  defences and do not publish a position whose stated payoff remains in doubt.
- Do not end a task merely because the full collection takes substantial work.
  Give progress updates while continuing. If a concrete blocker prevents further
  work, identify it and report actual counts and remaining gaps.

This project's viewers include chess coaches/trainers, arbiters, children, and
parents. Treat this as a standing requirement for all pages and future changes.

- Use clear, concise, welcoming language that works across these audiences.
- Write Vietnamese learning materials in a professional chess-coaching register:
  use precise chess terminology, concrete practice instructions, and clear
  progression criteria. Avoid generic motivational filler, conversational AI
  phrasing, and production terms such as "chân trang" in learner-facing prose.
  Keep the wording accessible to children and parents; explain technical chess
  terms when needed. Do not imply FIDE endorsement or an international standard
  for the project's own level scheme.
- Do not assume the reader is a teacher, student, parent, or arbiter unless the
  page or section explicitly serves that role.
- In shared learning content, describe the chess idea or decision directly.
  Avoid classroom instructions such as telling teachers what to ask students.
- Keep technical implementation details and research-method notes out of the
  main learning flow; retain them in project documentation where appropriate.
- Explain unfamiliar chess terms when needed without talking down to children
  or assuming every parent has chess expertise.

# Chess editorial standards for web and PDF

Apply these standards to all new and revised pages, tactics, lessons, exercise
data, hints, feedback, solutions, introductions, summaries and PDF exports.

- Review all reader-facing wording as a professional chess coach and editor:
  precise, natural, concise and understandable to learners, parents, coaches
  and arbiters. Describe concrete chess ideas rather than using generic
  encouragement or promotional claims.
- Keep terminology consistent across the website and PDF. Prefer "thí quân",
  "phương án", "nước đáp", "lợi thế vật chất" and "thế cờ" where appropriate.
  Distinguish winning material, obtaining a winning position and winning the
  game; do not substitute one claim for another.
- Explain unfamiliar terms and notation briefly on first use when needed.
  For beginner move descriptions, pair algebraic notation with plain Vietnamese
  (for example, "Nd4 — Mã từ f5 đến d4" when that is the actual move).
  Derive origin, destination, capture, promotion, castling and check status
  from the legal position and move, never from a guessed explanation.
- Describe en passant using the captured pawn's actual square. Distinguish
  check, checkmate, stalemate ("hòa do hết nước đi (pat)"), dead positions,
  a valid repetition draw claim and automatic draw conditions. Consult the
  current official FIDE Laws when adding or changing rule-sensitive wording;
  do not treat a drawn engine/tablebase assessment as automatic game termination.
- Distinguish actual game continuation from an illustrative analysis line.
  Do not call defensive moves forced without verification, or imply that a
  published solution is unique. Preserve qualifications about alternative
  defences and the stated payoff when polishing prose.
- Keep provenance accurate and readable: retain player/event details and
  source references, and clearly identify composed or modified positions.
  Keep UI-only instructions out of print and implementation terminology out
  of shared learning prose. Use technical labels where they help in settings.
- Write new source content to this standard directly; do not rely on PDF-only
  substitutions to repair new wording. Reuse shared move-description helpers
  where applicable, and preserve existing curated FENs, moves, objectives,
  provenance and exclusions during purely editorial changes.
- Review the complete affected content, including hints, alternative lines,
  captions and empty/error states, not just headings or a few sample exercises.
  For printable topics, run `node scripts/audit-worksheet-copy.cjs` and
  `node --test scripts/test-worksheets.cjs`; inspect rendered PDFs when text
  changes can affect layout. Legal replay and editorial review are not a
  substitute for tactical verification against relevant defensive replies.

See `docs/worksheet-copy-review.md` for the established PDF conventions and
review examples. Apply the same language standard to future web content.

# Shared chess practice

- Reuse the existing draw/skewer practice components (`ChessPractice`,
  `DrawTrainer`, `PracticeBoard`) for new chess learning features. Extend them
  with focused props or content adapters when behavior differs; avoid parallel
  trainer implementations.
- Open reference games in the shared `DrawGameViewer` dialog, as draw practice
  does, rather than adding an inline game replay below the lesson.

# PDF worksheet integration

- For every new practice page, set `worksheetEndpoint` on its entry in
  `src/lib/server/private-hub.ts` to the protected exercise API returning the
  page's `DrawCategory[]` data. Update it if the page or endpoint is renamed.
- Reuse the shared worksheet/PDF generator; verify the new topic appears in
  its source selector and that all available levels and solutions can be
  selected. Keep the same access protection as interactive practice.
- Run `scripts/test-worksheets.cjs` and the relevant practice-access tests when
  adding or changing a worksheet source. Do not leave this integration for a
  separate follow-up task.

# Valid alternative practice solutions

Apply this requirement to all current and future practice pages and levels.

- A saved solution is an example, not necessarily the only correct line. Do
  not label a legal alternative incorrect merely because it is absent from
  the stored moves.
- For checkmate exercises, reuse the shared alternative-mate verification in
  `src/lib/chess/draw-trainer.ts` and `DrawTrainer`. Accept verified alternative
  preparation as well as immediate mate. Verification must establish a forced
  mate against every legal defensive reply within the remaining solver-move
  limit; a cooperative sample line or engine score alone is insufficient.
- After accepting an alternative, use a verified defensive reply and keep
  subsequent moves and hints aligned with that continuation. Mark completion
  only when the stated objective is actually reached, not merely when the
  stored sample's move count is exhausted.
- Keep verification bounded so practice remains responsive. A timeout or
  exhausted search budget means unverified, not incorrect or accepted. Give
  clear feedback without claiming the alternative has been disproved.
- For material-winning, drawing, or other objectives, use objective-specific
  verification and relevant defensive replies. Do not apply mate-only logic
  or treat any winning engine score as proof of the requested payoff. Preserve
  the topic's instructional motif and distinguish tactical verification from
  editorial motif review.
- When extending the shared trainer or adding a practice page, verify that
  alternative handling remains connected. Preserve regression coverage for
  valid unsaved preparation, both colors, defensive refutations, move limits,
  stalemate versus mate, search limits, and continuation through completion.
  Use `scripts/test-mate-alternatives.cjs` for the shared checkmate behavior.

# Required practice levels

All current and future chess practice pages, including checkmate and endgame
pages, must use this exact level order: **Beginner, A, B, C, C*, D**.
Use exactly one asterisk in `C*`; do not introduce `B*` or `C**`.

- **Beginner**: for people who have just learned how pieces move and capture.
  Use few pieces and a direct, easily recognizable idea. Composed positions
  are appropriate; real-game provenance is not required for this level.
  For current and future tactics pages, prioritize simple moves that create
  the named tactical motif and lead to a clear material gain. Keep the payoff
  short and visible; avoid sacrifices, long calculation, and incidental motifs
  where a simpler free capture already achieves the gain. For checkmate or
  other objectives, retain the page's explicit goal and the same simplicity.
  In Beginner pin practice, focus on creating a pin, then winning material,
  rather than merely recognizing or exploiting a pin already on the board.
  The pin must prevent a real escape or defence and enable the stated gain
  against relevant legal replies, including recaptures. Absolute, relative,
  cross and situational pins are eligible only when the idea and payoff remain
  easy to understand; do not force variety at the expense of clarity. Vary
  pinned pieces and sides to move without filling the set with near-duplicates.
- **A**: easy, direct application of the topic, without a sacrifice or a long
  preparatory calculation.
- **B**: slightly harder than A, with simple preparation or short coordination.
- **C**: requires a simple sacrifice with a clear tactical purpose.
- **C***: no sacrifice, but requires thinking two or three moves further ahead
  than B. Do not classify a longer non-sacrificial line as C or D merely for
  its length.
- **D**: complicated sacrifices and advanced tactical coordination requiring
  more than three moves by the solving side. Count solver moves, not plies.

Keep these levels separate from lesson topics. Labels such as "mate in one",
"mate in two", and "ladder mate" may be additional categories, but must not
replace the required level navigation. Reuse or extend the shared level UI;
do not disable it for a new topic without an explicit user request.

Use 24 verified positions per level for all current and future tactics and
checkmate practice pages unless the user explicitly specifies a different count.
Do not remove previously approved positions solely because a level already
contains more than 24; retain them unless an editorial review rejects them.
Review the complete solution, defensive replies, and shorter alternatives before
grading. Do not invent sacrifices, pad solutions, or relabel easy
positions to fill a level. If the topic does not yet have suitable examples for
a level, retain the level structure, show the actual count, and report the gap.
Do not silently substitute a different difficulty scheme.

# Exercise side to move and objective

Apply this requirement to all current and future chess practice pages and
every difficulty level.

- Before solving, prominently show the starting side to move and the specific
  objective together, in both normal and full-screen views. For example:
  "Trắng đi · Mục tiêu: Thắng vật chất", "Đen đi · Mục tiêu: Chiếu hết",
  or "Trắng đi · Mục tiêu: Hòa". Use the page's language.
- Distinguish winning material, checkmate, winning the position, drawing,
  and other lesson-specific goals. A tactic name alone is not an objective,
  and winning material must not automatically be labeled as winning the game.
- Derive the starting side from the exercise FEN and store the verified
  objective explicitly in exercise data. Do not infer it from the source
  game's result, the topic name, or free-text matching. If an objective has
  not been verified, review the exercise before assigning a label.
- Keep the exercise requirement stable while replaying or exploring moves;
  it describes the starting task, not the current turn in a variation.
- Reuse the shared practice components for this display, keeping it compact,
  readable, and visible without opening hints or revealing the solution.

# Tactical exercise selection and review

## Start from a meaningful contest; let the tactic create the advantage

- For all current and future tactic pages, prefer positions with roughly
  balanced material and meaningful counterplay, where understanding the named
  tactic is what enables the learner to gain an advantage. Avoid selecting
  exercises mainly because the solver can collect more material in an already
  overwhelmingly won position or complete an essentially unopposed conversion.
- "Roughly balanced" is an instructional preference, not a requirement for an
  engine evaluation of zero: a position containing a sound winning tactic may
  already have a winning engine score. Review the starting material, threats,
  defensive resources and alternatives to establish why finding the tactic
  matters. Equal material alone does not establish a suitable exercise.
- Prefer a concrete decision that creates the opportunity: a capture leading
  to an exchange, a check that induces a relevant exchange or defensive move,
  removing or diverting a defender, or clearing a necessary square or line.
  For promotion, show how such a decision enables promotion and its payoff,
  rather than routinely starting with an uncontested pawn already ready to
  promote. Include the preparation and relevant exchanges in the published
  solution; do not justify a routine endpoint by an unseen preceding combination.
- Verify the payoff after recaptures and against relevant defensive replies.
  Do not describe an exchange or reply as forced without checking alternatives.
  Record the initial material balance, the tactical opportunity, why routine
  alternatives do not achieve the same payoff, and the resulting gain or goal
  in the position's review evidence. A numerical gain from promotion alone is
  insufficient editorial justification for publishing a position.
- Respect the existing level definitions: Beginner may isolate a simple final
  decision to build recognition; A uses direct decisions or short preparation
  without sacrifice. Put genuine sacrifices and longer coordination in the
  appropriate later levels, rather than making every exercise a combination.
  Drawing, defensive and explicit conversion lessons may start from unequal
  positions when that imbalance is essential to their stated objective; record
  the reason. Apply this preference during selection and review, with durable
  reasons for any rejection or replacement, rather than removing existing
  approved exercises without review.

## Coverage of each tactic at every level

- Keep collections concise and varied: the user's preferred count is 24
  positions per level, not an expanding catalog of similar examples. When
  explicitly asked to clean up a level to 24, review the entire level and
  remove redundant positions, including previously approved ones. For
  discovered-attack Beginner, retain exactly the 24 curated positions and
  respect its saved selection/exclusions when rebuilding.
- Judge duplication by the learner's decision and defensive mechanism, not
  just identical FENs. Color reversals, shifted or mirrored boards, a changed
  target, or the same combination played by another piece do not by themselves
  justify another exercise. Retain related examples only when they teach a
  concrete additional decision; record that distinction and avoid placing
  them consecutively. Balance sides across the set without requiring a
  White/Black pair for every aspect. Fit broad coverage into the requested
  count rather than adding repetitive positions to fill a checklist.
- For every current and future tactics page, review the full range of ways
  to create and exploit its motif separately at Beginner, A, B, C, C*, and D.
  Reaching the position count does not establish coverage. Do not assume an
  aspect is covered at one level merely because it appears at another.
- Before selecting positions, record a topic-specific coverage checklist in
  project documentation or review data. Consider every relevant moving piece
  (including pawns and kings), the attacking and target pieces, both sides to
  move, quiet moves and captures, checks and non-checking threats, different
  lines of attack, defensive replies, and ways the motif enables the payoff.
  Cover meaningful instructional differences rather than every mechanical
  combination of these attributes or near-duplicates of the same position.
- For example, discovered-attack practice must not stop at moves by Knights,
  Bishops and Rooks. Review one- and two-square pawn advances, pawn captures,
  King and Queen moves that uncover an attack, captures by other pieces,
  discoveries by each relevant stationary slider, discovered check, double
  check, quiet double threats, and discoveries that prevent a recapture or
  uncover a pin. Derive comparable coverage lists for forks, pins, skewers
  and other tactics; do not reuse this example as a universal checklist.
- Explicitly assess special-move cases such as en passant, promotion and
  castling where they can create the topic's motif. Include them when they
  fit the level and have been verified; otherwise document why they are
  unsuitable at that level or remain an unresolved coverage gap. Do not
  silently omit an aspect or claim complete coverage while gaps remain.
- Keep every example within the established level definition. Broader
  coverage does not justify sacrifices or long calculations in Beginner,
  relabeling easy positions as advanced, or adding an incidental motif.
  Preserve approved positions when extending coverage, and apply the same
  tactical, defensive-reply, alternative-solution and provenance checks to
  every addition. Quality takes priority over filling a checklist.
- Map covered aspects to stable exercise identifiers, record missing aspects
  and level-specific exclusions, and report remaining gaps when delivering
  a new or expanded collection. Add relevant coverage regression checks so
  rebuilding a collection does not silently remove an approved aspect.

## Master-game research and provenance

- For current and future tactics and checkmate pages, research real master
  games for A–D, especially C, C*, and D; include suitable real-game examples
  in B even when composed introductory exercises already exist. Preserve
  approved Beginner exercises instead of replacing them unnecessarily.
- Reuse the established master-game PGN research pipeline and available
  validated corpora. Retain reputable source URLs and archive checksums,
  player/event/date headers, the complete legal game, the exact exercise FEN,
  source ply, and preceding move when available. Save these locally in code;
  practice and replay must not depend on temporary external links.
- Search complete tournament or player PGNs from PGN Mentor and The Week in
  Chess, together with the project's validated local game corpora. Lichess
  puzzle records (FEN, solution, theme, rating and game URL) may suggest
  candidates, but a puzzle rating or link does not establish a master game.
  Resolve a lead to its complete original PGN and verify the players' master
  credentials when that provenance matters. Do not publish from a puzzle
  snippet or a reconstructed game.
- Make broad promotion scans efficient without lowering publication standards:
  normalize and deduplicate complete games, then deduplicate candidate FENs and
  learner-decision signatures before engine work. Apply inexpensive legal,
  material-window, promotion-distance and motif filters first. Use a staged
  engine screen: shallow analysis for broad ranking, then deeper analysis of a
  shortlist; the final starting-move comparison must still cover every legal
  move. Run all-reply objective proofs only on candidates that survive those
  screens. Cache engine results by position FEN, engine name/version, and exact
  settings (including node or depth limit, MultiPV and relevant options); never
  reuse a lower-budget screen as a higher-budget result or as a proof. Checkpoint
  completed batches atomically so an interrupted scan can resume, and label
  unfinished or timed-out work as incomplete/unverified. Keep this disposable
  scan cache outside the repository; retain only selected evidence, rejections,
  source manifests and reproducible review data in project files.
- Scale game discovery in this order: deduplicate and re-search validated local
  corpora; add PGN Mentor player and event archives; then add The Week in Chess
  issue or tournament PGNs in dated batches. Maintain a corpus manifest with
  the exact source URL, archive SHA-256, retrieval date, game count and parsing
  result for every batch. Deduplicate across sources by normalized complete
  game move sequence while retaining all source references. Keep raw bulk
  archives outside the repository; save selected complete games and their
  evidence in the project fixtures.
- Use the Lichess puzzle database as a high-recall lead index: filter its FEN,
  moves and themes, follow `GameUrl`, and resolve each promising lead to the
  full game before review. Puzzle rating, theme and URL are discovery metadata,
  not evidence of master-game provenance. The Lichess rated-game dumps are an
  optional supplementary search source only when a known player or event can
  be identified and the complete game can be independently sourced; do not
  ingest the large general dump as if it were a master-game corpus.
- Search both played promotions and games where promotion was threatened but
  not played (including resignations). Begin with several plies before played
  promotions, then widen the window for longer C*/D combinations; also inspect
  balanced passer endgames without a played promotion. Preserve when the game
  ended before the teaching payoff and label any verified continuation as
  analysis. High-recall filters and engine screens create leads only; every
  published exercise still needs the full provenance, legal replay, objective
  verification, alternatives/replies review and level-specific editorial check
  below.
- Treat a roughly balanced start as a preference for material-promotion
  exercises, not an eligibility gate. A promotion position may begin with a
  material imbalance or a favorable engine evaluation when the learner still
  faces a concrete, meaningful promotion decision: the correct preparation,
  timing, exchange, capture-promotion, pawn-race calculation or promotion choice
  must create, preserve or decisively convert the stated material payoff.
  Include positions where promotion is the tactical answer to a real defensive
  resource even if the side to move is already somewhat better. Do not use
  positions where the side can make an unopposed routine promotion, collect a
  free piece independently of promotion, or choose an unrelated simpler tactic
  to achieve the same or better result. Review material, counterplay, all legal
  starting moves and relevant replies; use engine scores as leads, not verdicts.
  Record why the promotion decision is instructional and why a simpler move
  does not make it incidental. This broader selection rule does not relax
  real-game provenance, level definitions, sacrifice requirements, tactical
  proof, counterpromotion review or distinctness. Apply it in a pilot batch and
  report the actual counts and remaining gaps; never add examples just to fill
  24.
  For material-promotion proofs, continue beyond the first promotion when the opponent has a live passed pawn or a forcing counterpromotion. A certificate that stops while a counter-passer can promote does not establish a durable material gain; verify the resulting exchange or other stated payoff against that promotion before publishing.
- For each candidate, legally replay the original game to the exact exercise
  FEN and preceding move; save the complete game, source URL, archive SHA-256,
  headers and source ply locally. Check that the named motif is essential,
  analyze strong defensive replies and valid alternatives, then deduplicate
  by learner decision and defensive mechanism before grading. Preserve the
  actual played continuation separately from an engine-verified teaching line,
  including when the game ended before the tactical payoff was played.
- Distinguish the actual game continuation from an engine-verified teaching
  variation. Never invent game provenance or label a composed position as a
  master game. Open saved full games through the shared `DrawGameViewer`.
- Verify legal moves, the complete stated payoff, relevant defensive replies,
  and meaningful alternatives with targeted engine analysis. Review shorter
  solutions and material recovery before assigning a level. For checkmate
  exercises, show the full mating line and verify actual checkmate; for a
  two-rook motif, establish how both rooks contribute to the mate.
- Select positions for instructional value, not merely a matching engine
  label or a quota. Use distinct games where practical, avoid counting shifted
  starts of the same combination as separate research examples, and keep
  durable per-position review evidence and exclusions.

Apply these requirements to every difficulty level of every current and future
tactics topic, including forks, skewers, pins, and discovered checks/attacks.

- The named tactical motif must be essential to achieving the exercise's
  stated material gain or checkmate, not merely present in a winning position.
  Explain exactly which defence it restricts or which threat it creates, and
  why that enables the payoff. Apply this standard to every current and future
  tactics page and every level, including Beginner.
- Before accepting an exercise, check simpler captures, checks, exchanges and
  mating continuations from the starting position, with relevant defensive
  replies and material recovery. Remove positions where a simple alternative
  already wins material or achieves the stated mate without using the lesson's
  motif. Do not retain an example merely because its stored motif line wins
  more material, has a higher engine score or gives a faster mate.
- Compare the published solution with all legal starting moves, not only
  captures or moves already stored as alternatives. Explicitly check every
  legal move for immediate checkmate, then examine forcing checks, quiet mating
  threats and stronger tactical continuations with relevant defensive replies.
  A quiet move can be better than the intended capture and must not be missed.
- Reject or rework a material-winning exercise when another move gives a
  verified forced mate, or a clearly superior tactical payoff with no greater
  difficulty. Do not ask learners to win a pawn when a straightforward mating
  continuation is available. For a mating exercise, review shorter forced mates
  before publishing a longer line. Equivalent valid motif-based solutions are
  acceptable; this rule does not require uniqueness.
- Verify claimed mates by legal replay and coverage of every legal defensive
  reply within the stated move limit. An engine mate score or one cooperative
  principal variation is a lead for review, not proof. Distinguish immediate
  checkmate, a forced mating continuation and a threat that can be defended.
  Record the competing move, exact position, defensive analysis and editorial
  decision; do not silently ignore a better move because it misses the lesson's
  intended objective. Keep unresolved candidates unpublished until reviewed.
- For example, reject a pin exercise if a rook can simply capture a pawn safely
  with check, bypassing the intended queen capture that exploits the pin. Also
  reject a position where directly capturing the pinned piece already wins
  the exchange without needing the intended pinned-defender tactic. A smaller
  direct material gain still undermines the lesson; comparing only the larger
  stored payoff is insufficient.
- Prefer positions where the motif prevents a recapture, makes a recapture
  lose more material, forces a choice between threats, wins a target after a
  more valuable piece moves, or lets a piece move to safety with tempo before
  collecting material. For example, a pin should restrict a relevant defence,
  a fork should create competing threats, and a skewer should exploit the
  exposed target behind the first piece.
- Reject weak examples whose published payoff is just an undefended capture
  or an ordinary favorable exchange with an incidental motif. Check whether
  material can already be won safely without the motif and whether an apparent
  recapture is actually legal and effective. Alternative solutions that also
  exploit the intended motif are welcome; uniqueness is not required. Keep
  editorial selection separate from move validation: a legal alternative must
  not be labeled incorrect merely because it bypasses the intended motif.
- Review the complete published solution, including preparation, sacrifices,
  defensive replies, recaptures, and material recovery. Do not judge solely
  by the first move, the final capture, a motif label, or an engine score.
  The exercise must show the relevant payoff; do not justify a weak stopping
  point by an interesting continuation that learners are never shown.
- Apply this standard across the whole requested review scope, not only the
  easiest level. Use legal-move checks and targeted engine analysis where
  needed to resolve uncertainty, and distinguish editorial judgments from
  claims of tactical correctness or exhaustive proof.
- Instructional quality takes priority over quotas and collection size. Do
  not retain, restore, or add weak examples merely to reach a target count.
- Record review decisions with stable game/exercise identifiers, the exact
  position and solution, and a specific tactical reason in project data or
  documentation. Keep durable exclusions respected by collection builders
  so rejected examples do not return on regeneration. Rebuild affected data,
  update documented counts, and run the relevant validation checks.

# Compact, clear UI controls

- Proactively reduce unnecessary vertical space and scrolling in settings: group
  related toggles on wrapping rows, size numeric inputs to their content, align
  controls, and use short contextual helper text rather than repeated paragraphs.
  Keep 44px touch targets, readable labels, keyboard focus and responsive wrapping;
  compact layouts must not introduce clipping or horizontal scrolling. Review
  both desktop and narrow-screen layouts when changing these controls.

- For two-option settings, prefer a labeled checkbox over a dropdown when the
  choices represent enabled/disabled behavior. State clearly what checked and
  unchecked mean; add concise help when the alternative is not obvious. Use
  visible radio buttons for two distinct modes that do not fit an on/off label.
  Preserve the intended default: new-position review and final review are
  checked by default; cumulative review is unchecked. Periodic reviews cover
  only the latest group (default 2 topics and 1 review page), while the final
  review covers all topics with its own page count (default 1). Review quantity
  comes from pages × `POSITIONS_PER_PAGE` (6), shared fairly across topics and
  then their levels; selected levels must not multiply the requested pages.
  Recalculate allocations when the interval or page count changes. Show a
  non-blocking warning and the actual distribution when the total does not
  divide evenly among topics, with a suggested page count for equal shares.
  Report insufficient coverage or source exercises; never silently repeat,
  drop levels, underfill pages, or change the requested quantity. Keep group
  and final review page budgets independent, including at the same endpoint.
  Distinguish group reviews from the final whole-book review with explicit
  headings and short scope descriptions. Label source/shuffle options as shared;
  keep page quantities in their respective panels and use the same distinction
  in dialogs. Custom allocations must fill the selected number of pages.

- Keep related actions on one row where practical, particularly on cards and
  teaching screens. Shorten labels and use familiar icons instead of stacking
  long buttons or adding avoidable scrolling.
- Icon-only buttons need a descriptive accessible label and a tooltip/title;
  keep touch targets at least 44 × 44 px and visible keyboard focus.
- Check available card width and responsive layouts when adding controls.
  Preserve clear text for primary actions or unfamiliar concepts.
- Make dropdowns visibly recognizable on all current and future pages: show
  a down chevron or the browser's native select arrow, consistently within
  each interface. Reserve space so long values cannot overlap the indicator.
  Prefer native selects for ordinary choices to preserve keyboard, touch and
  screen-reader behavior. Custom decorative indicators must not intercept
  clicks or add a redundant accessible label. Keep visible focus, disabled
  styling and a native indicator fallback in forced-colors mode; check narrow
  screens and long Vietnamese labels when styling these controls.

## Promotion coverage

- On the material-promotion practice page, publish levels B, C, C*, and D
  only from legally replayed real games. A composed position may remain in
  research or rejection data, but must not appear in those published levels.
  Keep the empty level visible and report its actual count while suitable game
  positions are researched; never relabel a composition or invent provenance.
  Save the complete game, source URL and archive checksum, player/event/date
  headers, exact exercise FEN and source ply, preceding move when available,
  and verified tactical line in the consolidated topic review and local game
  source data. The all-reply and alternative-move standards above still apply.

- For material-promotion level B, teach a short, non-sacrificial preparation
  that makes promotion work against a real defence. Suitable decisions include
  blocking a defender's line, exchanging or displacing a piece that controls
  the promotion square, making a checking move to gain a tempo, coordinating
  the King or a minor piece to protect the new piece, or stopping the opponent's
  passer before promoting. An equal-value exchange is not a sacrifice; if the
  solver must knowingly give up material for the promotion, review it for C.
  Judge the level by the decision and calculation, not line length alone. A
  capture that removes the only piece controlling the promotion square can be a
  B-level preparation when immediate promotion fails, the capture is not a
  sacrifice, and the resulting material gain is verified against every legal
  defence. Keep a winning pawn ending out of the material-promotion set unless
  material is actually gained; assign a position-winning objective only on a
  page that supports and states that objective.
- Compare the legal pawn choices from the starting position: a straight advance,
  a capture-promotion, and any useful preparatory move. A capture-promotion is
  not automatically sound: verify whether the opponent can capture the new
  piece, keep control of its square, or promote with tempo. Sometimes the pawn
  must advance quietly because a capture leaves the promotion square defended;
  sometimes a check, block or equal exchange must first remove that defence.
  Include the relevant branch and material payoff in the solution.
- Preserve a level-B coverage map for defender blocks/removals, equal exchanges,
  tempo checks, King/minor-piece support, advance-versus-capture choices,
  defended promotion squares, and opposing pawn races/counterpromotions. Map
  every covered decision to a stable exercise ID and list missing aspects. Do
  not fill the 24-position target with mirrored versions, routine promotions,
  or near-duplicates. Review all legal starting moves, replies, recaptures and
  promotion safety under the existing tactical-selection standards.
- To find more B candidates, widen discovery beyond games with a played
  promotion. Replay every legal move in each saved, checksummed master-game
  batch and inspect positions with a passed pawn on ranks 5–7 (or the mirrored
  ranks for Black) when a defender controls the route or promotion square.
  Search short windows before and after checks, blocks, interpositions, equal
  exchanges, rook/queen trades, and pawn captures; include games that end by
  resignation before the promotion and label any continuation as analysis.
  Compare straight advances, capture-promotions, and preparatory moves. A
  high-recall pattern or material certificate is a lead only: publish only
  after full-game replay, all-legal-root comparison, all-reply payoff and
  promoted-piece safety, plus a distinct learner-decision review. Expand to
  older TWIC issues and additional PGN Mentor player/event archives in dated,
  checksummed batches before relaxing any instructional or proof criterion.

- For Beginner capture-promotion examples introducing later exchange or
  sacrifice combinations, put the opposing King on the same last rank as
  the captured piece. Teach the final capture-promotion first, including
  the check it gives when applicable. Keep actual preparatory exchanges and
  sacrifices in their appropriate later levels. Do not invent a preceding
  forced exchange or sacrifice; verify any such continuation before adding it.

- Beginner promotion builds the foundation for A and later levels through
  direct advances to rank 1/8 and capture-promotions. Review captures near an
  opposing King on the last rank, including whether the new piece is safe.
  Keep these decisions short and concrete; preserve the 24-position target
  and the distinct-idea requirement rather than adding transformed copies.

- At Beginner, explicitly review capturing onto the last rank to promote, alongside
  advancing without capture. Include verified capture-promotion decisions where
  suitable; document gaps. Changing the captured piece, board orientation or
  pawn file alone does not establish a distinct instructional decision.

- Promotions that require choosing a piece to avoid stalemate (pat) start at
  level A, never Beginner. Apply this to every promotion category and PDF.
  Beginner retains direct promotion and capture-promotion with a visible payoff.
