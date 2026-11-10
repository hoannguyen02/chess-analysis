# Saved games

`/saved-games` is the password-protected shared game collection. In the reference game viewer, select **☆ Lưu ván**, enter optional comma-separated square tags and theme tags, and save. The opening, players, result, event, date, full source game, and selected branch/move are retained. Drawn and unfinished games have no winner. Opening metadata remains independent of the result.

The page combines text search with opening, winner, result, theme, and square filters (any/all), and sorts by saved date, game date, or White's name. Open a card in the existing `DrawGameViewer` to replay or edit; additional saved moments are available from the card. Removal has an inline confirmation.

## Position authoring

To add a position directly to a tactic level, use **＋ Thêm thế cờ**, choose the
objective and level, and enter the required solution. This writes a separate
manual exercise and opens the existing tactic page. It does not save the full
game or add a favorite. See [manual tactic positions](manual-tactic-positions.md).

The earlier topic/level position bookmarks are retained as legacy data. They
remain filterable in **Ván đã lưu**. **Thêm vào bài tập** opens the direct authoring
form with their topic and level preselected; a solution is required. Legacy
bookmarks are never silently published or deleted. New position authoring does
not use the old `pending-review` bookmark status or an approval queue.

## Project persistence

The durable file is `src/lib/server/saved-games.json`. Run `yarn dev` to add/edit/remove games. Changes update this tracked file atomically; commit it with the project and deploy to publish the collection to viewers who have practice access. Saving does not automatically create a Git commit or deploy. The initial collection is deliberately empty.

Production builds read a bundled snapshot and reject mutation. Vercel and similar ephemeral deployments cannot persist changes to the source repository. Saving directly from a hosted site would require a separate authenticated durable store or a repository integration; it is not implemented here. No favorites are stored in browser storage.

API access uses the existing practice token on every operation. All authorized local development viewers can edit; there is no separate owner role. POST validates all replay moves, FEN, tag limits, and bookmark boundaries. A game fingerprint avoids duplicates for the same starting position, main line, players, and date. Saves retain multiple distinct branch/ply moments. Expected modification timestamps reject stale edits; an exclusive lock and atomic rename protect local concurrent writes. After an interrupted process, inspect and remove a stale `saved-games.json.lock` only when no writer is active.

The game source snapshot is saved, rather than relying on a temporary remote source. Existing source fields and headers are retained. These are personal bookmarks, not newly verified tactical exercises or difficulty assignments.

## Checks

- `node --test scripts/test-saved-games.cjs`: legal replay validation, boundary/tag rejection, stable identity, atomic persistence, write conflicts, read-only production, winners, API authorization, repeated saves and removal; candidate catalog/level validation, server-derived FEN, pending-review status, independent notes/topics/moves, branch remapping, stale edits/removals, combined topic/level filtering and legacy compatibility. Tests write only to an isolated temporary directory.
- `node scripts/test-mate-alternatives.cjs`: existing shared trainer regression coverage.
- `npx tsc --noEmit`

Manual check: sign in, open any real reference game, save with `f2, f7` and a note, open `/saved-games`, combine filters, reopen the saved move, add another bookmark, and edit/remove the entry. Repeat at narrow viewport widths. Arrow keys in the note/tag fields must edit text without advancing the chessboard.


For direct-position authoring checks, see [manual tactic positions](manual-tactic-positions.md).
