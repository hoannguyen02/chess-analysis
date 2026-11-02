# Draw expansion review — 2026-10-28

This follows the coverage checklist recorded before selection in
[draw-collection-review.md](draw-collection-review.md). The combined collection
has actual level counts of Beginner 24, A 24, B 28, C 29, C* 25 and D 27.
Selection remains explicit; this map records the instructional distinction for
every added position.

## Coverage and limits

- Beginner: direct removal of mating material, checking forks, equal queen
  exchange, king/pawn blockade, bishop/knight promotion control, immediate
  stalemate, en passant and knight underpromotion. Sixteen new compositions have
  three to five pieces and no preparatory sacrifice. Related blockade examples
  distinguish occupying the pawn's path, controlling the promotion square from
  elsewhere, avoiding a pawn attack, and choosing the king when a bishop has the
  wrong colour. They are not published as mirrored pairs.
- A: direct check resources by queens, rooks and knights supplement the retained
  bishop checks, final-material captures and defensive corners. Different
  decisions include capturing with check, keeping checking distance, protecting
  a checking piece, stopping promotion and retaining the king blockade.
- B: one preparatory king, pawn, bishop, knight, rook or queen move; coordination
  between bishop/rook or two rooks; allowing promotion while retaining checks;
  interpositions by rooks/queens. The retained fortress decisions remain.
- C: simple offers by pawns and every non-king piece, opening lines or diverting
  defenders; queen/rook/bishop/knight checking resources and five stalemate studies.
- C\*: 24 perpetual-check examples plus one non-check repetition. The latter
  requires a six-move king-and-bishop route through a locked-pawn ending before
  the starting position is repeated for a valid claim. The perpetual examples
  cover liquidation, king safety, knight routes, pawn counterplay, en-passant
  exchange, promotion and several kinds of interposition. Repeated demonstration
  cycles are not used to inflate the count. Alternative routes remain possible.
- D: 24 perpetual-check examples plus three multi-stage stalemate studies;
  perpetual examples require more than three solver decisions with advanced sacrificial coordination,
  including dual bishops, multi-stage rook/knight offers, promotion plus rook
  deflection, quiet preparation before a sacrifice, and three multi-piece
  stalemate studies. Individual checking-cycle demonstrations do not add levels.

Special moves are not quotas: Beginner has en passant and knight underpromotion;
C\* has en passant and promotion; D has promotion before a rook offer. No selected
A, B or C exercise needs en passant, and no selected C exercise needs promotion.
Castling as the drawing resource remains an unresolved coverage gap at every
level. Non-check perpetual pursuit and other fortress families remain coverage
limits, not claims of impossibility. The set is varied, not an exhaustive catalog
of every way to draw.

## Second-pass diversity review — 2026-10-29

The request to reduce repetition prompted a second review of the saved
candidate pools and the published selection. C\* now has 24 perpetual-check
examples and one non-check repetition example. D has 24 perpetual-check
positions and three multi-stage stalemate studies.
Their setup decisions are mapped individually above, but the drawing mechanism
is still concentrated; this is a coverage limit, not a claim that the levels
cover every way to draw.

I did not replace them with the available non-perpetual candidates:

- The reviewed insufficient-material and stalemate examples in the original
  pool are one-decision exercises (100 stalemate and 100 insufficient-material
  records), so moving them to C\* or D would violate the level definitions.
- Of the 100 fortress records, 93 were excluded as repeated defensive geometry;
  the seven retained examples already teach the selected corner, pawn-blockade
  and bishop-defence decisions at Beginner/A/B. Their reviewed FENs, lines and
  decisions remain in [curated-selection.json](../scripts/fixtures/draw-practice/curated-selection.json).
