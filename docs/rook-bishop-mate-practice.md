# Rook and bishop mate practice

Private routes `/rook-bishop-mate` and `/vi/rook-bishop-mate` reuse ChessPractice,
DrawTrainer, PracticeBoard, and DrawGameViewer. Starting side and checkmate goal
remain visible in normal/fullscreen views. Timer, hints, exploration, analysis,
full-game replay, and bounded alternative-mate verification use the shared UI.

The private-library entry sets `worksheetEndpoint` to
`/api/rook-bishop-mate-exercises`. The worksheet builder discovers the topic from
this metadata and uses the same protected exercise data. The worksheet tests
cover source selection, available levels, and actual PDF generation with this
topic. AGENTS.md makes this integration mandatory for future practice pages.

## Published collection

120 exercises: 20 each in Beginner, A, B, C, C*, and D.
The 100 distinct real-game positions retain full local replays and references
to 32 source archives. Beginner positions are original compositions.

## Selection and verification

Beginner contains 20 original four-piece mates in one, ten for each color.
Both the rook and bishop must contribute to the final mate: removing either
identified piece must break checkmate. Either piece may give the final check.
Higher levels use distinct real games with the same concrete motif test.

A is a direct one/two-move finish; B requires short coordination (three solver
moves). C involves a simple sacrifice within three solver moves. C* requires
five/six solver moves without a sacrifice. D requires more than three solver
moves and complicated sacrifices. Single non-queen sacrifices require at least
five solver moves, three attacking piece types, and a quiet preparation move.
Material recovery is considered before grading; length alone does not imply D.

Real-game records retain complete original moves and headers, source URL,
archive checksum, exact FEN and source ply, preceding move, analyzed mating line,
and review evidence. Source games come from
[PGN Mentor](https://www.pgnmentor.com/files.html). Teaching variations after
resignation remain distinct from the recorded original continuation.

The collector checks roots at 400,000 nodes and defensive positions at 200,000.
Independent review uses 1,200,000 root / 350,000 defensive nodes for A–C*, and
3,000,000 / 1,500,000 for D. Shorter or unconfirmed lines are regraded or excluded.
Finite engine searches are not exhaustive proofs of every defense. The shared
alternative verifier separately searches all legal defenses within its limits;
an exhausted budget means unverified, not incorrect.

## Reproduction

- `build-rook-bishop-mate-intro.py`: deterministic sparse compositions and
  exhaustive legal mate-in-one enumeration.
- `prepare-rook-bishop-mate-candidates.py`: independently inspect durable
  research from existing topics.
- `prepare-queen-rook-mate-archives.py <directory>`: existing shared PGN archive
  normalizer, also usable for this topic.
- `collect-rook-bishop-mate-games.py --prepare --corpus <file>`: recorded-mate
  candidates; use `--seeds <file> --target 20` to collect.
- `research-rook-bishop-mate.py`: candidate continuations in resigned games.
- `review-rook-bishop-mate-games.py --new-only`: deeper independent review.
- `build-rook-bishop-mate-games.py`: publish only reviewed, non-excluded games.

```sh
python3 scripts/test-rook-bishop-mate-games.py
node --test scripts/test-rook-bishop-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs scripts/test-worksheets.cjs
npm run build
```
