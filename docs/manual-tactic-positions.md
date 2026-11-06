# Manually authored tactic positions

Manual authoring follows the owner's explicit workflow: choose a topic, level
and objective, optionally record a solution for Beginner (required for A–D),
and add directly to practice. There is
no engine review, approval queue, or automatic grading step. The author is
responsible for the tactical idea, relevant defences, objective and difficulty.
Server validation checks FEN, legal replay, required fields and actual checkmate
at the end of a checkmate sample; it does not claim a forced all-reply proof.

## Use

The **Beginner-only** position-first flow supports editable piece setup/FEN
and optional recorded solutions. See
[Beginner-only position authoring](tactic-research-workflow.md#beginner-only-position-authoring).
Choose **Chỉnh sửa thế cờ** to add, move or remove pieces, set the side to move,
or import/export FEN. Undo and Cancel stay inside the draft; use the outer Save
button to persist. Changing FEN clears recorded lines and stale preceding-move
context. Solutionless entries use free practice and print no invented answer.
A, B, C, C*, D keep the existing authoring and required-solution behavior below.

On practice pages, **Thêm thế cờ Nhập môn** and **Chỉnh sửa thế cờ / lời giải**
open a dialog instead of expanding the form inline. The close button, **Hủy**,
or Escape discard the unsaved draft and return focus to the opening button.
Piece placement and solution recording open nested dialogs; closing either
returns to the authoring form. A successful save closes the authoring dialog.

In the shared reference-game viewer choose **＋ Thêm thế cờ**. The position is
captured from the currently displayed move. Choose **Chủ đề**, **Cấp độ** and
**Mục tiêu**, then choose **Ghi phương án trên bàn cờ**. Play moves for both
sides. To create a second or third variation, select an earlier move (or
**Thế bắt đầu**) and play a different move; the existing line stays available.
The recorder uses the existing `PracticeExploration` and shared `PracticeBoard`,
including legal-move input, annotations, castling, en passant and promotion.

Choose **OK · Giữ ... phương án** to keep all recorded lines and close the
recorder. **Hủy**, the close button or Escape discard this recording session's
changes. Reopening the recorder starts with the lines already in the form.
You can select the main line, delete a variation or use **Kết thúc phương án tại
đây** to trim its continuation. The starting FEN and preceding move stay outside
the recording and are never replaced by the position currently displayed on the
recording board. Recording accepts up to 12 distinct lines of 120 plies each;
these bounds protect responsiveness and do not restrict the usual 2-3 variants.

After OK, the form shows numbered notation automatically; no move text needs to
be typed. Add an optional title or explanation, then save the exercise.
The protected API still accepts older SAN/UCI input for compatibility, including
spaced move numbers, commas and standalone separators.
Saving opens the destination topic with the chosen level and new exercise
selected. Source games need not be saved as favorites. **☆ Lưu ván** is a separate
optional action.

The preceding move is captured automatically with its position before the move,
including castling/en-passant rights and move counters. It remains separate from
the required solution, which starts at the selected exercise position. This
context is also recovered when adding from an older bookmark, retained during
edits and level changes, and carried when copying the position to another topic.
Practice exposes it through **Xem nước trước** and worksheets retain the same
preceding-move caption. At the beginning of a source line no preceding move is
invented. Only this one position/move pair is needed, not a full-game copy.

Beginner free practice and the shared source preview show the opponent's last
move in notation and plain Vietnamese, highlighting its origin and destination.
**Xem nước trước** displays the position before that move; **Trở lại thế đang
xem** returns without changing the exercise or explored branches. Moves cannot
be played while viewing this context. The context is separate from the optional
solution. Composed boards without a recorded preceding move show no invented
history; changing the FEN clears incompatible context.

Existing topics receive the position in their existing protected exercise API.
For example, Fork D is merged into `/api/fork-exercises`, appears in `/fork` and
uses the same worksheet source. Topics without an existing page use the shared
`/tactic-positions?theme=...` page and protected
`/api/manual-tactic-exercises?theme=...` API. The main library adds a card for each
such topic containing manually authored positions. King attack has a permanent
entry in `privatePages`, including its worksheet endpoint. All six levels remain
visible in order: Beginner, A, B, C, C*, D, with actual counts, including zero.
There is no automatic quota filling or new researched collection.

A recorded solution is a teaching variation supplied by the author. The shared
trainer, board, alternative handling, side/objective display and game dialog
remain in use. A source reference opens the already stored original game; the
manual position does not copy its complete moves. Use **Chỉnh sửa thế cờ / lời
giải** on a Beginner exercise, or **Sửa thế cờ tự thêm** at A–D, to edit it. **Quản lý bài tập**
provides level changes and reversible removal for manual and curated exercises;
see [practice management](practice-management.md).
Under **Xem lời giải**, **Phương án lời giải** selects each saved continuation.

## Data and identity

`src/lib/server/manual-tactics.json` stores only each position, solution and
optional source marker/headers, preceding move and opening caption. It contains
no full-game `source.lines` snapshot and does not write `saved-games.json`.
Records carry a `manualId` when adapted for practice and a manual difficulty
status; their source caption identifies manual entry, and sacrifice counts are
not invented from the chosen level. The suggested
level annotations of the earlier bookmark feature are not used for new entries.

Normalized starting FEN (first four fields, including side, castling and en
passant) is checked for duplicates within a topic. Beginner copies use a
separate identity namespace so a pre-tactic board can coexist with its A–D
source at the same FEN. Editing a Beginner keeps its manual ID even when the
FEN changes; stale updates and collisions are rejected. A–D identities remain
unchanged. A solutionless Beginner cannot be moved into A–D without a solution.

`beginnerOriginalFen` retains the source board, `beginnerSourceLevel` records
the source level, and an optional `beginnerBaseFen` identifies a curated
Beginner overlay. Such an overlay replaces only that original Beginner, never
an A–D exercise. Source headers/references remain immutable on edits, and a
changed board is labeled as modified. Existing topic builders cannot erase the
separate manual overlay. No new per-position source/evidence files are needed.

All operations require existing practice access. Local development writes use
an exclusive lock, atomic rename and expected modification timestamps. Production
reads the bundled snapshot and denies writes, as saved games already do. Commit
and deploy the data file to distribute authored exercises. No browser storage or
new public access is introduced.

Legacy position bookmarks remain readable in `/saved-games`. **Thêm vào bài tập**
preselects their topic and level. A–D require a recorded solution; Beginner may
be saved without one. They are not silently converted or deleted.

## Validation

- `node --test scripts/test-manual-tactics.cjs`: required solutions, legal SAN/UCI,
  objectives, manual level choices, minimal persistence, conflict/lock handling,
  production protection, duplicates, real Fork API and worksheet integration,
  discovery subcategories and generic manual topic sources. All writes use a
  temporary directory.
- Existing practice-access, library, discovery, defender-removal, skewer,
  worksheet, mate-alternative and exploration regression suites.
- `node scripts/audit-worksheet-copy.cjs`, TypeScript and ESLint.
- Browser: submit a temporary exercise from the source-game viewer, verify the
  destination level count and selected exercise, replay its solution, edit it,
  confirm the saved-game collection is untouched, and remove the temporary item.

## Recorded alternatives

The first recorded line is `moves`; the remaining lines are `alternativeLines`.
Every line is legally replayed from the same exercise FEN, and duplicate lines
are removed. For a checkmate objective every stored sample must actually end in
checkmate. This is sample validation, not a claim that every defence is forced.
The manual move-count metadata uses the longest stored variation.

The shared trainer accepts stored alternative solver moves and keeps the
continuation aligned with them. The existing bounded verification for unsaved
mate alternatives is preserved. PDF solutions print all recorded lines through
the existing worksheet generator. Updates retain alternatives when the field
is omitted, and an explicit empty array clears them.

Browser checks cover continuous play, branching into three lines, OK and Cancel,
reopening, choosing a main line, deleting a variation, the solution selector,
nested source-game dialogs and narrow screens. Regression coverage is in
`test-practice-exploration.cjs` and `test-manual-tactics.cjs`.