- A source game ending in repetition is not enough on its own. The selected
  `draw-9f2f87aadb799242` line was retained because legal replay confirms the
  starting position occurs three times after six White moves in the recorded
  route, and bounded engine screens cover every legal starting move and every
  opponent reply after those six moves. It is presented as the actual game line,
  not as a forced sequence. Other non-check repetition candidates remain
  unselected; their exact positions and existing review status are in
  [resource-proofs.json](../scripts/fixtures/draw-practice/resource-proofs.json).
- The study review has eight accepted studies in total: five fit C and three
  fit D. The other four reviewed studies were withheld, so they do not provide
  verified replacements. Exact positions and review decisions are in
  [study-review.json](../scripts/fixtures/draw-practice/study-review.json).

The combined set before this expansion had 24 at each level. This expansion
adds 13 perpetual-check positions. The route now has 24 examples in B, C* and D,
16 in A, 23 in C and none in Beginner. Perpetual-check A candidates were withheld because their
rook/queen checking loops repeat the same learner decision. C candidates that
allowed a simpler direct drawing check without the required sacrifice were
withheld; one suitable C position is still needed. Beginner remains a research
gap. These counts prioritize suitable exercises over quota filling. Per-position
evidence is saved in
[second-pass-diversity-review.json](../scripts/fixtures/draw-practice/second-pass-diversity-review.json).

## Explicit further exclusions

- `draw-master-cdd28177b06123f4-51`: the alternative `Nxb2` has a drawing knight
  continuation without the intended multiple sacrifices; not retained at D.
- `draw-master-1694568ba2f1b9b2-73`: `Bb3` leads to a drawing plan without the
  intended rook/bishop offers; not retained at D.
- `draw-master-a215b2d969e41ae3-47`: the initial move captures a queen, and the
  subsequent queen-for-rook liquidation is too misleading as evidence of a
  complicated D sacrifice; removed from the shortlist.
- `draw-master-08b3e79cb956b950-92`, `draw-master-08254d4b6c682cce-56` and
  `draw-master-291cc5084190f9ed-69`: natural captures/recaptures made the first
  decision insufficiently representative of C\* preparation. Replaced with quiet
  preparation involving an en-passant exchange, a queen/king route, and knight
  coordination. Exact rejected positions remain in the candidate/review files;
  the explicit replacement map prevents their regeneration into the selection.

- `draw-master-fbc896b5121b01f2-39`: fresh follow-up after `Nb5 Rxc6 Nxc3 Rxc3 Rd6` found a quiet drawing continuation; rejected at D rather than overlooking the simpler alternative.

## Added-position map

