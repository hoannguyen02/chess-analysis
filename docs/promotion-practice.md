# Promotion practice: four objectives

The promotion family has four private practice routes with the existing shared access. All reuse
`ChessPractice`, `DrawTrainer`, the shared full-game dialog, access guards and
worksheet generator. Each route keeps Beginner, A, B, C, C*, D, D*, E, E* visible, including
empty levels. The starting side and explicit objective remain visible in normal
and fullscreen practice. These are the project's instructional levels.

| Route | Objective | Beginner | A | B | C | C* | D |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/promotion` | Material gain through promotion | 14 | 15 | 10 | 3 | 0 | 1 |
| `/underpromotion` | Choose a piece other than Queen for a concrete reason | 1 | 5 | 1 | 0 | 1 | 1 |
| `/passed-pawn-simplification` | Exchange into a winning passed-pawn ending | 0 | 8 | 9 | 15 | 6 | 13 |
| `/promotion-mate` | Checkmate involving promotion | 5 | 20 | 18 | 17 | 21 | 22 |

Target: 24 verified positions per level. Counts below 24 are research gaps, not
permission to transfer mating difficulty labels to shorter material lines or
publish equivalent Queen promotions as necessary underpromotions. No fabricated
game references are used. Sparse introductory positions and modified positions
are labeled composed. Real-game positions retain locally saved full replay,
preceding move and archived research provenance. The 51 retained passed-pawn positions
reuse the established master-game simplification corpus and its reviews.

## Level A: balanced-start editorial review — 15 / 24

All 24 former A positions were reviewed under the balanced-start rule. Three
are retained, 21 are removed from this material collection, and twelve verified
replacements/additions are published. The result is **15 positions, with a gap of 9**.
Beginner and the other promotion-family collections are unchanged by this review.
A roughly balanced start concerns material and the tactical decision, not an
engine score of zero: a sound winning combination can already have a high score.

| Decision | Stable identifier | Review |
| --- | --- | --- |
| Necessary rook promotion avoids pat | `promotion-beginner-avoid-stalemate` | Retained at A: wrong promotion choices draw |
| Capture-promote against two rooks, counting recapture | `promotion-a-capture-rook-recapture` | Retained: Matinian–Kamsky turns a minor-piece deficit into a small material edge, not a claimed game win |
| Interpose by promotion, then recapture with the King | `promotion-a-promotion-interposition` | Retained: roughly balanced rooks |
| Checking Knight promotion prevents back-rank mate and forks the Queen | `promotion-a-balanced-knight-fork` | Rebuilt with approximately equal material; includes the final recapture |
| Protected rook check clears the promotion square | `promotion-a-balanced-rook-clearance` | Active opposing Knight attacks the pawn and protects a rook capture; removes the old easy conversion |
| Checking equal-rook exchange or win the rook if declined | `promotion-a-rook-exchange-promotion` | Immediate promotion fails; pawn recapture makes the exchange possible |
| Remove a blocker through either capture order | `promotion-a-capture-blocker-exchange` | Rook-first and pawn-first are alternatives in one exercise, not two entries |
| Exchange rooks to remove the promotion defender | `promotion-a-master-94f8f46e8e703025` | Aronian–Dubov, full saved game |
| Pawn check prevents counterpromotion, then promotion opens a rook check | `promotion-a-master-d80d26ca5ca1d728` | Nepomniachtchi–Rustemov; replaces the later endpoint from the same game |
| Pawn check enables capture-promotion of a rook | `promotion-a-master-ee62b9c3648c98a2` | Ivanchuk–Felgaer; full saved game |

The follow-up research adds four master-game decisions without replacing the
previously approved ten:

| New decision | Stable ID (`promotion-a-master-…`) | Source |
| --- | --- | --- |
| Rook check evicts the opposing King from the promotion square | `3758bfad170039f0` | Bharath Subramaniyam–Caruana |
| Protected Knight blocks the defending rook's line; capture is met by capture-promotion | `b26391c1f9174baa` | Martin Fuentes–Caruana |
| Move the attacked rook so it screens the King and new Queen against a checking skewer | `bd38e1825a7c2cf0` | Caruana–Rasulov |
| King approaches to protect the promotion square while retaining a tempo in a pawn race | `1feb26cc76391e36` | Hong–Caruana |

This round legally parsed 27,110 games from the Capablanca, Karpov, Anand,
Kramnik, Carlsen and Caruana archives, yielding 1,775 distinct games containing
promotion. It screened 401 capture/check preparations and 1,361 quiet
preparations, alongside additional endpoint and quiet-move reviews in the prior
corpus. These are research counts, not counts of approved exercises. Raw
archives stay outside the repository; selected complete games, checksums,
all-root screens, certificates and exclusions remain in the consolidated review.
The two games ending at promotion have a clearly recorded illustrative final
reply; the local game viewer retains only the actual game continuation.

Rejected examples include a bishop check that already skewers a rook without
promotion, a bishop block that is unnecessary because the bishop already guards
the opposing promotion square, genuine sacrifices, and repeated checking-pawn
capture-promotion mechanisms. A king escape requiring a longer queen/rook
exchange to answer checks was not forced into A. Unreviewed research leads stay
unpublished; their initial numerical certificates are not editorial approval.

The Grischuk–Ivanchuk candidate was removed after review. The saved start
requires White to escape check with `Kh1`; following the actual `...Be3`, the
next White-to-move position has an uncontested `c8=Q+`. That shifted start
would be a routine promotion, so the complete game and exclusion reason remain
in the review bundle without a Level A exercise.

A further composed position, `promotion-a-capture-minor-avoid-pat`, starts
with two White pawns against a rook and with White in check. `bxc8=B` captures
the checking rook and promotes to a Bishop; `bxc8=N+` is also valid. Promoting
to a Queen or rook gives stalemate. All legal king replies and every legal
starting move were checked. This is a capture and an underpromotion decision;
it does not repeat the existing noncapture rook promotion that avoids pat.
The rule-sensitive distinction was checked against the current
[FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023), Articles 3.7.3.3
and 5.2.1. The position is labeled composed.

The complete original snapshots, decisions, all-root screens, replacement
certificates, coverage map and research exclusions are consolidated in
`material-a-editorial-review.json`. Historical `material-a-expansion.json`
remains a builder input and evidence archive; its old selection is superseded.
`review-promotion-a.py` validates the final selection, and the split builder
applies its exclusions on every rebuild. Rejected examples cannot return just
to restore the former count. Their proofs and source games remain available to
historical builders and other topics.

Replacement research screened preparation positions from the validated local
master-game corpus, then expanded to the Ivanchuk and Rubinstein archives.
Complete source games, preceding moves and archive checksums are saved locally.
Every selected root has an 800,000-node all-legal-root engine screen, which is a
finite editorial screen, not an exhaustive shortest-mate proof. Material
certificates independently cover every legal defence within two solver moves.

Completion now also checks whether a checking reply can recover the newly won
material. It must be possible to answer checks without losing the certified
gain, against all replies, within a bounded continuation. A discovered rook
skewer that recovers the promoted Queen is explicitly rejected. A harmless
checking rook that can be captured safely does not invalidate the gain.
For explicitly reviewed promotion threats, declining the exchange or intervening may lose a rook
without an actual promotion; only those exercises opt into that objective.
Runtime exhaustion remains unverified. Certificates and tests distinguish this
from immediate completion or a claim that the resulting game is won.

Remaining A gaps include further distinct balanced decisions, quiet preparation
with a real defensive constraint, and suitable
special-move preparation. Sacrificial deflections belong to C. These gaps do
not justify repeated color reversals, routine conversions, or longer lines at A.

## Level B review — 12 / 24

At the first review, both former material-promotion B positions were removed. In
Morozevich–Kozak, Black starts a rook and several pawns ahead and simply advances
the d-pawn. In Manukian–Morozevich, White starts with a rook and pawn against a
bare King and advances without opposition. Neither position asks for a promotion
tactic that creates the advantage. Their exact FENs, lines, game IDs and reasons
are retained as builder exclusions in `material-a-editorial-review.json`.
The complete source games remain available locally.

Twelve master-game positions now teach distinct short decisions without a
sacrifice:

| Exercise ID | Decision and verified payoff |
| --- | --- |
| `promotion-b-carlsen-grischuk-rook-exchange` | 77.Rd6 offers a rook exchange on the file that stops d8=Q. After 77...Rxd6+ 78.Kxd6, the pawn promotes. The all-reply certificate also covers declined exchanges. Direct 77.d8=Q loses the new Queen to ...Rxd8. |
| `promotion-b-kramnik-protect-square-check` | 54...g2+ drives the White King. After 55.Kf2, ...Bd4+ both checks and protects g1, allowing ...g1=Q. The all-reply certificate includes other King responses. |
| `promotion-b-navara-rook-check-exchange` | 52...Ra1+ coordinates a rook exchange with the c-pawn. After 53.Kd2 Rxe1 54.Kxe1, ...c1=Q+ gains material; the certificate also covers other legal defences. |
| `promotion-b-nakamura-capture-stop-counterplay` | 49...axb6 removes White's advanced b-pawn while Black's f-pawn is ready to run. 50.Kc6 f2 51.a4 f1=Q is the played line; other defences are checked. |
| `promotion-b-duda-queen-exchange-clear-square` | 49...Qxf2+ exchanges Queens and vacates a2 for the black a-pawn. After 50.Kxf2 a2 51.Nf3 a1=Q, Black gains material. |
| `promotion-b-nepomniachtchi-queen-clearance-defense` | 63...Qe4+ vacates b1 and still guards it along the diagonal. The original game used ...Qc2+ before ...b1=Q; the certified analysis also checks a White capture of the new Queen. |
| `promotion-b-grischuk-knight-check-deflection` | 48...Nd3+ deflects the White King from e1. After 49.Kd1 e2+ 50.Kc2 e1=Q, Black gains material; immediate 48...e2? permits Kxe2. |
| `promotion-b-caruana-knight-exchange-defender` | 75.Nxd6 exchanges Knights, removing the defender of f7. After 75...cxd6 76.f7 c5 77.f8=Q, White gains material; immediate 75.f7? loses the pawn to ...Nxf7. |
| `promotion-b-giri-nihal-rook-exchange-pawn-race` | 78...Rxb7+ exchanges the last Rooks with check before Black advances ...f2. In the played 79.Kxb7, the White King stands in front of its b-pawn; after 79...f2 80.b6 f1=Q, Black promotes first. The certificate covers every legal King reply and the new Queen's safety. |
| `promotion-b-twic1668-kolla-wiegmann-rook-attack` | 49.Rb4 attacks the black rook on b1 while supporting b8. In the game, 49...Rxb4 50.cxb4 clears the b-file; after ...h2, 51.b8=Q+ Kg7 leaves the new Queen safe. If the rook leaves the b-file, the rook on b4 protects the promotion square; ...Rb3+ can be met by Kxb3. |
| `promotion-b-twic1588-boder-king-removes-promotion-defender` | 61...Kxc3 captures the Bishop controlling a1. Immediate 61...a1=Q? allows Bxa1; after the King removes the defender, the played 62.g4 a1=Q promotes safely. This is the set's King-capture-of-defender example. |
| `promotion-b-twic1589-alikulov-removes-bishop-from-b8` | 48.Nxe5 removes the Bishop controlling b8 along e5–d6–c7–b8. Immediate 48.b8=Q? loses the Queen to ...Bxb8. After the game's 48...a2 49.b8=Q a1=Q+ 50.Kg2, White keeps the promoted Queen and the captured Bishop is not recovered. |

Eleven of the twelve start within one pawn of material equality. The Boder position is a
material-imbalance exception: Black starts down a Bishop and two pawns, but
Kxc3 is the only legal root that turns the promotion into a winning material
advantage. The saved full games, archive
checksums, source ply, preceding move, all legal root-move engine screen and
all-reply material certificates are bundled in
`material-a-editorial-review.json`. The certificate proves the stated bounded
material payoff; the finite engine screen checks competing starting moves. B
still has a gap of **12** distinct exercises. The TWIC 1668 scan replayed 7,159
legal games; 1,060 contained a played promotion and yielded 3,954 balanced
same-mover starts for screening. Kolla–Wiegmann adds a rook attack that makes
the pawn recapture clear the promotion file, distinct from the King recapture
in Carlsen–Grischuk and the checking exchange before a pawn race in Giri–Nihal.

A Karpov–Polgar candidate was withheld after checking every legal starting move.
The Knight interposition `Nd6` appears to shield the promotion square, but
`d8=Q Rxd8 Kxd8` wins the Rook for the pawn without that preparation. Its
complete game, source checksum, direct-promotion line and all-root screen are
kept as a rejection record in the consolidated review.

This research pass screened 862 balanced, forcing starts before played
promotions in the retained PGN corpus. Twenty-two passed an initial bounded
material certificate; detailed editorial review accepted the two above and
rejected the other twenty, with exact FENs and reasons in the same bundle.
The screen was bounded to three solver moves, so it does not establish that
longer C* or D opportunities are absent from those games. Counter-promotions,
routine pawn races, direct rook captures and a stronger immediate promotion
accounted for several exclusions.
A separate four-solver-move pilot reviewed four balanced starts: one had a free
capture and three had no bounded all-reply certificate. Their exact FENs remain
in the review bundle as exclusions or unresolved candidates, not as proof that
longer examples do not exist.

A further local full-game search indexed 2,023 distinct saved games across the
project's validated PGN-derived corpora. Of these, 263 contained a played
promotion; 579 balanced starts four to ten plies earlier passed a broad
discovery filter. These numbers describe leads, not verified exercises. Two
apparent sacrificial examples received all-root engine review and were rejected:
Anderssen–Finch's `Nf6` depended on a cooperative pawn capture, while
Carlsen–Svane's `Rxa8` collected a rook before the later promotion and had a
stronger competing check. Exact game IDs, FENs, played segments and reasons are
in `material-a-editorial-review.json`. A follow-up review accepted Navara's
rook check and exchange from this local search. The search method and
source-verification requirements are now explicit in `AGENTS.md`.

The subsequent PGN Mentor search parsed **5,668** eligible games with a played
promotion from fourteen player archives. It retained **1,481** balanced leads
four plies before that promotion, screened all legal starting moves, and ran a
bounded all-reply material certificate for **652** promising leads. Forty-six
passed that numerical certificate; six passed the additional B editorial and
distinctness review. The archive SHA-256 values, accepted complete games,
source plies, preceding moves, proof trees, all-root screens and selected
exclusions are consolidated in `material-a-editorial-review.json`. The archive
ZIPs and rejected raw games are not committed. A certificate alone does not
establish that promotion is essential: examples were withheld for an already
winning start, a simpler non-promotion move, a repeated mechanism, or a genuine
sacrifice that belongs to another level. The screen examined played promotions
within three solver moves, so it does not rule out other B examples in these
games or in other archives.

The two former C positions both began with Rxg4+, followed by a check and
c-pawn promotion. The version with an extra black pawn on d7 did not change
the learner's decision or defensive mechanism and remains a durable rejection.
The other C position and the sole D position are composed; their proofs remain
in research data, but neither is published under the real-game-only rule for
material-promotion levels B–D. C, C*, and D each have **0 / 24**, with a gap
of **24** verified real-game positions per level.

A fresh C scan found two additional lines that passed a bounded three-move
material certificate: Nepomniachtchi–Puzyrevsky (`603065f0a76bfde3`) and
Caruana–Hajiyev (`f5d0bf1b87627194`). Both are excluded because their starting
positions are already decisively winning and the published lines contain no
necessary sacrifice. The full games, exact FENs, archive checksums, 600,000-node
screens of every legal starting move and certificate summaries are recorded in
`advancedLevelScopeReview.reviewedLeads`. They do not fill C or B.

The next B–D research pass corrected one classification: Caruana–Yuan's
`75.Nxd6` exchanges Knights and removes the defender of f7; it is the eighth B
exercise. Giri–Nihal's checking rook exchange before the pawn race is the ninth.
At that review stage, material-promotion counts were B **10 / 24**, C **0 / 24**,
C* **0 / 24**, and D **0 / 24**. Searches of the fourteen archived player
collections examined starts four to ten plies before played promotions. The
13,202 numerical leads included 5,021 with a temporary material deficit and
8,181 longer lines without one. A narrower C screen gave 100 balanced forcing
starts for all-root engine review; 36 merited further inspection. The checked
Knight, Bishop and Queen sacrifice lines did not pass the bounded all-defence
material certificate, or gained material independently of promotion. Three
longer non-sacrificial C* leads exhausted a 20-second proof attempt and remain
unverified. The two newly certified C lines were rejected as already-winning
conversions, so the C gap remains 24. A small-board D discovery screen yielded 97 leads, but none has a
complete sacrifice, all-reply payoff and distinctness review. These discovery
counts do not establish that suitable positions are absent from the games.
Exact reviewed FENs, game IDs and reasons are saved in
`material-a-editorial-review.json`; timed-out leads are not published.

The next TWIC 1668 pass widened the material lead filter to include positions
with an imbalance of roughly one to three pawns. This yielded 1,577
material-window starts, or 314 distinct games with two or three solver moves
before promotion. A 12,000-node starting-position screen prioritized 49
near-equal leads for a separate 12,000-node screen of every legal root move.
Twenty-five intended moves ranked first, thirteen ranked second or third, and
eleven ranked lower. These remain unreviewed leads: the finite screens do not
establish that a position is not already won, prove the promotion payoff, or
cover all defensive continuations, so none was added to a level. Their exact
FENs, scores and root screens are in the `modestImbalanceResearch` section of
`material-a-editorial-review.json`; the level counts are unchanged.

A further review of 46 locally certified promotion candidates also withheld
Erigaisi–Cherniaiev (2023), despite its played `b7+` and promotion. Its starting
ending is already decisively won: every screened legal move retains a large
advantage, and the connected passed pawns make promotion a conversion rather
than the source of the advantage. The complete game, source archive checksum,
exact FEN, source ply and all-root screen are saved with the exclusion record.
This reinforces the distinction between a verified promotion line and a
position that teaches promotion as the decisive tactic.

## Level B promotion decision rule

Level B is a short, non-sacrificial preparation that makes promotion work
against a real defensive resource. A sound equal-value exchange may remove or
displace a defender, open the promotion file, or clear the pawn's destination.
A check may gain the tempo needed to do this, and a King or minor piece may
protect the new piece. A deliberate material offer belongs at C, even when the
line is short.

Review the candidate's legal pawn choices together: advance straight, capture
onto the promotion rank, or prepare first. A capture-promotion can fail when a
defender still controls the promotion square or can take the new Queen; it is
not automatically better than a quiet advance. Conversely, an advance may
fail while a capture removes the defender. Show the relevant exchange or
defensive branch, including recaptures, the safety of the promoted piece, and
any opposing passer or counterpromotion. Check all legal starting moves for a
simpler result that makes the promotion incidental. These boards suggest
useful motifs, but without complete FENs and game records they are research
prompts, not verified exercises.

| Level | Covered decision | Outstanding coverage |
| --- | --- | --- |
| B | Defender exchange; tempo checks; minor-piece support; removing the opposing passer; Queen clearance and defence; checking exchange before a race; attacking a rook that controls the promotion file; the King captures the Bishop controlling a1; a Knight captures the Bishop controlling b8 and meets a counterpromotion check (twelve IDs above) | Blocking a defender without sacrifice; compare straight advance with capture-promotion when the promotion square is defended; a distinct King-supported promotion; distinct underpromotion and en passant preparation; further mechanisms without sacrifice or routine conversion. |
| C | Two real-game Rook offers that enable promotion; one Queen offer that creates capture-promotion | Further distinct sacrifices, colors, capture-promotion and underpromotion with a verified material payoff. The composed rook offer (`composed-8ba20517c3be86ac`) remains research-only. |
| C* | None | Four- or five-move preparation without sacrifice, with all defensive replies and a promotion-specific payoff. |
| D | No published real-game position | Distinct master-game examples with complex sacrifices and more than three solver moves. The composed multi-move sacrifice (`composed-000a0aed78a1f0b5`) remains a research example only. |

Promotion is the defining special move on this page. No en passant
preparation has yet passed the full promotion-payoff review at B–D; a composed
attempt in the research pass allowed `exd6` but failed the bounded all-reply
certificate and had a stronger non-promotion rook capture. Castling cannot
itself promote and no verified preparatory castling example has been found.

## Coverage and selection review

Material: review capture/noncapture promotion, both sides, immediate/delayed
payoff, preparation, removal of blockers, sacrifice and recovery, and safe
retention of the promoted piece. Beginner now has **14 / 24** reviewed positions,
including five Black-to-move additions and both promotion ranks. The retained
rook pat-avoidance decision remains at A. At the time of this earlier review, the other levels contained A 15, B 8,
C 0, C* 0 and D 0; all six levels remain visible.

| Beginner decision | Stable ID suffix (`promotion-beginner-…`) |
| --- | --- |
| Unopposed safe advance | `safe-advance` |
| Capture the rook that would take a straight promotion | `capture-defender` |
| Capture away from the enemy King instead of advancing into its reach | `away-from-king` |
| Capture the checking rook while promoting | `capture-rook-checker` |
| Advance onto a square protected by the friendly King | `king-support` |
| Capture next to the enemy King while opening the supporting Bishop ray | `open-support` |
| Choose the safe square among two available captures | `two-captures` |
| Advance instead of making an unsafe capture | `advance-not-capture` |
| Capture diagonally when a piece blocks the forward square | `blocked-forward` |
| Capture the Bishop pinning the promoting pawn | `capture-pinner` |
| Choose between two pawns with different promotion-square safety | `two-pawns` |
| Promote with check so the opponent cannot immediately counter-promote | `stop-promotion` |
| Give double check so a rook cannot recapture the promoted piece | `double-check-recapture` |
| Exploit a pinned bishop that cannot recapture the promoted piece | `pinned-recapturer` |

The three introductory exchange endpoints (`capture-defender`,
`capture-rook-checker`, `blocked-forward`) now place the opposing King on the
same last rank as the captured rook, as requested. Each capture-promotion gives
check. These replace the earlier layouts rather than adding duplicate exercises. The earlier
positions/reviews are retained in `revisionHistory`, and the replacement root
screens in `replacementReviews`, inside the candidate bundle. No unverified
preceding sacrifice or forced exchange is claimed. Actual preparation belongs
in later levels after separate verification and grading.

`material-beginner-candidates.json` is one bundled source/review file containing
18 candidate decisions, finite Stockfish 17 analysis of every legal root, and
six durable rejections. `material-beginner-review.json` records every legal root
and immediate reply for the 14 Beginner exercises and the retained A exercise,
plus the earlier 22 duplicate exclusions. Builders verify legal replay, no
immediate mate from any root, no free non-promotion capture without an effective
reply, and retained material against every response to the published promotion.
The twelve additions explicitly require keeping the promoted piece; alternative
promotions are checked against the same objective, not a stored move list.

Rule wording was checked against [FIDE Laws, Articles 3.7 and 3.9](https://handbook.fide.com/chapter/E012023) on 2026-11-02: forward movement, capture-promotion, immediate promotion effect and King safety.

The two latest additions each have six pieces and require one immediate
capture-promotion without preparation or sacrifice. They distinguish two actual
recapture restrictions: `double-check-recapture` uncovers the rook's checking
file, whereas `pinned-recapturer` relies on a bishop already pinned to its King.
Both opposing Kings are on rank 8 with the captured piece. Each source record
includes a counterfactual: remove the relevant supporting piece and the
previously illegal recapture becomes legal. Tests replay these counterfactuals
and check that the shared trainer rejects the unsafe promotion without support.
Finite all-root Stockfish screens use 600,000 nodes for each addition; legal
all-reply checks certify the immediate payoff separately from engine scores.
These are composed final-step exercises; no preceding forced exchange is claimed.

**Gap: 10 further distinct Beginner decisions remain unverified.** Changing the
checking piece or adding an irrelevant check does not create a new decision.
Two proposed blocking routes lost the promoted piece to a rook. A proposed
Knight-supported capture was rejected because Nxb8 already wins material without
promotion. Their exact positions and reasons remain in the candidate bundle.
Straight interpositions requiring recapture, longer preparation and necessary
underpromotion need separate level review; pat decisions start at A. En passant
and castling cannot themselves promote and are excluded from this immediate set.
The finite engine screen is not an exhaustive proof against longer competing
mates; the material certificate covers the stated one-move payoff. Longer
published lines stop at certified material gain and are graded at that prefix,
not by a later mating continuation. Exact FENs, lines, certificates and levels
are in `scripts/fixtures/promotion-split`.

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

Direct material tasks with three to six pieces use the shared all-reply promotion
verifier. Where required, it also checks that the promoted piece survives every
reply; this includes positions with supporting pieces and two pawns.
Longer unsaved material alternatives use bounded all-defence objective search;
exhaustion is unverified, not incorrect. Completion requires the actual material
payoff after a defensive reply, rather than reaching the stored line's length.
No general game-winning claim follows from a numerical material gain.

Promotion choices that require avoiding pat start at A by user instruction.
The rook choice and the Bishop/Knight choice were regraded without changing
positions, objectives, solutions or verified alternatives. Beginner keeps direct
promotion and capture-promotion.

## Promotion research update — 2026-11-02

At this review stage, the material-promotion page contained **Beginner 14/24,
A 15/24, B 10/24, C 1/24, C* 0/24, D 1/24**. C and D each gained one verified position from a
complete TWIC master game:

- `promotion-c-twic-2cbfdfb39ae52d12`: Papasimakopoulos–Jaskolka (2026),
  45.Rxa4+ offers the rook with check. If the defending rook takes it, c8=Q;
  if the King declines, the rook on a8 can be captured. The start is about a
  pawn down for White, and the 600,000-node-per-root screen ranks the intended
  move first. The all-reply material certificate records the promotion payoff.
- `promotion-d-twic-50ff2f332addb371`: Seemann–Mahdavi (2026), 27.e7 begins a
  four-move plan; White sacrifices the Queen on e3, then 30.exf8=Q+ captures
  the rook. The played continuation 30...Kxf8 31.Rxe3 recovers the opposing
  Queen. This is a substantial sacrifice with coordinated promotion threats,
  appropriate to D.

Both complete games, original headers, exact exercise FENs, preceding moves,
archive checksums, all-root screens and bounded all-reply proof trees are saved
in `material-a-editorial-review.json`; builders copy the games to the local
replay source. The certificates establish their stated material payoff within
the bounded search, not game-theoretic perfection beyond that scope.

The additional TWIC 1661–1667 batch parsed **57,023 legal games** and generated
53,603 distinct-game position leads. Broad all-root screening covered 270
balanced B leads, 376 C leads, 627 C* leads and 299 D leads; these are discovery
figures, not approved-exercise counts. Expanded quiet-move B searches also
found no candidate that passed the full payoff and defensive-reply review.
No C* candidate passed the complete promotion-specific review. This is a
research gap, not evidence that suitable examples do not exist. The accepted
count remains far below 24 in each advanced material-promotion level, and no
positions were added to pad it.

This pass also recorded a stronger proof requirement in `AGENTS.md`: when an
opponent has a live passed pawn, review must continue through any relevant
counterpromotion or exchange. A proof that ends at the solver's promotion while
the opponent can still promote does not establish a durable material gain.

For repeatable expansion reviews, `build-promotion-a-expansion.py --analyse`
reuses all-root engine screens from `/tmp/promotion-engine-cache`, keyed by FEN,
Stockfish identity, 600,000-node limit, MultiPV count and engine options. Use
`--refresh-analysis` to bypass the cache intentionally. The builder checkpoints
each completed record atomically and skips a saved certificate only when its
exercise input signature still matches. The cache stays outside the repository;
review evidence and final certificates remain in the tracked fixture.


## Earlier Level B research checkpoint — 2026-11-02

At this earlier checkpoint, the material-promotion B set had **10 / 24**. I rechecked 153 balanced
TWIC 1661–1667 candidates whose intended first move was the top screened move
and tested an additional 126 quiet-preparation candidates. Thirteen of the
first group and one of the quiet group passed a bounded material certificate;
none survived editorial review. Fifty-nine intended lines ranked second or
third failed the same bounded certificate. All 14 capture-promotion leads in
the B scan remain unverified because none passed that payoff proof. Most certified lines won a loose Knight,
Bishop or Rook before promotion. The remaining leads either relied on a
sacrifice (C or later), were routine conversions, ended in a drawn game, or
need proof through an opponent’s live counterpromotion. Five promising positions
received a 600,000-node-per-legal-root screen.

No new B positions were published. The exact FENs, lines, source game IDs,
certificate outcomes, deeper root comparisons and durable rejection/withholding
reasons are in `levelBSearchReview` in
`scripts/fixtures/promotion-split/material-a-editorial-review.json`. The count
and gap stay visible; a promoted piece or passing a bounded certificate alone
does not establish a suitable B exercise.

## Promotion selection rule pilot — 2026-11-02

`AGENTS.md` now treats balanced material and a near-zero engine score as
preferences rather than eligibility gates. Promotion positions can start with a
material imbalance or a favorable evaluation when promotion is still the
essential decision and no simpler move achieves the same material payoff. The
level requirements, real-game provenance and all-reply proof standards remain
in force.

A pilot of the broader B lead filter used 197 TWIC 1661–1667 positions with
starting material within five pawns and a favorable engine evaluation between
3 and 5 pawns. Thirty-six passed a bounded material certificate; one exhausted
the search budget. Two were reviewed with 600,000 nodes per legal starting move.
One had a sound check followed by capture-promotion, but a separate loose-Bishop
capture already won material, so it was rejected. The other had a strong
capture-promotion, but a Queen move also preserved a large advantage; it remains
unpublished until the material payoff of that alternative is checked. The
pilot added no exercises, and the current counts remain unchanged. Exact pilot
positions and decisions are in `promotionFilterPilot` in
`material-a-editorial-review.json`.


## Broader-filter position added — 2026-11-02

The broader real-game pilot added one C position, raising material promotion to
**C 2 / 24** at that review stage. In Tasdogen–Li Shilong (TWIC 1661, 2026), White is materially
down but the promotion tactic is the only move that retains the advantage:
44.Rh8+ offers the Rook with check, and after 44...Kxh8 45.e8=Q+ Kh7 White has
won material. The actual game played 44...Kg6 45.e8=Q+ and Black resigned; the
Kxh8 line is a verified teaching variation, not an actual game continuation.
A 600,000-node screen of all 20 legal starting moves ranked Rh8+ first; direct
44.e8=Q loses immediately. The bounded all-reply certificate includes the
King’s capture of the Rook and all legal replies after promotion. This is graded
C because the Rook sacrifice is real and purposeful.

This is the sort of imbalanced start the revised rule permits: material balance
and engine evaluation do not determine eligibility by themselves. The promotion
decision must still be essential, the sacrifice must fit the level, and the
complete payoff must survive relevant defences. Current material counts are
Beginner 14, A 15, B 10, C 2, C* 0 and D 1 at that review stage; no quota was filled by padding.
The complete game, source checksum, proof and all-root review are in
`material-a-editorial-review.json`.

## PGN Mentor extended-window review — 2026-11-02

I re-replayed the same fourteen SHA-256-identified PGN Mentor player archives
and extended the start windows to 2, 4, 6, 8, 10 and 12 plies before each
played promotion. All **66,269** games replayed legally; **5,668** contained a
played promotion, correcting the earlier total of 5,640. Deduplication by
complete game ID and exact FEN produced **38,557** candidate starts. These are
leads, not exercises.

The 12,000-node top-three screens left 3,826 B leads, 1,585 C sacrifice leads,
3,647 C* leads and 1,329 D leads for deeper research. Four positions then
received 600,000 nodes per legal starting move and a bounded all-defence
material check. None was added: one C line passed its material certificate but
was already evaluated as clearly favorable and repeated the approved Rook
check-sacrifice that clears a promotion square; the B line had no verified
material payoff; the C* line's promoted Queen was captured by the King; and the
D proof exceeded its search budget. Failed or exhausted proofs remain
unverified, not refuted. Their FENs, full games, archive checksums, all-root
reviews, proof outcomes and decisions are in
`pgnmentorExtendedWindowScan` in `material-a-editorial-review.json`.

At that review stage, the material-promotion counts were Beginner 14, A 15,
B 10, C 2, C* 0 and D 1. The B, C, C* and D gaps remain 14, 22, 24 and 23 respectively;
the expanded scan did not justify padding any level.

A second bounded triage sampled 60 close-material leads each for B, C* and D.
Eighteen B and eleven C* lines passed the limited material certificate, but
that result is only a lead: it does not prove the tactic creates the advantage
or rule out a shorter alternative. The B proof-passing sample was mostly direct
King-and-pawn promotion races; its only minor-piece check repeats the existing
Knight-check deflection lesson. Full root screens of all eleven C* leads found
eight already-won positions, one existing exclusion, one lost race with a live
counterpromotion and one line that shortens to B. None was added. No D line in
the sample passed the bounded proof; 52 searches exhausted their budget and
eight found no certificate. The proof-passing B leads and complete C* reviews
are retained in `pgnmentorCertificateTriage` in
`material-a-editorial-review.json` for future comparison.


## Resignation-before-promotion review — 2026-11-02

A search of the same fourteen PGN Mentor player archives looked for decisive
games that ended immediately after a check while the winner had a pawn on the
seventh rank. The search kept the game exactly as played through resignation;
any later promotion is an analysis continuation. From 463 candidates screened,
a balanced top-ranked sample of 60 received bounded all-defence material
certificates. Eleven passed that certificate. Ten were excluded after reviewing
all legal starting moves and comparing their decisions with the published set;
one was accepted:

- `promotion-c-nepo-queen-offer-capture-promotion`: Nepomniachtchi–Ibrahimli,
  Titled Tuesday. White starts down only 80 centipawns by project piece values.
  34.Qe8+ offers the Queen with check beside the Black King and Rook. The two
  legal replies lead to distinct verified promotion payoffs: after 34...Rxe8,
  35.fxe8=Q+ captures the Rook while promoting; after 34...Kg7, 35.f8=Q+
  promotes while White keeps the Queen. A 600,000-node-per-root screen ranks
  Qe8+ first, with every other legal move substantially worse. A two-move
  all-defence certificate verifies both branches and the promoted Queen's
  safety. The actual game ended after 34.Qe8+; the continuations are analysis,
  not played moves. This is a distinct C-level Queen offer and capture-promotion.

The other ten proof-passing positions were rejected for a stronger move, an
already-winning conversion, a forced mate objective, or duplication of an
existing check-to-clear or Queen-exchange promotion decision. Their complete
games, exact positions, checksums, bounded certificates, all-root screens and
reasons are saved in `resignationBeforePromotionReview` in
`material-a-editorial-review.json`.

At the end of the resignation-before-promotion review, counts were Beginner
**14/24**, A **15/24**, B **10/24**, C **3/24**, C* **0/24**, and D **1/24**.
Gaps then stood at B 14, C 21, C* 24 and D 23; the later TWIC update below
The certificate sample is a targeted lead review, not evidence that the wider
master-game pool contains no more suitable examples.


## Level B research update — 2026-11-02

A wider TWIC scan of issues 1588–1599 replayed 94,854 legal games and found
10,744 games with an actual promotion. A broad window around those promotions
produced 23,949 deduplicated starts; these are leads, not verified exercises.
Two positions passed full review and were added, bringing Level B to **12 / 24**
with a gap of **12**.

In Boder–Kosakowski (Titled Tuesday, 8 April 2025), Black is down a Bishop but
can turn the a-pawn into a material advantage. The Bishop on c3 controls a1,
so `61...a1=Q?` allows `Bxa1`. `61...Kxc3` removes that defender; after the
played `62.g4 a1=Q`, the new Queen is safe. A 600,000-node Stockfish 17 screen
compared all nine legal starting moves: `Kxc3` ranked first, while immediate
promotion was clearly worse. A bounded all-reply material certificate covers
the legal replies and recaptures through the payoff. This is a King capture of
the promotion-square defender, distinct from the set's Knight exchange and
Rook-file clearance examples. The complete game, TWIC archive SHA-256, exact
source ply, preceding move, root screen and proof are consolidated in
`material-a-editorial-review.json`; the full game is in
`promotion-game-sources.json`.

In Jacobson–Ernst (grenke Chess Open, 19 April 2025), White is in check and the
position is materially balanced. `48.Nxe5` captures the Bishop on e5, which
controls b8; immediate promotion loses the new Queen to `...Bxb8`. After the
played `48...a2 49.b8=Q a1=Q+ 50.Kg2`, White keeps a Queen and a verified material
advantage over the start. A 600,000-node Stockfish 17 screen compared all 26 legal
starting moves: `Nxe5` was the only move with a clearly winning score. The
bounded all-reply certificate covers the opponent's legal defences through
promotion. This differs from the King capture in Boder–Kosakowski: a Knight
captures the bishop controlling a diagonal promotion square, and the solution
continues through the opponent's checking counterpromotion.

The Van Meegen–De Jong pawn-check lead was not added here: it wins a passed-pawn
ending, but the reviewed continuation does not establish a material gain. Keep it
for a position-winning or pawn-ending lesson only if that objective is explicitly
represented.

The scan still leaves these material-promotion counts: Beginner 14, A 15, B 12,
C 3, C* 0 and D 1. B has 12 positions to go. The expanded search increased
recall without lowering the real-game, tactical, all-reply or distinctness
requirements; no other lead from this batch was added to fill the count.
