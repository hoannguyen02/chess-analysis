# Setup Board: lesson quick reference

Open **Setup Board → LIMA Lesson** to load and teach saved positions.

## Keyboard shortcuts

**Remember: B = Back, N = Next.** These adjacent keys step before and after the optional previous move in the current lesson position.

| Key | Action |
| --- | --- |
| **B** | Show the original imported FEN, **before** the previous move. |
| **N** | Replay the previous move from that original FEN and highlight its start and destination squares. |
| **←** | Load the previous lesson position. |
| **→** | Load the next lesson position. |
| **R** | Reset the active lesson to its saved position, **after** its optional previous move. |
| **F** | Flip the board. |
| **P** | Show or hide the piece tray. |
| **D** | Deselect the active piece placement tool. |

Press the letter alone, without Shift, Ctrl, Command, or Alt. Shortcuts do not run while typing in a FEN, title, or spreadsheet paste field, or while a menu or dialog has focus. Click a blank area outside a field before using them.

**B/N stay within one lesson position; ←/→ change lesson positions.** B/N only apply when the current position has an optional previous move. Repeatedly pressing N replays from the saved FEN; it does not make additional moves. B/N preserve the board orientation.

The two small icons beside the move text perform the same before/replay actions. The icon for the displayed state is disabled. No tooltips or extra status text are needed.

## Import from a spreadsheet

1. Copy cells containing **FEN + optional previous move** columns. You can include several adjacent column pairs and their level headings, such as `Level A` and `Level B/B*`.
2. Click the **spreadsheet grid icon** in the LIMA Lesson toolbar (before the JSON import icon) and paste the cells. Click it again to close the panel.
3. Review the preview. Invalid FENs and moves are listed by row and column; the import button explicitly identifies when only valid entries will be added.
4. Add the positions. They append to the existing lesson, grouped by column pair, and the first newly imported position loads.

Each FEN must describe the position **before** its optional move. Loading a position automatically applies that move. For example, with `Nf5?`, press **B** to see the original position, then **N** to replay the knight move. Annotations such as `?` remain visible in the move text.

Positions without a previous move load their FEN unchanged. Last-move squares use matching translucent fills adapted to the board theme; these indicate the move, not its quality.

## Saved positions and exploration

Board edits are temporary until explicitly saved as a lesson position. Use **R** to return to the saved teaching position after exploring a variation. Use **B** when you want the position before the imported move instead.

Lessons and optional moves persist in this browser. **Export JSON list** saves a portable copy; **Import JSON list** replaces the current list with the imported list.