| Level    | Stable ID                          | Distinct decision                                                                        |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Beginner | `draw-composed-335a1e883d619d72`   | Checking bishop fork removes the last pawn                                               |
| Beginner | `draw-composed-2afee6264f8e90f1`   | Unblockable knight fork wins the last pawn with tempo                                    |
| Beginner | `draw-composed-05aeaa6e0d17bc79`   | Knight underpromotion checks and forks the opposing queen                                |
| Beginner | `draw-composed-fc5ad93b6067bc98`   | En passant removes an otherwise escaping enemy pawn                                      |
| Beginner | `draw-composed-b404db408939f576`   | Approach the pawn with access to its promotion square                                    |
| Beginner | `draw-composed-945cf6199e364e6c`   | Take direct opposition while blocking the pawn                                           |
| Beginner | `draw-composed-17471cc4d0c2bbee`   | Bishop occupies the square immediately ahead of a pawn                                   |
| Beginner | `draw-composed-8192b4c1563c647a`   | Knight blocks promotion when checking is unnecessary                                     |
| Beginner | `draw-composed-f5c6bb8fdb0ba9f2`   | Long diagonal controls the pawn advance from a distance                                  |
| Beginner | `draw-composed-a1601bd387e1a331`   | Knight guards promotion rather than occupying the pawn file                              |
| Beginner | `draw-composed-7e99b83b90b3dfe3`   | Use the king when the bishop cannot control the promotion colour                         |
| Beginner | `draw-composed-e31e8a3c485bda9f`   | Equal queen exchange removes both sides mating material                                  |
| Beginner | `draw-composed-c7b46cee843fcc90`   | Capture the checking queen creates immediate opposing stalemate                          |
| Beginner | `draw-composed-afebe96f65d9cb11`   | Lateral king opposition stops the king escorting a pawn                                  |
| Beginner | `draw-composed-95669811358c2639`   | Approach a rook pawn without entering the square it attacks                              |
| Beginner | `draw-composed-ca2966e8adacbcb1`   | Checking pawn advance closes the final pawn move                                         |
| A        | `draw-master-0c102f65995e7be0-103` | Knight checks exploit a king enclosed by its own pawns                                   |
| A        | `draw-master-10ec9da1a62316bf-110` | Rook checks interrupt promotion supported by a bishop                                    |
| A        | `draw-master-1da5fd6671881214-96`  | Capture a central pawn with check before using a long diagonal                           |
| A        | `draw-master-3b73e75e00b1d612-95`  | Queen and bishop restrict escape from rank checks                                        |
| A        | `draw-master-51346941141b9693-145` | Lateral rook checks separate the king from its seventh-rank pawn                         |
| A        | `draw-master-5a7b86c8194630d6-126` | Keep checking distance against two separated passed pawns                                |
| A        | `draw-master-6966e5ca028ed8e4-70`  | Capture an attacking rook with check and retain a queen draw                             |
| A        | `draw-master-73af547509e46b08-122` | Queen checks stop an advanced central king supporting promotion                          |
| A        | `draw-master-8280af282b51ffc0-84`  | A protected queen checking square prevents the king capture                              |
| A        | `draw-master-5c42278f87009aa6-88`  | Knight checks remain protected by the defending king                                     |
| A        | `draw-master-7d41d1a9c3bfaa2f-131` | Rear rook checks preserve the king blockade of a seventh-rank pawn                       |
| B        | `draw-master-554de31094a42f7c-59`  | Pawn advance prepares alternating bishop checks                                          |
| B        | `draw-master-2b427755f14af662-54`  | Double rooks coordinate on the seventh rank                                              |
| B        | `draw-master-0508a66b185d1c5e-89`  | Knight preparation permits a long queen checking diagonal                                |
| B        | `draw-master-10417628d059b9c7-53`  | Pawn recapture prepares queen checks on adjacent files                                   |
| B        | `draw-master-12b5374099778658-25`  | Opening queen capture creates checks answered by rook blocks                             |
| B        | `draw-master-22477e2d25de4fe0-81`  | Capture in the centre while allowing a promotion with counterchecks                      |
| B        | `draw-master-25e11aec90a62300-42`  | Knight capture reaches a checking circuit near the king                                  |
| B        | `draw-master-47708c3396adf262-40`  | King evasion precedes knight checks along the back rank                                  |
| B        | `draw-master-395bf1c92c523c77-63`  | Bishop retreat preserves the queen checking resource                                     |
| B        | `draw-master-1e9a4693bf13ff85-92`  | Active king placement supports rook checks in a minor-piece ending                       |
| B        | `draw-master-550d074f77e8a59f-94`  | Rook transfer prepares a pawn capture with check                                         |
| B        | `draw-master-9082240dac3d5698-49`  | Queen recapture leads to reciprocal queen interpositions                                 |
| B        | `draw-master-ae81a44b1250d8d9-58`  | Pawn advance prepares checks while an enemy passer advances                              |
| B        | `draw-master-660d74c8c3ed02fd-66`  | Pawn support stabilises a knight before checking                                         |
| B        | `draw-master-32b51ab07e54d862-58`  | Bishop check hands the checking attack to a rook                                         |
| C        | `draw-master-5b7f2d03d7b8f1a1-82`  | Rook sacrifice draws king onto queen checking diagonals                                  |
| C        | `draw-master-721781e4d78ef674-75`  | Exchange sacrifice opens a rook checking file                                            |
| C        | `draw-master-77ba954f7c44791c-75`  | Rook decoy opens a queen entry on the second rank                                        |
| C        | `draw-master-8790e81b1f82ed36-52`  | Knight check clears a pawn shield for long queen checks                                  |
| C        | `draw-master-8d836961b1cb54e3-47`  | Knight capture opens the h-file for the queen                                            |
| C        | `draw-master-baa9892ceae3b8af-90`  | Knight decoy clears a diagonal into the kingside                                         |
| C        | `draw-master-e3cb8ffc21d85e66-55`  | Quiet knight sacrifice opens a queen approach                                            |
| C        | `draw-master-f2fcda68ef0e04cd-44`  | Rook sacrifice removes a defender of knight checking squares                             |
| C        | `draw-master-029486451353af84-136` | Late rook exchange sacrifice opens diagonal queen checks                                 |
| C        | `draw-master-066857a8da4effc1-75`  | Quiet knight offer diverts the opposing queen                                            |
| C        | `draw-master-18a032b0faeaea26-43`  | Knight capture draws king forward into a checking net                                    |
| C        | `draw-master-8f50939281ca2608-45`  | Bishop offer diverts a queen from a key checking entry                                   |
| C        | `draw-master-92cee4888e048763-74`  | Queen sacrifice produces rook checks on the back rank                                    |
| C        | `draw-master-aa8e715fa326d644-92`  | Rook sacrifice creates checks answered by rook interpositions                            |
| C        | `draw-master-d69013fe0d9c5106-24`  | Bishop sacrifice draws a central king onto intersecting queen diagonals                  |
| C        | `draw-master-e633c11424b0000f-75`  | Knight sacrifice leads to queen checks with bishop blocks                                |
| C        | `draw-master-0a6700beb755c7b2-51`  | Knight sacrifice opens a bishop perpetual against a corner king                          |
| C        | `draw-master-84d38dd91dcc9bbf-65`  | Pawn sacrifice with check opens a queen checking route                                   |
| C        | `draw-study-a8e5cbbe890b1b5f`      | Bishop clearance followed by a rook stalemate offer                                      |
| C        | `draw-study-c66c689f88e4acec`      | Bishop and queen removal creates stalemate with locked pawns                             |
| C        | `draw-study-e098faf10d0ac907`      | Capture a pawn and offer the last rook while king escapes check                          |
| C        | `draw-study-b71aff4d0ff3f83d`      | King placement creates a stalemate shelter before the rook offer                         |
| C        | `draw-study-1f4736ceb5187931`      | Pawn timing locks the queenside before the final pawn offer                              |
| C\*      | `draw-9f2f87aadb799242`            | King-and-bishop route maintains the blocked-pawn ending for a non-check repetition claim |
| C\*      | `draw-master-3b196522cd4ccd8c-35`  | Queen transfer and an en-passant exchange open the rook file                             |
| C\*      | `draw-master-076dc48c57d383d3-46`  | Liquidate both rooks before the queen takes over the checks                              |
| C\*      | `draw-master-0eaf25ac2592182d-50`  | King safety permits a queen raid before returning to check                               |
| C\*      | `draw-master-0362f91cdfad3556-72`  | Rook activity and knight captures recover material before perpetual                      |
| C\*      | `draw-master-12edb29a82c9e5ae-39`  | Rook defence precedes pawn liquidation and a queen transfer                              |
| C\*      | `draw-master-12c6b51914b1cf7e-48`  | Recapture sequence clears the queen route through the centre                             |
| C\*      | `draw-master-15b06fed4cff6ef2-63`  | Queen retreat and king evasion before a pawn exchange opens checks                       |
| C\*      | `draw-master-0c0567c2bd992f3f-68`  | King safety and two minor-piece checks prepare queen checks                              |
| C\*      | `draw-master-163852725d5aaec4-53`  | Queen recapture and bishop exchange prepare first-rank entry                             |
| C\*      | `draw-master-205d65728dcc8495-94`  | Promotion threat gains time for knight re-routing                                        |
| C\*      | `draw-master-238562376d3dd056-85`  | King evasion and a three-stage knight route                                              |
| C\*      | `draw-master-2507abbf7e31ab4c-50`  | Heavy-piece exchanges leave queen checks answered by knight blocks                       |
| C\*      | `draw-master-25c2a002a19ffa92-37`  | Rook defence and pawn exchange prepare a lateral checking route                          |
| C\*      | `draw-master-286bb3597a12496e-63`  | Pawn counterplay opens a queen transfer while under rook pressure                        |
| C\*      | `draw-master-21bad3af8d4f74e3-37`  | Knight defence and a queen route around central pawn exchanges                           |
| C\*      | `draw-master-2932c121551c3ca5-67`  | King and pawn restrict an active king before rook checks                                 |
| C\*      | `draw-master-2b51779347e2ecc3-128` | King placement avoids a pawn tempo in a rook checking defence                            |
| C\*      | `draw-master-2c88aaedab2bdfc5-91`  | Queen manoeuvre reaches checks that require queen interpositions                         |
| C\*      | `draw-master-2d57922cf211ac38-38`  | Pawn countercapture and queen checks prepare knight perpetual                            |
| C\*      | `draw-master-31178386ec65ac80-131` | Both sides promote before the new queen begins a checking pursuit                        |
| C\*      | `draw-master-35a0ba0110d309d7-25`  | Rook defence permits bishop exchange and knight checking entry                           |
| C\*      | `draw-master-371f2867dbd8a119-39`  | Pawn recapture and bishop exchange clear knight checking squares                         |
| C\*      | `draw-master-07c9742c0709244e-14`  | Opening liquidation creates queen checks answered by rook blocks                         |
| D        | `draw-master-06405769c44fd4a2-53`  | Pawn clearance and rook decoy to expose the king                                         |
| D        | `draw-master-abe64c1990e48e17-39`  | Drive the king, exchange sacrifice and remove a shielding pawn                           |
| D        | `draw-master-983781f01eddd377-43`  | Knight clearance followed by a pawn sacrifice against a central king                     |
| D        | `draw-master-396564278a691312-42`  | Two rook sacrifices with a quiet rook transfer between checks                            |
| D        | `draw-master-91a021196233f0a9-94`  | Prepare two pawn offers before transferring the queen                                    |
| D        | `draw-master-037ec50ad2b3683e-56`  | Promotion followed by a rook decoy displacing a knight                                   |
| D        | `draw-master-125edb6d31631506-129` | Clear a pawn before sacrificing a rook to displace the defending knight                  |
| D        | `draw-master-24d318c9ffcf72c4-62`  | Consecutive knight and rook offers open a queen route                                    |
| D        | `draw-master-bb3d495301127d98-44`  | Two-rook coordination and a rook sacrifice to establish a rank cycle                     |
| D        | `draw-master-115a28c3238744d7-88`  | Rook clearance and queen pursuit of a king across three files                            |
| D        | `draw-master-59c72f8674622783-34`  | Two bishops remove both pawn shields around the king                                     |
| D        | `draw-master-ee2613dbdfbba37f-61`  | Queen capture, knight offer and rook sacrifice open the h-file                           |
| D        | `draw-master-07358d226242bce5-55`  | Exchange sacrifice changes the pawn structure before a quiet queen transfer              |
| D        | `draw-master-7966208941e1a6ad-30`  | Non-checking bishop sacrifice and later knight clearance                                 |
| D        | `draw-master-47ae61093043153e-20`  | Knight preparation and queen sacrifice establish a knight checking net                   |
| D        | `draw-master-4c0657e4ddea64e6-28`  | Multiple sacrifices dismantle central and kingside defences                              |
| D        | `draw-master-54f9b0fa9d2b61b7-67`  | Quiet queen defence and rook sacrifice force queen interpositions                        |
| D        | `draw-master-10539c970e9cadaf-47`  | Bishop preparation and two exchange sacrifices create diagonal checks                    |
| D        | `draw-master-ffece1e83a5158d6-83`  | King safety precedes a rook deflection and queen checking net                            |
| D        | `draw-master-c4743eeace7a383f-58`  | Knight sacrifice and pawn breakthrough before an exchange sacrifice                      |
| D        | `draw-master-1197dd88628bda64-47`  | Quiet rook coordination prepares a rook sacrifice on the h-file                          |
| D        | `draw-study-3799d2267e5c81c2`      | Three successive offers remove every mobile piece                                        |
| D        | `draw-study-8a5405cd22378726`      | Rook knight and queen sacrifices empty the defending army                                |
| D        | `draw-study-c655985f67697a02`      | Queen offer and pursuing rook eliminate the last legal moves                             |

