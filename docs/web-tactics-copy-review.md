# Web tactics copy review — 2026-10-27

## Scope

Reviewed the current fork, pin, skewer and discovered-check/attack pages,
the shared practice controls and feedback, library descriptions, and the
`/chien-thuat` topic directory. The four practice topics contain 827 distinct
published exercise records: 122 forks, 227 pins, 159 discoveries and 319 skewers
(including introductory and recognition exercises). Discovery subcategories
reuse records; they are not additional exercises.

The review covers category introductions, level descriptions, prompts, hints,
solution notes, decision feedback, navigation, notation and empty states.
Proper player/event names and source references are retained.

## Changes

- Standardized “thí quân”, “phương án”, “nước đáp”, “lợi thế vật chất”,
  and “cấp độ”; removed colloquial material-point wording and classroom-only
  instructions from shared practice.
- Clarified fork and pin introductions, including multiple simultaneous
  targets and the difference between a pin to the king and a relative pin.
- Replaced “Xem mẫu” with “Xem lời giải”. Unverified legal alternatives now
  receive visible feedback explaining that they have not been verified,
  rather than implying they are incorrect because they are absent from a file.
- Final move hints reuse the PDF's legal-move explanation helper, combining
  SAN and Vietnamese origin/destination descriptions.
- Made beginner labels topic-aware so non-skewer topics cannot inherit “Xiên
  Vua”/“Xiên Hậu”. Added explicit level labels and aligned C* descriptions
  with the project's definition (2–3 solver moves deeper than B, no sacrifice).
- Removed exact duplicated SAN recaps from source solution notes; board replay
  retains every move. Web and PDF now use the same solution prose for all 827
  records, checked by `scripts/test-worksheets.cjs`.
- Updated the publishing scripts and queen-skewer source explanations so
  rebuilding the collections retains these editorial changes.
- Clarified Zugzwang and collinear-move labels in the topic directory using
  [Lichess's theme definitions](https://lichess.org/training/themes).

## Verification and limits

Compared every exercise before/after, allowing only changes to prompt, hints,
solution, difficulty explanation and decision retry wording. All other fields,
including FEN, primary and alternative moves, previous move, objective, level,
source and game reference, are unchanged. This was not a new engine review or
regrading of the tactical collections.

Ran worksheet, tactic, access, library, shared mate-alternative and exploration
checks, plus the complete PDF-copy audit, TypeScript and focused ESLint checks.
Existing discovery and queen-skewer API test mocks were missing
`practiceGameOpening`; added that stub to restore the tests without changing
production APIs.

Inspected the four pages at desktop and mobile sizes with real local exercise
payloads and isolated browser request fixtures. The fixtures do not modify or
bypass the deployed access checks. No page errors or horizontal overflow were
found. QA screenshots and comparison snapshots are ignored under
`tmp/web-copy-audit/`.
