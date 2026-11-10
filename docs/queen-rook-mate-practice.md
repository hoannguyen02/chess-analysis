# Queen and rook mate practice

Private routes: `/queen-rook-mate` and `/vi/queen-rook-mate`, in the
"Chiếu hết" library group. Both JSON endpoints enforce the existing practice
access checks. Public static page data contains no exercises.

The page reuses ChessPractice, DrawTrainer, PracticeBoard and DrawGameViewer,
including the side-to-move/checkmate objective, timer, fullscreen, hints,
exploration, analysis links, and shared alternative-mate verification.

## Collection and grading

112 exercises: Beginner 20, A 20, B 20, C 20, C* 20, D 12.
The 92 real-game exercises have complete locally saved games from 39 archives.
Beginner contains original four-piece mates in one, ten for each color.

D remains eight below the target. Do not fill this gap by relabeling quiet long
lines, stretching short combinations, or duplicating positions from one game.
A is a direct one/two-move finish; B is three solver moves; C requires a simple
sacrifice within three solver moves; C* is five/six solver moves without a
sacrifice. D requires more than three solver moves and complicated sacrifices. Multiple
concessions and queen sacrifices qualify for review. A single other sacrifice
requires at least five solver moves, coordination between three attacking piece
types, and a non-capturing, non-checking preparation move. Length alone does not
qualify. Material recovered immediately is considered before grading.

Each sample ends with queen checkmate and a genuinely supporting rook.
Removing an identified supporting rook from the final position must break
checkmate; its removal opens a defense or escape. This deliberately excludes
positions where a rook merely happens to be present. It is a focused collection
of queen mates supported by a rook, not every possible queen-and-rook tactic.

## Research and evidence

Source games come from cached [PGN Mentor archives](https://www.pgnmentor.com/files.html).
Each game retains its source URL, archive checksum, player/event/date headers,
complete original legal moves, move-sequence hash, exact exercise FEN/source
ply, and preceding move. Analyzed continuations after resignation remain
separate from the saved original game.

- `build-queen-rook-mate-intro.py`: deterministic sparse compositions, exhaustive
  enumeration of legal mate-in-one moves, and the essential-rook check.
- `collect-queen-rook-mate-games.py --prepare`: research recorded mating games.
- `prepare-queen-rook-mate-candidates.py`: independently inspect existing
  resignation research for this specific coordination motif.
- Collection: 400,000-node root search, 200,000-node defensive searches after
  attacking moves, complete legal replay to actual mate.
- `review-queen-rook-mate-games.py --new-only`: 1,200,000-node root review and
  350,000-node defensive searches for A–C*. D receives 3,000,000-node root
  searches and 1,500,000-node defensive searches. Shorter mates are regraded or
  excluded; review history and exclusions are retained.
- `build-queen-rook-mate-games.py`: publish only reviewed, non-excluded games,
  deduplicated by source-game ID, alongside composed Beginner positions.

Finite engine analysis is not an exhaustive proof against every defense.
The shared alternative verifier independently searches all legal defensive
replies within its bounded limits; a search limit means unverified, not wrong.
Per-position research, reviews, exclusions, and source hashes live in
`scripts/fixtures/queen-rook-mate/`.

## Additional D research

The expansion searches 18,287 decisive games from cached attacking-master
archives and 15,384 non-mating decisive games from six additional archives:
Abdusattorov, Ding, Duda, Firouzja, Erigaisi and Gukesh. The downloaded archives
contain 22,515 distinct normalized games, including 1,233 recorded mates checked
separately. Archive hashes are retained in `d-research-sources.json`.

`prepare-queen-rook-mate-archives.py` normalizes additional downloaded archives;
`research-queen-rook-mate-d.py` generates longer sacrificial candidates.
Candidates still pass the main collector and deeper reviewer before publication.
`audit-queen-rook-mate-d.py` saves exact FENs, sacrifices, quiet moves, attacking
piece types, and essential-rook evidence in `d-grading-review.json`.
Earlier levels and their existing examples are preserved.

## Validation

```sh
python3 scripts/test-queen-rook-mate-games.py
node --test scripts/test-queen-rook-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs
npm run build
```

Tests check legal source replay, exact FEN and previous-move markers, grading,
actual checkmate and essential rook support, both beginner colors, shared
trainer completion, alternative mates, and protected APIs.