## Perpetual-check additions

| Level | Stable ID | Distinct decision |
| --- | --- | --- |
| B | `draw-master-3ec554f0638b1063-61` | Promote while using queen counterchecks to stop the opposing passer. |
| B | `draw-master-069ed11d0cdb155f-62` | Capture a pawn before alternating queen checks on two files. |
| B | `draw-master-0ec77f02e8c8af4d-41` | Bishop capture permits queen checks from distant files. |
| B | `draw-master-1c449a6ca1c5f9f0-108` | Reroute the knight while the rook attacks from behind. |
| C | `draw-master-4c2ce24960539beb-40` | Sacrifice the bishop with check to open a queen checking circuit. |
| C | `draw-master-695cd9b83a21ce55-89` | Sacrifice a knight with check to draw a pawn away before queen checks. |
| C | `draw-master-63c8feb78f91a03f-57` | Sacrifice a rook with check to open queen checks after a pawn recapture. |
| C | `draw-master-9bb1f357ebd41faf-62` | Offer a knight to divert a pawn before queen checks begin. |
| C | `draw-master-1fe304a99f6aa7cd-67` | Exchange a rook to let two knights alternate checks. |
| C* | `draw-master-002c896c4dcdef98-124` | Capture a pawn and place the king before a lateral rook checking route. |
| D | `draw-master-872444ae4aa483e4-59` | Coordinate two sacrifices and a knight reroute to establish a checking cycle. |
| D | `draw-master-d4df7ff6c464849d-35` | Offer a rook and queen before establishing the knight checking cycle. |
| D | `draw-master-ed8558b55a9d022a-54` | Offer a rook to clear the queen route for a six-decision checking sequence. |

