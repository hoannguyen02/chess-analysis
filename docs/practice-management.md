# Manual practice review

While reviewing any shared practice exercise, open **⋯ (Quản lý bài tập)** at
the right of the side/objective row. The controls open in a compact dialog. Choose
one of **Beginner, A, B, C, C*, D, D*, E, E\***, optionally record a reason, then choose
**Chuyển cấp độ**. The filtered list refreshes in place and the confirmation
offers **Mở bài tập →** to open the exercise at its destination.
The nine levels remain visible with actual counts; no positions are invented or
replaced to maintain the target of 24 per level.

**Bỏ khỏi bài tập** excludes the position from interactive practice and future
worksheet selection. It does not erase its source or solution. When reviewing
positions in sequence, a move or removal selects the next exercise in the same
filtered slot if the current exercise leaves the list. If it was the last
exercise, review continues with the previous one. A stable exercise key and a
clamped index keep the level, category, Beginner skewer kind and list page
selected when the protected catalog refreshes. Removing the sole exercise
leaves that level's empty state visible. Cancelling removal keeps the current
selection. The **Bài đã bỏ** and **Bài đã chuyển** history panels have
been removed from shared practice pages. Removal, level changes, transfers and
resets show a confirmation naming the exercise and requested change before
saving. Cancelling sends no mutation. A moved exercise still offers **Trả về
cấp độ ...** to recover its source classification. These are manual editorial
decisions, not a new automatic tactical assessment.

Both curated and manually authored exercises use these controls. **Chỉnh sửa
lời giải / phương án** opens solution editing from the same dialog. Manual
and Beginner entries reuse their existing position-authoring dialog. If a
level override exists, that editor displays the effective level and directs
level changes to **Quản lý bài tập**. Its older irreversible removal control has
been replaced by the shared reversible removal.

## Persistence and identity

`src/lib/server/practice-adjustments.json` is a durable overlay applied after
manual entries are merged into the protected exercise catalog. An identifier
hashes the canonical topic route and the first four FEN fields. Move counters
and category filters do not change identity. Discovery's combined and motif
subcategories share decisions; the Draw overview and its topic routes share
the same canonical scope. The same position in another topic is independent.

Each decision retains an exact FEN and solution snapshot, alternatives, objective,
preceding move and source reference when supplied, plus the original level, user
note, action history and modification timestamp. The overlay changes visibility,
difficulty metadata and, when explicitly saved, teaching solutions. It preserves
existing source files, full games, objectives, tactical verification settings
and provenance. A user
classification is labelled manual; no sacrifice count or tactical proof is
invented. Resetting the level recovers the original difficulty data.

Collection builders can regenerate their source JSON without erasing these
manual exclusions or level choices. Interactive practice and WorksheetBuilder
consume the same adjusted protected catalogs, so counts, eligible levels,
solutions and exclusions agree. Previously downloaded PDFs remain unchanged.
Empty levels and topics with removed positions retain all nine level controls.
Saved decisions and history remain in the overlay; the protected API retains
restoration support, but there is no removed-position list or restore button on
the practice page.
Solution edits appear in future worksheet exports; existing PDFs are unchanged.

Like manual authoring, management is writable only in local development and
requires existing practice access. Production uses the bundled overlay and
rejects mutations; commit and deploy the data file to distribute decisions.
No new public route exposes private exercises. Writes use exclusive locking,
atomic rename and expected timestamps to reject concurrent edits. The protected
catalog signs its source snapshot with a server-side HMAC; move/removal and solution requests
must carry that signature, preventing fabricated or altered source snapshots.
Restoration uses the existing stored record. Access secrets are never included
in responses or stored in the overlay.

Level/removal-only decisions affect matching positions supplied by the original
catalog. Cross-topic transfers retain a durable content snapshot as described
below. Source research and tactical/editorial verification requirements still
apply to additions and changes to chess content.

## Validation

- `node --test scripts/test-practice-management.cjs`: move/remove/restore/reset,
  all nine levels, unchanged solutions, history, identity, scope isolation,
  access/production guards, signed references, stale writes, lock/error safety,
  real Discovery API subcategories and worksheet eligibility, manual generic
  topics, and Draw aliases including empty recovery.
- Shared manual authoring, practice access, level, worksheet, mate alternative
  and exploration regression suites; `node scripts/audit-worksheet-copy.cjs`.
- `node --test scripts/test-practice-management-controls.cjs`: cancellation
  prevents writes and refreshes. Confirmed removal, level changes, transfers,
  resets and solution saves refresh in place and retain the signed request.
- TypeScript, ESLint and production build.
- Browser: confirm the history panels are absent, open the management dialog,
  cancel a removal confirmation and verify the exercise remains. Check desktop
  and narrow-screen controls without changing the owner's saved decisions.

## Move to another tactic page

**Chủ đề đích** in **Quản lý bài tập** selects the destination page. Pick its
level and choose **Chuyển bài tập**. Keeping the current topic instead offers
**Chuyển cấp độ**. Destination topics follow the same teaching sequence as the
worksheet builder. Every destination uses Beginner, A, B, C, C*, D, D*, E, E*. This is
the owner's manual classification, with no automatic motif or difficulty claim.

A transfer removes the exercise from its current page and inserts it at the
selected topic/level in one atomic overlay update. Its original identity stays
stable across further moves. **Trả về chủ đề và cấp độ ban đầu** on the
destination returns it after confirmation. Removing a transferred exercise hides
it from its current topic; a later API restoration keeps that topic and level.
Empty source topics retain all nine levels. Practice pages do not display removed
or transferred history lists.

