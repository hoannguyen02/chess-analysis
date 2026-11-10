# Mate in one practice

The protected practice topic uses the existing `mateIn1` scope,
`/tactic-positions?theme=mateIn1`. The same scope keeps owner-authored positions
and practice decisions attached to the topic. Worksheets load the protected
catalog and original games open in the shared replay dialog.

## Selection checklist

Check all legal first moves and all replies to every check. Keep the focus on
the immediate mate and explain the decisive escape square, capture or block.
For A, prefer direct checks with simple coverage. For B, look for coordination
that changes how the learner chooses the check, such as several supporting
pieces, a double check, or answering check with mate. Both levels end after one
learner move. Check both sides to move, central and edge kings, different mating
pieces, non-capturing moves and captures, and special moves where source games
provide suitable examples. Compare alternatives that appear to mate and identify
how the defending side escapes, captures or blocks. A change of square or color
alone does not make a distinct exercise.

### Beginner checklist

Use at most ten pieces, including both kings and all pawns. Keep only original
game positions with a single immediate mating move. Prefer visible ways to
cover an escape, protect the checking piece or prevent a block. Include both
colors and compare rook, queen, bishop, knight and pawn mates, non-capturing checks
and captures, and checks from near and far. Assess promotion, castling, en
passant and moves that uncover check for suitability. Preserve the game and
preceding move and identify any teaching continuation separately.

## Collection

| Level | Positions | Focus |
| --- | ---: | --- |
| Beginner | 48 verified | Direct mates in positions with four to ten pieces. Owner authoring and imports are also available. |
| A | 24 | Direct mating checks, including back-rank mates, captures and promotion. |
| B | 24 | Coordinated mating nets, competing checks and defenders that appear able to capture or escape. |
| C, C*, D, D*, E, E* | 0 each | Outside the current collection. These levels stay visible. |

Each main solution was played in the original master game. The lesson accepts
every verified immediate mate, including alternatives to the played move.
The selection covers both colors, central and edge kings, captures and
non-captures, and promotion with two valid rook underpromotions at A. Knight
mates appear at B. The saved batch does not include castling, en passant,
mate by discovered check or double check, or a mating reply to check. The approved bundle
maps coverage and reserve decisions to stable game IDs. Rules reference
[FIDE Laws of Chess, articles 1.4, 3.7.3 and 5.1.1](https://handbook.fide.com/chapter/E012023).

The run reused 60 candidates from the local bank and compared all 1,864 legal
starting moves in about 1.1 seconds of automated tactical review with two
workers and zero engine searches. Exact legal enumeration is sufficient for
this one-move goal. Independent editorial reviews then selected 48 positions
and deferred 12 reserves. The run ledger recorded 34 minutes 46 seconds
end to end, including integration, editorial work, validation and PDF
inspection. Publication rehearsal, including checks and rendering, took about
32 seconds before visual review.

The first Beginner batch reused the existing game index. From 134 eligible
saved leads, it shortlisted 30 and compared all 571 legal starting moves in
about 0.64 seconds of automated proof with two workers and zero engine
searches. Editorial review selected 24 distinct games and deferred six
reserves. Twelve positions are White to move and twelve are Black to move.
The collection includes rook, queen, bishop, knight and pawn mates, captures
and non-capturing checks. The initial Beginner pool contained no mating
promotion, castling, en passant, discovered or double check, or mating reply
to check. The approved bundle records the selected game IDs by aspect.
The full Beginner run took 5 minutes 55 seconds, including independent
review, worksheet rehearsal and visual inspection.

## Cross-topic replacements

The active catalog had three positions shared with specialist rook-mate
topics. The practice-management history records the retirements from
mate-in-one. The original evidence and full games remain available for
audit, and the specialist exercise cards stay active.

| Level | Retired mate-in-one ID | Kept in | Replacement |
| --- | --- | --- | --- |
| A | `1390835c501836ae` | Two-rook mate | `8dcd163ff22594bd` · Ne2# |
| A | `2c4846ab27e97cab` | Two-rook mate | `96130c5ed7582e7f` · exf1=Q# or exf1=R# |
| Beginner | `f885779cd3c21266` | One-rook mate | `c7a9664218be4454` · Qe8# |

The replacement shortlist reused six indexed games and compared 177 legal
starts in about 0.24 seconds of automated proof with two workers and no
engine searches. The full workflow took 4 minutes 55 seconds, including
implementation, editorial review, tests and visual review of ten PDF pages.
The final active-catalog check found 24 positions at each of Beginner, A and
B and no cross-topic overlap with mate-in-one.

## Second Beginner batch

At the owner's request, a second batch adds 24 verified positions to the
existing 24. Each has four to ten pieces and exactly one mating move, played
in the original game. Eleven positions are White to move and thirteen are
Black to move. The selection includes three promotion mates and a pawn move
that uncovers a bishop mate. Castling, en passant, double check and mating in
reply to check were outside the selected coverage. The approved batch maps
the covered aspects to stable game IDs.

The run queried the saved bank first. Its targeted scan replayed 448 indexed
games with two workers and no geometry cache hits. It produced 39 additional
leads in about 7.4 seconds including source selection. Tactical review covered
726 legal starts across 30 shortlisted positions in about 0.66 seconds, with
one reused exact review and zero engine searches. Independent editorial
reviews selected 24 positions and deferred six reserves. The complete run
took 6 minutes 19 seconds, including review, tests and inspection of all
15 worksheet and answer pages.

## Validation

The shared `finish-batch` command builds this catalog from
`scripts/fixtures/mate-in-one/published.json` and preserves the manual store.
Visual inspection covered all 22 pages for A/B and all 15 pages for Beginner.

```sh
python3 scripts/test-mate-in-one.py
node --test scripts/test-mate-in-one.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs scripts/test-worksheets.cjs
node scripts/audit-worksheet-copy.cjs
```
