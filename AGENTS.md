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
  only the latest group (default 3 topics, 6 positions per topic), while the
  final review covers all topics. Apply this preference to future controls.

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

- At Beginner, explicitly review capturing onto the last rank to promote, alongside
  advancing without capture. Include verified capture-promotion decisions where
  suitable; document gaps. Changing the captured piece, board orientation or
  pawn file alone does not establish a distinct instructional decision.
