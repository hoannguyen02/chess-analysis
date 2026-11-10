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
The 10-piece limit and unique-answer proof apply to newly verified
exercises. Manual Beginner positions retain editable boards, optional
solutions and free practice. [Verified Beginner requirements](beginner-one-move-game-requirements.md)
The owner uses this flow to fill Beginner on new tactics pages. In
**Nhập môn / Beginner**, choose **Lấy thế cờ từ B, C, C*, D, D*, E, E\*** and confirm the
positions to import. The preview starts immediately before the selected tactic.
Each saved board becomes a separate Beginner entry and preserves the source
exercise. Use **Thêm thế cờ Nhập môn** to set up a board directly.

Choose **Chỉnh sửa thế cờ** to add, move or remove pieces, set the side to move,
or import/export FEN. The piece editor reuses Setup Board's shared drag manager
and paint layer: select a piece once, then click or sweep across empty squares
to place copies. Dropping from the tray keeps that piece selected; existing
pieces remain draggable, and dragging off the board removes them. Each sweep
is one undo step. **Di chuyển quân** or **D** exits placement mode; Escape still
discards the setup dialog. Apply (check), cancel (cross) and copy (overlapping
sheets) share the compact row with **Đặt theo FEN**, using accessible labels and
tooltips. Undo and Cancel stay inside the draft; use the outer Save
button to persist. Changing FEN clears recorded lines and stale preceding-move
context. Solutionless entries use free practice and print no invented answer.
A, B, C, C*, D, D*, E and E* use the required-solution behavior below.

On practice pages, **Thêm thế cờ Nhập môn** and **Chỉnh sửa thế cờ / lời giải**
open a dialog instead of expanding the form inline. The close button, **Hủy**,
or Escape discard the unsaved draft and return focus to the opening button.
Piece placement and solution recording open nested dialogs; closing either
returns to the authoring form. A successful save closes the authoring dialog.
**Thêm thế cờ Nhập môn** uses the current topic and Beginner level automatically,
so its dialog hides those two selectors. The objective remains an explicit choice.
For new entries, **Vị trí chèn** defaults to **Đầu danh sách**. Choose **Cuối danh sách**
or **Trước bài số…** (1 through the current Beginner count) to insert elsewhere.
Inserting before exercise 10 makes the new entry number 10. Saved placement uses
stable following-exercise references, with the next surviving neighbour as fallback;
when none remain, it falls at the end. New first insertions precede earlier ones.
Placement applies after owner removals, level changes and transfers, and the
protected practice/worksheet APIs share the same order. Editing an existing entry
preserves its placement. Bulk source imports keep their existing order.

In the shared reference-game viewer choose **＋ Thêm thế cờ**. The position is
captured from the currently displayed move. Choose **Chủ đề**, **Cấp độ** and
**Mục tiêu**, then choose **Ghi phương án trên bàn cờ**. The topic picker follows
the shared teaching order. Type a topic name with or without Vietnamese accents
to narrow the list. The same picker is used for exercise transfers. For defence, choose
**Hóa giải đe dọa** to stop a specific threat, **Cân bằng thế cờ** to restore
an even position, or **Giữ lợi thế** to preserve an existing advantage. The
selected objective appears in practice and on worksheet review pages.
Play moves for both sides. To create a second or third variation, select an
earlier move (or **Thế bắt đầu**) and play a different move; the existing line
stays available.
The recorder uses the existing `PracticeExploration` and shared `PracticeBoard`,
including legal-move input, annotations, castling, en passant and promotion.
Recording follows Chess.com Live. It stops at checkmate, stalemate, the third
occurrence of the same position, or 50 moves by each side without a pawn move
or capture. The material rule includes a single minor piece per side and two
knights against a bare king, with the Live exception when the side to move
has mate in one. Repetition counts the exercise start and the recorded moves
in the current branch. Earlier positions are still available for branching.
Both save paths reject moves after an automatic ending. Older lines remain
readable and can be shortened with **Kết thúc phương án tại đây**.
[Chess.com draw rules](https://support.chess.com/en/articles/8572743-how-do-draws-work) ·
[Chess.com material rules](https://support.chess.com/en/articles/8705277-what-does-insufficient-mating-material-mean)

Choose **OK · Giữ ... phương án** to keep all recorded lines and close the
recorder. **Hủy**, the close button or Escape discard this recording session's
changes. Reopening the recorder starts with the lines already in the form.
**Phân tích ↗** beneath the recording board opens its currently displayed FEN in
a separate analysis tab; the recorder and its unsaved variations stay open.
You can select the main line, delete a variation or use **Kết thúc phương án tại
đây** to trim its continuation. The starting FEN and preceding move stay outside
the recording and are never replaced by the position currently displayed on the
recording board. Recording accepts up to 12 distinct lines of 120 plies each;
these bounds protect responsiveness and do not restrict the usual 2-3 variants.

After OK, the form shows numbered notation automatically; no move text needs to
be typed. Add an optional title or explanation, then save the exercise.
The protected API still accepts older SAN/UCI input for compatibility, including
spaced move numbers, commas and standalone separators.
Saving keeps the game viewer on the displayed move. The confirmation offers
**Mở bài tập →** to open the chosen topic and level with the saved exercise
selected. If the game viewer is open over a practice list, that list refreshes
when the viewer closes. Adding from **Ván đã lưu** keeps the current collection
filters. **☆ Lưu ván** saves the game and its move marker in place.

Editing replaces the existing record in place, preserving its list number and
identity even when a Beginner FEN changes. The filtered practice list refreshes
in place after a manual edit, addition or import. New manual entries append;
editing a curated Beginner uses its original
slot, and solution changes on transferred exercises preserve their destination
order. No existing collection is globally re-sorted to recover historical order.

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
entry in `privatePages`, including its worksheet endpoint. All nine levels remain
visible in order (Beginner, A, B, C, C*, D, D*, E, E*) with their actual counts.
There is no automatic quota filling or new researched collection.

A recorded solution is a teaching variation supplied by the author. The shared
trainer, board, alternative handling, side/objective display and game dialog
remain in use. A source reference uses the shared viewer. When an illustrative
or edited exercise differs from its source marker, it opens **Thế cờ bài tập**
at the exercise's exact FEN, retaining a valid preceding move and any recorded
solution branches. **Ván gốc** separately shows the unchanged saved game at its
source marker; this is labelled **Vị trí nguồn trong ván**, rather than claiming
it is the exercise position. Matching positions keep the ordinary game viewer,
and saved-game bookmarks retain their existing behavior. The preview is derived
at runtime and does not rewrite manual entries, source games or source pointers.
The manual position does not copy its complete moves. Use **Chỉnh sửa thế cờ / lời
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
