# Skewer practice

The protected `/skewer` page opens at **Nhập môn / Beginner** when the
collection is empty. It uses the shared trainer, board editor and game viewer.
The exercise and game-source APIs still require practice access, and
`/api/skewer-exercises` remains the worksheet source for **Đòn xiên**.

## Collection reset

The owner requested a fresh collection on 2026-11-10. The reset removed
319 published positions, including 73 Beginner positions. All nine levels
remain available:

| Level | Positions after reset |
| --- | ---: |
| Beginner | 0 |
| A | 0 |
| B | 0 |
| C | 0 |
| C* | 0 |
| D | 0 |
| D* | 0 |
| E | 0 |
| E* | 0 |

These are reset counts. Beginner is ready for owner authoring. The usual
research target remains 24 per researched level.

## Add a Beginner position

1. Open **Đòn xiên → Nhập môn / Beginner** in the local development site.
2. Select **Thêm thế cờ Nhập môn**. Arrange the pieces or paste a FEN, check
   the side to move and set the objective, such as **Thắng vật chất**.
3. Record a solution if desired, then save. A position saved without a
   solution opens in free practice.

The shared **Lấy thế cờ từ B, C, C*, D, D*, E, E\*** importer will offer
eligible positions once those levels contain exercises. It keeps the source
reference and preceding move when available. Follow the
[Beginner authoring workflow](tactic-research-workflow.md#beginner-only-position-authoring)
for editing and source selection.

## Verified Beginner research

For explicitly requested verified Beginner additions, follow the
[one-move requirements](beginner-one-move-game-requirements.md) and the
[shared research workflow](tactic-research-workflow.md). Prioritize clear
checking skewers with at most 10 pieces. The shared CLI supports **Beginner**
for Skewer. Its first source adapter looks for a quiet bishop, rook or queen
move actually played in a complete indexed master game. The move must check
the king with an enemy piece behind it. After every legal reply, the same
attacker must be able to capture the rear piece and keep a material gain
through the next opposing reply. The review compares every legal starting
move across two solver moves and their replies. It checks gains that survive
counterchecks, equal exchanges and promotions, and rules out short mating
alternatives. Stockfish screens every root and every defence to the skewer.

Coverage is tracked by attacker, file/rank/diagonal, side to move, rear piece
and defensive mechanism. Relative skewers, captures that create a skewer,
and discoveries from a stationary attacker are outside this initial proof
profile. Promotion and castling can create line attacks, and en passant can
uncover one. Those cases remain unverified for Beginner and need their own
coverage before publication.

The first verified position is **Nguyễn Ngọc Trường Sơn – Parham
Maghsoodloo**, 3 September 2026, after `76.Ke3` (`f74f0963e98c40c0`). The
four-piece position starts with equal material. `76...Ra3+` is the only one
of 15 legal starting moves to secure the short material gain. All five king
replies allow the rook capture, and the proof checks all 20 replies after
that capture. The learner plays only `Ra3+`. This exercise and its original
game were preserved in the expansion.

This position covers Black to move, a rook on a rank, and a king protecting
the capture square.
The [review bundle](../scripts/fixtures/skewer/published.json) retains the
original game, the preceding position and the exact tactical and editorial
evidence. The source scan replayed 1,656 indexed games in 10.62 seconds with
no geometry-cache hits and produced four leads. The selected lead's tactical
review took 1.88 seconds with six engine calls. These stage timings exclude
adapter development, editorial review, publication checks and PDF inspection.
The first complete run took about 11 minutes, including those phases and
the verifier and publication retries.

### Beginner collection of 24

The 2026-11-10 expansion added 23 verified positions from complete master
games. All exercises start with four to ten pieces and stop after one
learner move. The collection has 11 White-to-move and 13 Black-to-move
positions, with 13 rook, eight queen and three bishop attackers. The lines
cover seven ranks, ten files and seven diagonals. The examples distinguish
an exposed piece from a favorable exchange, and show support by a king,
rook or pawn. Two positions start just after a recorded promotion.

The bundle's coverage checklist maps decisions to exercise IDs. At this stage,
White-to-move bishop skewers, relative skewers, capture-created and discovered
skewers, and special moves as the solution were open coverage areas.

The shared bank supplied three leads. The wider search examined 17,920
indexed games, including 8,160 cached scans, and brought the pool to 105
leads. Four editorial packets covered 30 short-listed positions. The 23
additions account for 502 legal roots, 87 first defences and 671 immediate
recovery replies. One tactical candidate was held back because a passed-pawn
race complicated the payoff, and six other leads remained as reserves.

On six fixed candidates with identical search budgets, cold automated review
took 6.01 seconds with two workers and 4.42 seconds with four workers. Both
made 32 engine calls and reached the same outcomes. A four-worker warm repeat
took 0.07 seconds with no engine calls. The later review under the strengthened
material verifier reused 141 exact engine results without a new engine call.
These are automated stage timings. The full run also includes selection,
parallel editorial work, publication checks and PDF inspection.

### Ten additional Beginner positions

The next batch added ten one-move positions from complete games and preserved
all 24 earlier positions and their sources. Three of the earlier positions
have saved Level A choices. The active catalog now shows **31 Beginner**
positions (17 White to move, 14 Black to move) and **3 Level A** positions.

The additions include four White-to-move bishop skewers. They show when a pawn
or king can protect the checking square, how a bishop can win an exchange even
if recaptured, and how to account for a pawn lost elsewhere. The rook and queen
positions include a tempting pawn capture refuted by a countercheck and a queen
check that works from only one side of the king. The batch checklist in the
[review bundle](../scripts/fixtures/skewer/published.json) maps these decisions
to the exact exercise IDs.

The bank yielded 75 leads. The focused scan replayed 30,000 indexed games and
found ten White bishop leads. A separate bounded scan of 65,000 indexed games
found no discovered skewer that passed the short proof. Relative, capture-created
and discovered skewers and special moves as the solution remain outside the
published Beginner set. The 22-position tactical screen took 19.06 seconds
with 48 engine calls and 50 exact engine-cache hits. The final shortlist reused
59 engine results with no new calls. Independent editorial review selected ten
positions, covering 210 legal roots, 35 first defences and 332 recovery replies.

## Historical evidence

`scripts/fixtures/skewer/` retains the historical source manifests, complete
games, audits, decisions and research leads. Several other topics use these
complete games as a research corpus. The [queen-skewer pilot](queen-skewer-pilot.md)
is a historical review. The reset retires the former selections and their
standalone publishing scripts. Use Git revision `e516b838` for their exact
payloads and reproduction commands. Historical owner exclusions remain in
force, including the original king-skewer lessons 17, 26 and 35, the former
queen-skewer lessons 14–24, and the guided exchange and queen-skewer
examples formerly numbered 5, 9 and 12.
