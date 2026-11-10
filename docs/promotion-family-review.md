# Promotion family review

## Review checklist, before selection

Apply each row independently at Beginner, A, B, C, C*, D. Target 24 distinct
verified positions, retaining empty levels and recording actual counts.

| Category | Decisions to assess at every level |
| --- | --- |
| Underpromotion | Rook to avoid pat; Knight check, fork or tempo; Bishop to avoid pat or preserve a diagonal; capture and noncapture promotion; Queen refutation; defender capture, interposition, escape and countercheck; both colors |
| Promotion mate | Capture versus straight promotion; removing the last-rank defender; choosing a promotion square; Knight check; orthogonal versus diagonal mating line; promoted piece gives mate versus controls escape; protection of the new piece; quiet preparation, checks, deflection, line opening, blockade removal; King and each supporting piece; both colors |
| Passed-pawn exchange | Creating versus preserving a passer; removing blockade; protected, connected and distant passers; King access and tempo; pawn races; recapture creates a passer; exchanges of queens, rooks and minor pieces; counterplay and alternative recaptures; both colors |

| Level | Eligibility and special-move assessment |
| --- | --- |
| Beginner | Few pieces, direct visible payoff. Immediate capture-promotion is eligible. Castling and en passant cannot themselves promote; preparatory examples need separate simplicity review. Sacrifices excluded. |
| A | Direct decision without sacrifice. Capture/noncapture and necessary underpromotion eligible; special-move preparation unresolved. |
| B | Short coordination or preparation without sacrifice. Review King, pawn, Knight, Bishop, Rook and Queen preparation; en passant/castling candidates unresolved. |
| C | A simple meaningful sacrifice is required. Mere length or a routine equal exchange is insufficient. Special-move candidates unresolved. |
| C* | Longer non-sacrificial calculation; review full recovery and shorter alternatives. Special-move candidates unresolved. |
| D | Complex sacrifice and more than three solver moves; verify both conditions. Special-move candidates unresolved. |

Promotion itself is represented throughout the mate and underpromotion sets.
It is not required to occur before the endpoint of a passed-pawn exchange.
An en passant right in a FEN does not establish en passant coverage.

## Evidence boundaries

`promotion-family-review/*-original.json` preserves the complete incoming sets.
The three `*-reviews.json` bundles enumerate every legal starting move, immediate mates, a finite
Stockfish root screen, the legal published continuation and its features. These
screens are leads, not exhaustive proofs. Existing mate strategy certificates
remain the proof against every legal defence. Existing passed-pawn tablebase
endpoint comparisons do not prove that an exchange is forced. Unresolved stronger
alternatives must be quarantined, not described as disproved.

## Results and remaining coverage gaps

The review evaluated all 204 incoming positions and two additional certified
compositions from the cached research pool. The local research pool contains
17 master-game candidates and 242 composed candidates. No new master-game
provenance was invented. Candidate review is not a claim that this pool exhausts
promotion ideas. Two non-promotion mating leads remain quarantined (mate indices
28 and 130); engine lines alone were not called forced-mate proofs.

### underpromotion

| Level | Retained / target | Missing observed attributes to research |
| --- | --- | --- |
| Beginner | 1 / 24 | white, noncapture, quiet, straight-promotion, promote-r, promote-b |
| A | 5 / 24 | Further distinct decisions need review. |
| B | 1 / 24 | black, capture, capture-promotion, promote-r, promote-b |
| C | 0 / 24 | white, black, capture, noncapture, check, quiet, capture-promotion, straight-promotion, promote-r, promote-b, promote-n |
| C* | 1 / 24 | white, capture-promotion, promote-b, promote-n |
| D | 1 / 24 | black, capture, capture-promotion, promote-r, promote-n |

Every level also has unresolved en passant/castling preparation. These are
research gaps, not requirements to force special moves into unsuitable levels.

### promotion-mate

| Level | Retained / target | Missing observed attributes to research |
| --- | --- | --- |
| Beginner | 5 / 24 | quiet, promote-r |
| A | 20 / 24 | promote-b |
| B | 18 / 24 | promote-b |
| C | 17 / 24 | capture-promotion, promote-b, promote-n |
| C* | 21 / 24 | promote-b, promote-n |
| D | 22 / 24 | capture-promotion, promote-r, promote-n |

Every level also has unresolved en passant/castling preparation. These are
research gaps, not requirements to force special moves into unsuitable levels.

### passed-pawn-simplification

| Level | Retained / target | Missing observed attributes to research |
| --- | --- | --- |
| Beginner | 0 / 24 | white, black, capture, noncapture, check, quiet |
| A | 8 / 24 | No attribute gap in this list; instructional coverage still requires review. |
| B | 9 / 24 | No attribute gap in this list; instructional coverage still requires review. |
| C | 15 / 24 | No attribute gap in this list; instructional coverage still requires review. |
| C* | 6 / 24 | No attribute gap in this list; instructional coverage still requires review. |
| D | 13 / 24 | No attribute gap in this list; instructional coverage still requires review. |

Every level also has unresolved en passant/castling preparation. These are
research gaps, not requirements to force special moves into unsuitable levels.

Underpromotion now includes a Bishop self-blocking study at D and a longer
non-sacrificial Rook combination at C*. C remains empty; a distinct simple
sacrifice has not yet passed review. More Bishop-specific choices remain a gap. The two
Knight cage introductions were one decision despite the incidental capture.
The Black capture version is retained, giving Beginner both sides and both
capture and straight promotion without keeping the duplicate White cage.
The remaining A fork uses checking tempo to prevent a mating reply; it is
separate from the quiet pawn preparation for Knight mate.

