# Promotion practice: four objectives

The promotion family has four private practice routes with the existing shared access. All reuse
`ChessPractice`, `DrawTrainer`, the shared full-game dialog, access guards and
worksheet generator. Each route keeps Beginner, A, B, C, C*, D visible, including
empty levels. The starting side and explicit objective remain visible in normal
and fullscreen practice. These are the project's instructional levels.

| Route | Objective | Beginner | A | B | C | C* | D |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/promotion` | Material gain through promotion | 3 | 15 | 2 | 2 | 0 | 1 |
| `/underpromotion` | Choose a piece other than Queen for a concrete reason | 3 | 3 | 1 | 0 | 1 | 1 |
| `/passed-pawn-simplification` | Exchange into a winning passed-pawn ending | 0 | 8 | 9 | 15 | 6 | 13 |
| `/promotion-mate` | Checkmate involving promotion | 5 | 20 | 18 | 17 | 21 | 22 |

Target: 24 verified positions per level. Counts below 24 are research gaps, not
permission to transfer mating difficulty labels to shorter material lines or
publish equivalent Queen promotions as necessary underpromotions. No fabricated
game references are used. Sparse introductory positions and modified positions
are labeled composed. Real-game positions retain locally saved full replay,
preceding move and archived research provenance. The 51 retained passed-pawn positions
reuse the established master-game simplification corpus and its reviews.

## Coverage and selection review

Material: review capture/noncapture promotion, both sides, immediate/delayed
payoff, preparation, removal of blockers, sacrifice and recovery, and safe
retention of the promoted piece. The Beginner material review retains three distinct decisions: safe advance
(`promotion-beginner-safe-advance`), avoiding stalemate
(`promotion-beginner-avoid-stalemate`), and capturing the defender while promoting
(`promotion-beginner-capture-defender`). Twenty-two equivalent safe-advance
positions were removed; one capture example was added. Both sides remain represented.
All legal roots and direct replies are recorded in `material-beginner-review.json`,
along with durable exclusions. The capture removes the rook that would take a
straight promotion. This is a one-move material-payoff review, not a proof of
absence of longer forced mates. There are 21 remaining Beginner slots; distinct
preparation, blocking and capture-direction decisions still need review. En passant
and castling preparation are excluded from this immediate-promotion set. Longer lines stop at certified material gain,
then receive a grade based on that prefix. They do not borrow the length or
sacrifices of a later mate. Exact FENs, selected lines, all-defence certificates
and level assignments are in `scripts/fixtures/promotion-split`.

Underpromotion: assess Rook to avoid stalemate, Knight checks/forks, Bishop
selection and the consequences of Queen promotion. The current nine include three introductions, short Knight preparations, a
Knight fork, a master-game Rook combination and a published Bishop study.
The latest additions and remaining per-level gaps are recorded in
`promotion-family-review.md`. Its FEN and all
legal defence proof are in `underpromotion-fork.json`; Q/R/B instead allow
`Qg1#`. The material objective makes no claim that the resulting game is won.
Necessary Bishop examples, non-checking Knight ideas, broader Rook ideas and
advanced sacrifice examples remain gaps. Equal Queen mates do not qualify as
necessary underpromotion examples.

Passed-pawn exchanges: assess both sides, distant/protected/connected passers,
blockade removal, King access, exchanges that remove the last stopping piece,
material recovery and alternatives to exchanging. Of 58 existing winning
endpoints containing solver passers, four still won after removing those pawns
and were excluded. The remaining 54 no longer win in that comparison; family deduplication retains 51. Exact
endpoint FENs, removed squares and cached Lichess tablebase responses are saved
in `passed-pawn-importance.json` and `passed-pawn-tablebase.json`. This endpoint
comparison establishes a material role for those pawns, not exhaustive proof
that every exchange is forced or uniquely best. Original source continuations
and reviewed teaching lines remain distinguished. Beginner examples and more
examples in every level remain research gaps.

Mate: 103 positions after the family review; see `promotion-family-review.md`
for exclusions and per-level coverage. Both colors and Q/R/B/N promotion appear. Existing reviewed A–D
proofs are preserved, with five distinct introductory mates. Longer mates have legal
strategy certificates covering every defensive reply. Engine root review is a
finite shorter-mate screen, not an exhaustive shortest-mate proof.

Across all four pages, castling and en passant preparation remain coverage
gaps. Mechanical board transformations do not establish instructional variety.
The original promotion coverage and research evidence remain under
`scripts/fixtures/promotion`; the objective split and exclusions are recorded
under `scripts/fixtures/promotion-split`.

## Verification and regeneration

- `build-promotion.py` rebuilds reviewed source material, then invokes
  `split-promotion-pages.py`; it cannot restore the old mixed `/promotion` page.
- `build-promotion-material-intro.py` and `build-promotion-mate-intro.py` build
  their respective sparse introductory sets.
- `add-underpromotion-fork.py` saves its legal material strategy certificate.
- `review-passed-pawn-endpoints.py` caches objective-specific endpoint comparisons.
- `test-promotion-split.py` independently traverses all published material
  certificates, checks every legal defensive reply, verifies gain and solver-move
  bounds, checks the Knight refutations and replays all saved reference games.
- `test-promotion-games.py` retains master-game provenance and mating proof tests.
- `test-promotion.cjs` exercises the shared trainer and unsaved continuations.
- Run shared mate-alternative, practice-access, worksheet and copy checks plus
  the production build after changing any source.

Direct three-piece material tasks use the established safe promotion verifier.
Longer unsaved material alternatives use bounded all-defence objective search;
exhaustion is unverified, not incorrect. Completion requires the actual material
payoff after a defensive reply, rather than reaching the stored line's length.
No general game-winning claim follows from a numerical material gain.