## Final validation before the 2026-10-29 perpetual-check expansion

- 186 Node tests passed: draw collection and display, legal replay, source viewer,
  trainer, worksheet export, protected access, and shared alternative-mate logic.
- Python checks validated all 144 unique positions, all new legal roots, source
  PGNs/preceding moves, tactical evidence and saved exact introductory WDL data;
  independently replayed 242 strategy nodes from the original selection.
- TypeScript and worksheet-copy audit passed. Rendered D solution pages were
  inspected: notation, explanations and provenance fit without clipping.
- Browser verified 24 on all six level badges in the default combined view,
  normal/full-screen objective visibility, and 390px layout without horizontal
  overflow. Empty topic filters are omitted; all six levels remain visible.
- Snapshot: `tmp/pdfs/draw-24-per-level.png`. Temporary preview server was stopped.

## Follow-up review — 2026-10-29

- Rechecked the active `ChessPractice` data flow. The combined “all skills”
  category and the “all levels” button are absent; only populated draw themes
  and the six required levels are shown. At that validation point, each level
  remained at 24 positions.
- Added individual protected routes and worksheet sources for perpetual check,
  stalemate, insufficient material, non-check repetition and fortress defence.
  Each route retains links to the other Draw themes and shows its actual count
  at each level; the route-by-level matrix and empty-level gaps are recorded in
  [draw-practice.md](draw-practice.md).
