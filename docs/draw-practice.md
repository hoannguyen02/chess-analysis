# Draw practice

## Active collection — 2026-10-29

**157 curated positions across five draw themes.** The shared protected
practice API and worksheet/PDF exporter use the same collection and level order.
All exercises explicitly carry `goal: 'draw'`. The page shows individual draw themes; the combined “Tất cả kỹ năng” option
was removed at the user’s request. Level badges show counts for the selected
theme; the combined collection now has the counts shown below. Each
theme now has its own protected route and worksheet source; the theme links
remain available on every Draw theme page. The five theme routes appear as
separate cards under the `Hòa cờ` heading in the practice library. `/draw` and
`/vi/draw` reuse the protected `/hoa-co` overview page.

| Theme route              | Beginner |   A |   B |   C | C\* |   D |
| ------------------------ | -------: | --: | --: | --: | --: | --: |
| `/perpetual-check`       |        0 |  16 |  24 |  23 |  24 |  24 |
| `/stalemate`             |        4 |   3 |   0 |   6 |   0 |   3 |
| `/insufficient-material` |       15 |   2 |   0 |   0 |   0 |   0 |
| `/repetition-draw`       |        0 |   0 |   0 |   0 |   1 |   0 |
| `/fortress-draw`         |        5 |   3 |   4 |   0 |   0 |   0 |

Counts are actual positions by theme and level, not quotas. Empty theme-level
combinations remain visible with a zero count. Across all themes the counts are
Beginner 24, A 24, B 28, C 29, C* 25 and D 27. The perpetual-check route now
has 24 positions in B, C* and D. A remains at 16 because the available A
examples repeat the same simple checking loops; C remains at 23 after
shortcuts that bypass the intended sacrifice were excluded. Beginner has no
reviewed perpetual-check examples. These are documented research gaps, not
reasons to duplicate positions or relabel difficulty.

## Per-route expansion request — 2026-10-29

The request to fill every theme route to 24 at all six levels would require 720
unique positions, 563 more than the current collection. The reviewed source pool
does not support filling each separate theme without new research: the 100
stalemate candidates contain 64 unresolved and 30 rejected decisions; 92 of 100
insufficient-material examples repeat a one-move elimination; 93 of 100
fortress examples repeat defensive geometry; and 290 of 306 non-check repetition
games lack a verified reason to repeat. These are not accepted additions.

Do not copy positions between routes or relabel simple examples to fill a level.
Keep each route's actual count until new positions pass the saved editorial and
tactical review. The repetition route now opens at C\*, its first populated level,
instead of opening on an empty A filter.

The first editorial pass retained 31 of the original 706 examples. A second
review adds one non-check repetition position to C\*: a king-and-bishop route in
a locked-pawn ending reaches a valid threefold claim. The follow-up now adds 88
distinct master games, eight credited study positions and 16 small
compositions. Real games, studies and compositions are identified separately;
the level scheme is the project's teaching scheme, not a FIDE classification.

| Level    | Retained | Added | Total |
| -------- | -------: | ----: | ----: |
| Beginner |        8 |    16 |    24 |
| A        |       13 |    11 |    24 |
| B        |        9 |    15 |    24 |
| C        |        1 |    23 |    24 |
| C\*      |        1 |    23 |    24 |
| D        |        0 |    24 |    24 |

## Selection and verification

See [coverage and editorial decisions](draw-collection-review.md) and the
[complete expansion coverage map](draw-expansion-review.md).

- `draw-selection.ts` preserves the explicit 32-position original selection,
  including the reviewed C\* repetition example.
  `draw-additions.ts` is generated from explicit reviewed additions. Neither
  research-pool builders nor automatic level ratings control publication.
- `collection-review.json` and `curated-selection.json` retain review decisions
  for all 706 original positions, including exact FENs, moves and exclusions.
  The selected non-check repetition is a played line, not a forced-draw claim;
  its exact threefold claim is verified by legal replay, and bounded engine
  screens cover all legal starting moves and replies after the six White moves.
- `resource-proofs.json` contains exact legal AND/OR certificates for the retained
  forcing resources. Their leaves are stalemate, dead material or a sustainable
  cycle; every legal defensive reply is replayed independently.
- New master/study candidates underwent all-legal-root screening, explicit
  immediate-mate checks and analysis after each move. `addition-final-review.json`
  records fresh 600,000-node defensive analyses through the first cycle;
  `addition-alternatives.json` reviews other drawing root candidates with a fresh
  hash and one million nodes. These are bounded engine analyses, **not exhaustive
  proofs** that every defensive continuation has been solved.
- `intro-additions.json` contains exact Syzygy WDL values for all legal roots and
  all sample positions of the four-piece compositions. The one five-piece
  checking-pawn composition is verified by enumerating every legal reply: all
  leave the solver stalemated. Table download URLs and SHA-256 hashes are saved.
- The original fortress examples retain their earlier saved WDL evidence; this
  follow-up does not claim fresh table probes for those original examples.

A drawn tablebase assessment is not automatic game termination. Stalemate and dead
positions are distinguished from repetition claims and continuing drawn endings.
Rules checked against the [FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023),
articles 5.2, 9.2 and 9.6. No non-check shuffle was restored merely because the
source game ended in a draw.

## Provenance and replay

New master sources retain archive URLs/checksums, complete legal PGNs, headers,
start ply, exact FEN and preceding move in `selected-additions.json`. The shared
`DrawGameViewer` opens the actual complete game. Repetition cycles appended to a
teaching solution are explicitly identified; they are never appended to the
actual game replay. Studies have local study replay and source credits.
Compositions are labeled “Thế cờ biên soạn”.

The original research pool remains available as `drawResearchCategories` for
source validation. Its Lichess database games are not relabeled as master games.
Practice and source-game APIs preserve their existing access protection and the
`/api/draw-exercises` worksheet integration.

## Rebuild and checks

```sh
python3 scripts/curate-draw-collection.py
python3 scripts/select-draw-additions.py
# Only for regenerating exact introductory evidence, with the documented tables:
python3 scripts/build-draw-intro.py
python3 scripts/publish-draw-additions.py
python3 scripts/build-draw-game-viewer.py
npx prettier --write src/lib/chess/draw-selection.ts src/lib/chess/draw-additions.ts
python3 scripts/test-draw-curation.py
python3 scripts/test-draw-additions.py
node --test scripts/test-draw-levels.cjs scripts/test-draw-practice.cjs scripts/test-draw-trainer.cjs scripts/test-draw-game-viewer.cjs
node scripts/audit-worksheet-copy.cjs
node --test scripts/test-worksheets.cjs scripts/test-practice-access.cjs scripts/test-mate-alternatives.cjs
npx tsc --noEmit
```

Python research scripts require python-chess and Stockfish. Rebuilding the small
introductory fixture requires the documented Syzygy tables in `/tmp/draw-syzygy`;
ordinary builds and tests use the committed evidence and need no network access.
