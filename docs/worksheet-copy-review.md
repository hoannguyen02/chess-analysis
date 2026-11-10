# PDF copy review — 2026-10-27

## Scope

Reviewed the built-in worksheet and answer-book wording, including covers,
introduction, closing, level guide, instructions, move descriptions, solution
notes, alternative lines, provenance and contact footer. User-written titles,
introduction/closing text and contact details remain editable and are not rewritten.

The current printable library contains **2,558 exercises across 12 topics**,
with **141 normalized prose templates**. The audit replays every primary line,
1,426 additional lines and 2,283 supplied preceding moves. Normalization groups
repeated notes while preserving each exercise's FEN, moves and full before/after
text in the temporary audit report.

| Topic | Exercises | Prose templates |
| --- | ---: | ---: |
| Rook and bishop mate | 120 | 12 |
| Queen and rook mate | 112 | 9 |
| Back-rank mate | 114 | 10 |
| Queen mate | 132 | 10 |
| One-rook mate | 137 | 4 |
| Two-rook mate | 138 | 4 |
| Simplification | 113 | 26 |
| Discovered attack/check | 318 | 2 |
| Fork | 122 | 14 |
| Pin | 227 | 4 |
| Draw | 706 | 14 |
| Skewer | 319 | 32 |

## Editorial conventions

- Address the chess decision directly, without assuming the reader's role.
- Use “phương án”, “thí quân”, “lợi thế vật chất”, “nước đáp” and “thế cờ”.
  Replace colloquial “lời quân”, mechanical “nhánh mẫu”, and screen-only
  instructions such as “mở ván gốc”.
- Use “Lời giải và phân tích”, “Tổng kết và định hướng luyện tập” and
  “Hệ thống cấp độ”. Contact wording names LIMA Chess directly; it does not
  send readers to a document-production term such as “chân trang”.
- Preserve the distinction between winning material and winning the game.
  A recorded continuation is not a claim that every defensive move is forced.
  Additional solutions are not presented as an exhaustive list.
- Explain unfamiliar notation in a short answer-book key. Number moves using
  the FEN move number and distinguish White's `n.` from Black's `n...`.
- Describe castling by wing, promotion by resulting piece, and en passant by
  both destination and the captured pawn's actual square. Distinguish check,
  checkmate, and stalemate (“hòa do hết nước đi (pat)”).
- A third occurrence permits a valid draw claim under the repetition rules;
  it does not automatically end the game. A dead position ends the game
  immediately. A drawn tablebase assessment is not an automatic termination.
- Keep the required Beginner/A/B/C/C*/D/D* definitions, explicitly counting the
  solving side's moves. The levels are the project's instructional scheme.
- Retain player names, event captions and source URLs. Identify composed and
  modified positions in ordinary Vietnamese. Source attribution identifies
  the position's origin; the analysis may differ from the game continuation.
- Remove a duplicated SAN recap only when it exactly matches the printed
  main line. Preserve different continuations and explanatory qualifications.

Rule reference: [FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023),
articles 3.7 (en passant and promotion), 3.8 (castling), 5.2 (stalemate and dead
positions), 9.2 (threefold repetition), and Appendix C (algebraic notation).

## Implementation and verification

`worksheetSolutionText` and `worksheetSourceLines` apply reviewed editorial
changes at PDF export. Original exercise data, objectives, levels, provenance,
PGNs, exclusions and moves are unchanged. This avoids editing generated corpora
and losing the copy improvements when those corpora are rebuilt.

This is a language/notation audit with legal replay, **not a new engine audit
of tactical correctness, optimal defence or motif grading**. Existing curated
review evidence remains authoritative. In particular, do not rewrite a
statement about unavailable escape squares as a claim that every such square
is attacked: friendly occupied squares may also block escape.

Run:

```sh
node --test scripts/test-worksheets.cjs
node scripts/audit-worksheet-copy.cjs
WORKSHEET_RENDER=1 node scripts/audit-worksheet-copy.cjs
```

The audit writes ignored reports and optional specimen PDFs under
`tmp/pdf-copy-audit/`. It checks legal primary and alternative lines, preceding
moves, immutable source data, preserved source URLs and stale wording.
The specimen spans all 12 topics (15 practice pages and 27 answer pages in this
review). PDF text-bound checks found no characters outside the page; rendered
answer and closing pages were inspected for spacing and readability.

## Web alignment follow-up

The [web tactics review](web-tactics-copy-review.md) subsequently moved the
reviewed wording into the four tactical collections and their publishing
scripts. Those 827 exercise records now have identical web/PDF solution prose;
the PDF adapter remains for other collections and backward compatibility.


### Reader-friendly opponent-move wording

For shared PDF instructions, prefer "nước đi của đối phương" over "nước đáp".
Use "nước đi tốt nhất của đối phương" when instructing calculation against best
play; do not add "tốt nhất" to a general recording or move-count explanation.
The level descriptions and counting note address the reader as "mình": only
"nước đi của mình" count, and the opponent's moves are excluded. The example
"Trắng đi - Đen đi - Trắng đi" therefore counts as two White moves. Technical
exercise analyses may retain "nước đáp" where appropriate; changing a general
instruction does not justify relabeling a played or illustrative reply as best.