Promotion mate adds a Beginner capture that removes the last-rank defender,
an A two-pawn promotion coordination, and a C* capture-promotion with extended
Queen–Rook coordination. The new A example permits valid alternative choices
of pawn and promotion piece; it is not presented as unique. More advanced
capture-promotion and underpromotion mechanisms remain gaps as shown above.

Passed-pawn exchanges retain 51 master-game positions. Three redundant
exchange mechanisms were removed. Beginner remains empty: no reviewed sparse
example has yet met both a direct visible payoff and the motif-essentiality
requirement. Existing endpoint tablebase comparisons and deeper finite
500,000-node searches after every solver move support the retained lines;
they are not exhaustive all-defence winning certificates. Full winning
continuations and objective-specific unsaved-alternative verification remain
limitations of this inherited category, not work established by this review.

## Regeneration and evidence

Run `review-promotion-family.py` for the cached all-root inventory,
`review-promotion-family-defences.py` for passed-pawn defensive screens, and
`curate-promotion-family.py` to apply the durable selection. The split builder
calls the curator. Snapshot files preserve incoming positions plus explicitly
recorded additions; new candidates must be added to this review input and
reviewed before publication. `selection.json` records every original FEN,
line, decision, duplicate representative, stable ID and per-level coverage map.
New proof references are in `additions.json`. No rejected entry is restored
merely to meet a quota.

## Research continuation — 2026-11-01

The new archive scan legally replayed 5,261 Ivanchuk games and 797 Rubinstein
games, finding 17 played underpromotions. Complete game headers, moves, source
URLs and archive SHA-256 checksums are saved in `promotion-expansion`. The
522-game prior corpus yielded one further already-known Rook lead. Earlier
preparation was screened at 85 positions (current position and two, four, six,
eight plies earlier). Four mating leads were shifted starts of Alapin–Rubinstein;
only the five-solver-move C* position was selected. No C/D master-game candidate
passed this finite screen. This is a research limitation, not proof none exists.

Four distinct additions to underpromotion:

- A: `minor-promotion-avoids-pat`. Four pieces; both Queen and Rook cause
  pat. Bishop and Knight are valid and retained as alternatives. This differs
  from the earlier Rook choice because the Rook also fails. Every legal reply
  preserves at least 220 centipawns of material gain; no claim that two Knights
  force a win is made. A discarded development version with a same-color Bishop
  instead of the supporting Knight produced a dead position and was not published.
- A: `goetz-queen-knight-mate`. Queen check forces the King onto the Knight's
  checking square, followed by capture-promotion mate. The full legal historical
  game is saved locally. The retrospective report dates it only approximately
  to 1880; it is not labeled a verified master tournament game. The earlier
  three-move discovery start was rejected because Qxe4+ offers a simpler
  material route; it is not counted as another exercise.
- C*: `alapin-rubinstein-rook-mate`. Vienna 1908, full legal game and checksum
  saved. Five solver moves: pawn check, equal Knight/Bishop exchange, Rook
  underpromotion avoiding pat, and mate. The equal exchange is not called a
  sacrifice. The actual continuation is preserved.
- D: `krobshofer-bishop-selfblock`. Published study, attributed by the historical
  source to Oswald von Krobshofer, 11 September 1904. Four solver moves combine
  Bishop routing, blocking the friendly Rook's protection, a positional Rook
  sacrifice, and discovered mate. The Rook sacrifice rules out C*. Queen
  promotion has a longer engine mating lead; it does not establish this
  four-move solution. No uniqueness or exhaustive shortest-mate claim is made.

The three mating additions also appear in promotion mate, without duplicating
positions within either category. Their saved trees independently verify every
legal defensive reply through actual mate. Material verification separately
checks both minor-piece choices and all immediate replies. Every legal starting
move has a 600,000-node engine screen, plus legal immediate-mate enumeration.
Search scores are leads rather than proof of forced mate.

Other played underpromotions remain unpublished: numerous Queen promotions
also work, several positions are losing, and engine assessments do not certify
the requested material or drawing payoff. Drawing assessments are not labeled
terminal draws. Castling/en-passant research is saved separately; no suitable
new special-move example was verified. A and B need further distinct examples;
C remains a genuine gap; C* and D now have one underpromotion each, not a full
collection. All levels retain the 24-position target.

Sources: [Edward Winter's historical research](https://www.chesshistory.com/winter/extra/underpromotion.html),
[PGN Mentor master games](https://www.pgnmentor.com/files.html), and
[FIDE Laws, article 5.2.1](https://handbook.fide.com/chapter/e012023).
Historical-page and diagram checksums are retained in `historical-sources.json`.
Regeneration runs `publish-underpromotion-expansion.py` before the family curator.


## Review-file consolidation

Per-position research is stored in `underpromotion-reviews.json`,
`promotion-mate-reviews.json` and `passed-pawn-simplification-reviews.json`
under `scripts/fixtures/promotion-family-review`. Each bundle maps the source
snapshot index to the unchanged review record and stable exercise identifier.
Expansion root analysis is in `promotion-expansion/root-reviews.json`, keyed
by candidate ID. Rejected-candidate analysis remains available in these bundles.

`review_store.py` provides atomic updates; reviewers and publishers
update bundles directly and no longer generate one JSON file per position.
Run one writer per bundle at a time. Existing source snapshots, coverage maps,
rejection decisions, full games and proof bundles remain separate because
builders and tests consume them. This consolidation replaced 218 individual
review files with four bundles without changing exercise content or decisions.

## Grading correction — 2026-11-02

The Rook-to-avoid-pat exercise and the Bishop/Knight-to-avoid-pat exercise
now belong to A across their published categories. Earlier Beginner descriptions
above record the historical review, not their current grade. The six-level
structure, objectives, positions, proof evidence and alternatives are unchanged.