- Regenerated the C\* worksheet and answer booklet through the shared PDF
  generator. Inspected rendered answer pages 2–3: Vietnamese move descriptions,
  en-passant notation, repetition-claim wording and source attribution fit
  without clipping. The repetition example correctly says the game has not
  automatically ended and that the recorded continuation is not necessarily
  forced.
- Before the perpetual-check expansion, Draw curation/addition checks, 156 Draw
  tests, TypeScript, worksheet-copy audit and 25 worksheet/access tests passed.

## Perpetual-check expansion — 2026-10-29

The user asked to begin reaching 24 positions per level with perpetual check.
Thirteen positions passed fresh bounded engine analysis, legal replay,
provenance checks and review of the saved root-move screens:

| Level | Stable IDs | Instructional decisions |
| --- | --- | --- |
| B | `draw-master-3ec554f0638b1063-61`, `draw-master-069ed11d0cdb155f-62`, `draw-master-0ec77f02e8c8af4d-41`, `draw-master-1c449a6ca1c5f9f0-108` | Promotion with counterchecks; queen capture followed by checks on two files; bishop capture opening queen checks from distant files; knight rerouting while the rook attacks. |
| C | `draw-master-4c2ce24960539beb-40`, `draw-master-695cd9b83a21ce55-89`, `draw-master-63c8feb78f91a03f-57`, `draw-master-9bb1f357ebd41faf-62`, `draw-master-1fe304a99f6aa7cd-67` | Bishop check sacrifice; knight check drawing a pawn away; rook check sacrifice opening queen checks; knight offer diverting a pawn; rook exchange handing the checks to two knights. |
| C* | `draw-master-002c896c4dcdef98-124` | Rook capture and king placement prepare a lateral checking route; six solver decisions, no sacrifice. |
| D | `draw-master-872444ae4aa483e4-59`, `draw-master-d4df7ff6c464849d-35`, `draw-master-ed8558b55a9d022a-54` | Two sacrifices and knight rerouting; rook and queen offers establish a knight cycle; rook offer clears the queen route for a six-move checking sequence. |

