# Draw collection review — 2026-10-28

Historical first-pass report. Subsequent expansions are documented in
[draw-expansion-review.md](draw-expansion-review.md); the current collection
has **157 positions** with combined counts Beginner 24, A 24, B 28, C 29,
C* 25 and D 27. Counts and decisions below describe the original-pool review
only.

Scope: review the whole existing collection, cap each level at 24, remove
repeated decisions and unsuitable examples. Keep the complete research pool and
full games locally; a reviewed selection controls publication. Source-game result
alone does not prove that the exercise move draws.

## Coverage checklist, before selection

Assess these separately at Beginner, A, B, C, C*, D:

- Removal of the last mating material: king capture, minor-piece capture,
  equal exchange, eliminating a pawn before promotion; distinguish a dead
  position from an ending that is merely theoretically drawn.
- Stalemate: removal of the last mobile piece, blocking the last pawn move,
  vacating a king square, capture with check and forced capture; distinguish a
  genuine drawing resource from an opponent voluntarily falling into a trap.
- Repeated checks: queen on ranks/files/diagonals, knight, rook, bishop,
  coordination between pieces, checking distance and covering escape squares.
  Examine every defensive escape; a recorded repetition is not proof.
- Non-check repetition: reciprocal threats, blockade, pursuit of a piece,
  obligation to maintain a defence. Reject aimless agreed move shuffling.
- Defensive regions: rook-pawn corner, wrong bishop, bishop against rook,
  advanced rook/bishop pawn against queen. Select different defensive decisions,
  not mirrors of the same geometry. A tablebase draw is not game termination.
- White and Black to move; quiet moves, captures, checks, king moves, pawn moves,
  major/minor pieces. Balance only when the decision differs.
- Promotion/underpromotion, en passant and castling: assess explicitly. Do not
  add a special move simply for variety; document absent verified examples.
- Beginner: few pieces, immediate visible drawing idea, no sacrifice.
- A: direct familiar idea without sacrifice or long preparation.
- B: short preparation or coordination.
- C: a verified simple sacrifice; a losing offer followed by a blunder is out.
- C*: genuinely deeper non-sacrificial decisions, not extra repeated cycles.
- D: complex sacrifice and more than three meaningful solver moves; length of
  the original game and repetitions do not increase the grade.

## Evidence and limits

`review-draw-collection.py` records all legal starting moves, immediate mates,
full legal sample replay, and a fresh Stockfish screen after every solver move.
All initial moves receive a bounded search, including quiet moves. These searches
can identify refutations or competing wins but cannot certify every draw. Exact
terminal positions and any separately recorded universal defensive proof take
precedence over engine estimates. Unresolved positions are withheld.

The source pool includes online games as well as master games. Preserve actual
headers and URLs; do not describe every source as a master game. The PGN checksum
identifies the locally saved complete game, not the original downloaded archive.

## Final selection and unresolved coverage

All 706 source positions have durable decisions in `curated-selection.json`.
The first pass retained 31 original-pool positions: Beginner 8, A 13, B 9, C 1, C* 0, D 0.
The request for 24 per level remains short by 113 positions. Do not interpret
the counts as complete topic coverage. The selection is deliberately an allowlist.