The decision's optional `destinationScope` records the current topic. New source
references carry a signed full `exercise` snapshot: solutions, alternatives,
hints, objectives, verification settings, preceding move, player captions,
provenance and game-source pointers remain intact. The source game still opens
through the shared viewer using its original collection, without copying PGN.
Older level/removal records need no migration; transferring from an older open
client requires reloading to obtain a complete signed source snapshot.

Transferred curated exercises use that durable snapshot after the move; rebuilding
the original collection cannot erase the owner's reclassification. This is a
manual editorial copy of the source content, not a new research approval. Manual
exercises continue reading their editable authored record, so later solution
edits appear at the destination. Their editor identifies the assigned topic and
saves back to the same record; its return link opens the current destination.

Before changing either page, the API rejects a destination already containing
the same normalized position, including curated, manually authored and already
transferred records. It preserves that destination's solution and the source's
membership. Concurrent transfers use the same lock and revision checks as other
management changes. The signature covers the full exercise content; normalized
base difficulty metadata keeps it valid while the displayed level changes.

Protected practice and worksheet APIs apply transfers together. Generic topics
containing only transferred positions are registered in the private library and
worksheet source selector. Discovery subcategory membership and Draw topic aliases
share the same decisions. Regression tests cover transfer/re-transfer/reset,
removal/restoration, collisions, tampered content, worksheet membership, full
replay and authored solution edits after transfer.

### Owner classification on 2026-11-05

Quinteros–Larsen, Manila 1974 (Discovery game `eb90320742dca76e`, source ply 79;
management ID `3450ae0d747f2952a24ef3ba`) was moved at the owner's request from
Discovery B to **Tấn công Vua yếu · B**. The source's two mating sample lines,
objective, preceding move and full-game reference are preserved. This records
the owner's topic/level decision, without a new tactical proof or grade claim.
Earlier manual exclusions and level changes remain intact.

Runtime counts after the owner's existing decisions and this transfer:

| Page | Beginner | A | B | C | C* | D |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Chiếu mở và tấn công mở | 24 | 24 | 20 | 22 | 5 | 22 |
| Tấn công Vua yếu | 0 | 0 | 1 | 0 | 0 | 1 |

These are actual available counts, with the standing target of 24 per level.
The change does not fill research gaps or alter the original curated data.

## Compact management dialog

The objective stays visible on the left of a wrapping, responsive row, with a
44 × 44 px ellipsis button aligned right. Its accessible label and tooltip are
**Quản lý bài tập**. Opening the dialog does not expand the exercise card or
move its board. The same row and dialog are available in full-screen practice.

The native modal dialog contains the existing topic/level, move, removal and
reset actions. Close it with **Đóng**, Escape or a click outside. Focus returns
to the ellipsis button; background practice shortcuts stay inactive while the
dialog is open. Scroll locking is scoped to the open dialog in CSS, avoiding
interference with the shared full-screen container's own scroll restoration.
Closing the popup performs no save. Action buttons open a native confirmation
before the request is sent; move confirmations show the selected level and, for
transfers, the destination topic. Opening/closing or cancelling confirmation
preserves an unsaved selection. No practice-history panels are rendered below
the level navigation.

## Edit solutions and teaching variations

Open **⋯ → Chỉnh sửa lời giải / phương án → Mở bàn cờ để sửa phương án**.
The recorder starts from the exercise root and retains all current lines. Play
both sides, rewind to a move and play a different reply to add a branch. For
example, a king move can be recorded as a separate defence alongside a queen
interposition. Continue each branch through the intended teaching payoff.
Choose **OK** to keep the lines in the draft, then **Lưu lời giải** to persist
them. The current exercise refreshes and the confirmation offers a direct link.
Closing, Escape or **Hủy** discards unsaved edits; cancelling the recorder
leaves the editor's previous draft intact. An optional common explanation can
also be changed. No source-game moves are rewritten.

Curated later-level edits use `solutionOverride` in the existing adjustment
store. The signed original reference remains separate from the effective
solution, preserving the position, preceding move, source link, topic and level.
The overlay survives removal/restoration, transfers and level resets. Each
solution revision retains its lines and explanation in history. **Khôi phục
lời giải ban đầu** clears only this override after confirmation; it does not
reset topic or level decisions. Manually authored and Beginner entries keep
using the manual store and its established optional-Beginner/required-A–D rules.

The protected API replays every branch legally from the root, canonicalizes SAN,
deduplicates lines, limits the recorder to 12 branches of 120 plies, and rejects
stale revisions. Later levels require a solution; checkmate lines must end in
mate delivered by the solver. Owner-recorded lines are teaching choices, not an
automatic tactical verification or a claim that a defensive reply is forced.
The existing alternative-solution verification remains connected.

**Xem lời giải → Phương án lời giải** now exposes every saved branch for curated
as well as manual exercises. Review navigation follows the selected branch.
Practice accepts matching stored solver moves and uses the corresponding reply;
when branches share a solver move, its automatic reply follows the first matching
line. Other defensive lines remain available in review. Protected practice and
worksheet catalogs consume the same saved override without adding a position or
changing any level's count. Regression coverage exercises validation, stale and
unauthorized writes, source preservation, transfers, independent resets, legal
alternative solving and worksheet selection.