The eight remaining A candidates were withheld because they repeat existing
rook/queen checking loops, including a same-game sibling and a knight cycle
that adds no distinct setup decision. `draw-master-983781f01eddd377-49` was
also withheld because it is a shifted start from the same Anand–Kramnik game as
the selected D position. In C, `draw-master-2a595fb4ffa62193-51`
was withheld because immediate `Qe4+` gives a simpler drawing check; the
replacement `draw-master-21c02179d1a79185-46` was withheld because `Nh6+`
provides a direct drawing alternative without the C-level exchange sacrifice.
`draw-master-034a84968393e128-68` was withheld from C* because `a3` and `Qa7+`
draw without its six-move preparation. `draw-master-c2f3a0cdab4098b7-34` was
withheld from D because `Nc4`, `Nf3` and `Nd3` offer simpler drawing routes
without its two sacrifices. Full FENs, candidate moves, screened drawing roots
and reasons are saved in
[editorial-exclusions.json](../scripts/fixtures/draw-practice/editorial-exclusions.json),
and the selection builder and regression test prevent these examples from
returning. C still needs one suitable position; A needs eight; Beginner needs
24. Those gaps remain visible in the route counts.

Fresh addition checks passed: 157 positions have unique starting positions,
their saved lines replay legally, selected master games retain full PGN
provenance, and engine screens cover every legal root move. The current
combined counts are Beginner 24, A 24, B 28, C 29, C* 25 and D 27. Perpetual
route counts are Beginner 0, A 16, B 24, C 23, C* 24 and D 24.

Validation after publication: 161 Draw tests passed; the independent Python
addition and curation checks passed; 33 worksheet and practice-access tests
passed; the worksheet-copy audit and `tsc --noEmit` passed. The generated local
game viewer index contains the newly added master-game positions.