| Level | ID | Distinct decision |
| --- | --- | --- |
| Beginner | `draw-fade68afb482cb45` | Remove the only pawn before it can promote |
| Beginner | `draw-ba834a79e058e42e` | Escape a rook check by capturing the unprotected checking piece |
| Beginner | `draw-e9742bf56555a085` | Remove the pawn although the opponent retains a bishop |
| Beginner | `draw-0daedb0706240112` | Remove the pawn even though the enemy king could otherwise recapture the knight |
| Beginner | `draw-df3fe59baef7eec2` | Remove the opponent’s rook, leaving only the capturing bishop |
| Beginner | `draw-e4ad42f79382627e` | Answer check by removing the bishop, leaving a single knight |
| Beginner | `draw-2f71d18786148b31` | Answer a pawn check by blocking promotion rather than stepping aside |
| Beginner | `draw-0acb3d4e21246e01` | Occupy the rook-pawn promotion corner |
| A | `draw-90589f8d4ddfd268` | Capture the last pawn with check evasion while same-coloured bishops remain |
| A | `draw-6a99e15cde57c79a` | Remove the pawn despite an apparent king recapture; both resulting endings are dead |
| A | `draw-a85a6435fcda88c1` | Bishop alternates diagonals around a king constrained by pawns |
| A | `draw-e474e7ba7599b345` | Rook checks on adjacent ranks against a king on the edge |
| A | `draw-6d66a5c8ecdb6b2b` | Queen stays on a file while checking two king squares |
| A | `draw-6760ace97d0b4a1d` | Queen switches between a diagonal check and a rank check |
| A | `draw-89760c40c22a2d3b` | Repeated checks force queen interpositions rather than king moves |
| A | `draw-b41bbbb65c03bde4` | Advance the last mobile pawn with check to lock it |
| A | `draw-07d6d35be0bd4012` | Check with a pawn closes the last pawn move; the other pawn is already blocked |
| A | `draw-db3544dfcf8d4051` | Block promotion when an extra knight restricts the defender’s escape squares |
| A | `draw-608a448343817011` | Reach the rook-pawn corner before the pawn advances |
| A | `draw-1ac02aac334d4f70` | Use the promotion corner that the bishop cannot control |
| A | `draw-c164943280a26770` | Leave the corner while avoiding the pawn’s attacked square, then return |
| B | `draw-0a667ba11a2179a9` | Bishop checks exploit the opponent’s own pieces blocking the king |
| B | `draw-7e254e8dda5db566` | Knight checking cycle depends on coordinated heavy-piece control |
| B | `draw-9563d3bd352c8d03` | Two rooks coordinate a checking net with alternative king escapes |
| B | `draw-aa0c5b5f54904ae0` | Queen switches long diagonals while a friendly pawn seals the king’s escape |
| B | `draw-5bcc33f22d52a133` | Queen checking route must account for a central king escape |
| B | `draw-40b17caabfa22aaf` | Coordinate a bishop retreat with a safe corner against a rook |
| B | `draw-f5c082a80dfd541e` | Preserve the bishop’s retreat diagonal while moving into the safe corner |
| B | `draw-10198df754295478` | Rook pawn on the seventh rank uses corner stalemate against a queen |
| B | `draw-c005771ee641bcdf` | Bishop pawn on the seventh rank uses the adjacent corner to resist a queen |
| C | `draw-da2a3c85f8522a8e` | Sacrifice the last rook; declining capture allows further checking offers |

Each level still lacks breadth. Beginner currently covers immediate removal of
mating material and direct pawn blockades; A adds checked/defended captures,
locked-pawn stalemate, direct checking patterns and rook-pawn corners; B adds
coordinated checks, defensive bishop retreats and advanced-pawn defence against
a queen. C has only the roaming-rook sacrifice. C* and D have no accepted examples.
The source pool has no reviewed promotion/underpromotion example meeting the
selection criteria, despite recorded promotions in some rejected or unresolved
stalemate traps. En passant and castling are not represented by verified drawing
mechanisms in this pool. These remain research gaps at every level, not claims
that such examples are impossible. More master-game research is needed for B–D;
no new corpus was mined in this curation pass. The existing master-game examples
and their full-game provenance were retained where suitable.

Checks distinguish automatic stalemate/dead-position draws from valid repetition
claims and from theoretically drawn fortress positions. Rule reference checked:
[FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023), articles 5.2,
9.2 and 9.6.

## Validation completed

- 72 Node tests passed across draw levels/practice/trainer/game viewing,
  worksheets, access protection and shared alternative-mate handling.
- Independent Python replay checked every legal defensive reply in the selected
  strategy certificates, immediate dead positions, and saved fortress evidence.
- All 706 archived full games and their exercise segments passed source replay;
  898 saved fortress WDL entries matched their exact positions.
- TypeScript compilation and worksheet-copy audit passed.
- Inspected rendered PDF answer pages containing the revised draw explanations.
- Browser checks confirmed Beginner/A/B/C/C*/D navigation, honest empty states,
  the starting side and draw objective in normal/full-screen views, and no
  horizontal overflow at 390px width.
