# Removing the defender: research and coverage plan

Status: research in progress. Five Beginner compositions and forty-two reviewed
master-game positions are published, with at least one exercise per level.
A published page must use the protected shared trainer, original-game dialog and
worksheet source. Do not treat a legal replay or an engine score as a proof of
the material payoff or of the instructional value of the motif.

## Review storage

The fifty individual review files were consolidated into
`scripts/fixtures/removing-defender/reviews.json` on 2026-11-04, following the
promotion review and mate-certificate bundle patterns. Its `records` object
uses the original filename stems as stable keys, such as
`reviews.json#beginner-01-review`. It retains all forty-seven approved reviews
and the three unverified research batches (ten candidate records), including
complete games, provenance, engine settings, alternatives and defensive replies.
Every original review file was reconstructed byte for byte from its bundled
value before removal; all forty-seven approval checksums remain unchanged.

The shared `scripts/review_store.py` provides atomic updates and reference
resolution. All defender-removal review generators write to this bundle; run
one writer per topic at a time. Preserved `sourceReview` and `sourceBatch`
fields still use historical filenames, which `read_review_reference` resolves
without recreating individual files. Promotion reviewers also use this shared
store; their existing topic bundles are unchanged.

`approved.json` keeps explicit bundle references and a checksum of each review's
standalone JSON representation (UTF-8, two-space indentation, trailing newline).
Changing another entry or reformatting the bundle does not invalidate that
approval. Changing the referenced evidence still requires a fresh editorial
decision. Keep `approved.json`, `excluded.json`, and `corpus-manifest.json`
separate and versioned with the review bundle. This storage change preserves
the published exercises, source games, exclusions, levels and counts.

Validate with `python3 scripts/test-review-store.py`,
`python3 scripts/test-promotion-review-store.py`,
`python3 scripts/test-removing-defender-pipeline.py`,
`python3 scripts/test-removing-defender-research.py` and
`python3 scripts/build-removing-defender.py --check`, alongside the existing
practice and worksheet regression tests.

## Level targets and current evidence

| Level | Approved | Target | Gap |
| --- | ---: | ---: | ---: |
| Beginner | 5 | 24 | 19 |
| A | 10 | 24 | 14 |
| B | 18 | 24 | 6 |
| C | 7 | 24 | 17 |
| C* | 3 | 24 | 21 |
| D | 4 | 24 | 20 |

Beginner examples may be composed. Research complete master games for A–D,
including B; do not claim a puzzle snippet establishes provenance. Apply the
project's sacrifice and solver-move criteria separately to each level.

## Coverage checklist

Assess each item independently at every level; the Beginner example below
covers checking captures of bishop and rook defenders, with king and pawn
recaptures respectively, a quiet rook check diverting a king, and a rook
exchange that draws the king away, and a pawn capture of a knight defender
(`removing-defender-beginner-05`). Other aspects remain unverified. Map a
covered item to a stable exercise ID only after review. Select distinct learner
decisions rather than mirrored positions or a mechanical cross-product.

- Capture or exchange a defender of a piece, then show the gain after relevant
  recaptures; include defenders of different values and different target pieces.
- Remove a defender of a square, including a mating square where the complete
  mate is proven; distinguish this from a material objective.
- Compare a defender captured outright with one removed through an exchange,
  a forcing attack or deflection. Require the lost defensive duty to matter.
- Review pawns, knights, bishops, rooks, queens and kings as attackers,
  defenders or targets where legal and instructionally suitable; vary both
  sides to move, lines of attack, checking and quiet moves.
- Review multiple defenders, overloaded defenders, intermediate checks,
  counterattacks, exchanges and material recovery. Explain why the target
  cannot simply be saved or defended again.
- Assess promotion, en passant and castling as possible ways to remove or
  redirect a defender. Record an example, a level-specific reason for
  exclusion, or an unresolved gap; do not force an artificial example.
- At Beginner, prioritize few pieces and a direct material payoff without a
  sacrifice or lengthy calculation. At A use direct play; B may add short
  preparation. C requires a simple sacrifice, C* longer non-sacrificial
  calculation, and D complex sacrifices and more than three solver moves.

## Candidate review record

**C — Shih Gould–Fus** (`removing-defender-c-shih-gould-fus-2026`):
after the queen exchange, `...Rxe2` gives a rook for the bishop guarding f3.
`...Bxf3` captures the knight, which also guarded d4, and `...Nxd4` wins that
pawn. The played line continues through `Re8+ Kg7`; two move orders beginning
with `...Rxe2` are also saved. Evidence: `reviews.json#shih-gould-fus-review`.

**A — Muthaiah–Roudi** (`removing-defender-a-muthaiah-roudi-2026`):
`Bxe8` removes the knight guarding f6, then `Qxf6` wins the pawn after either
rook or queen recapture. The variations continue through queen exchanges; the
game ended after `Qxf6`. Evidence: `reviews.json#muthaiah-roudi-review`.

**B — Wilson–Sivanandan** (`removing-defender-b-wilson-sivanandan-2026`):
`Bxc3+` exchanges the knight defending e4. The game continuation shows the
e4 and g3 captures, the knight's escape and the rook's response to `Bb6`.
The direct `hxg3` reply opens the h-file for `...Rxh1+`. Evidence:
`reviews.json#wilson-sivanandan-review`.

**C* — Khan–Michaelides** (`removing-defender-cstar-khan-michaelides-2026`):
`Nxb3` exchanges the bishop guarding c2. After `Qxb3`, the intermediate
`Ne1+` places the second knight to capture on c2 after the queen exchange;
the published line resolves the `f4` pawn counterplay. The game ended after
`Nxb3`; the continuation is analysis. Evidence: `reviews.json#khan-michaelides-review`.

**D — Demchenko–Ynojosa Aponte** (`removing-defender-d-demchenko-ynojosa-2026`):
`Rh1+ Kxh1 Qxf1+ Kh2 Qf4+` sacrifices the rook, removes the knight defending
the rook on d2, and positions the queen to capture it. The game continuation
`Kg1 Qxd2 Qh3+ Kg6` shows the gain and the king's response to check; other
king replies to `Qf4+` are recorded. Evidence: `reviews.json#demchenko-ynojosa-review`.

**C* — Kandil–Muhammad Waqar** (`removing-defender-cstar-kandil-waqar-2026`):
the queen c3 and bishop d7 both protect c6. In the game,
`Qxc3 Bxc3 Ne4 Bg7 Nc5 Bf5 Na6 Rac8 Bxc6 Re2` exchanges the queen,
attacks the bishop and saves the knight from the d6 pawn before the capture.
Immediate `Bxc6` after `...Bf5` permits `...dxc5`; if Black captures the
knight earlier, the saved alternative shows `Rxd7` and `Rxc7`. Evidence:
`reviews.json#kandil-waqar-review`.

**B — Ramos Espinoza–Mureya** (`removing-defender-b-ramos-mureya-2026`):
`Nc3` attacks the bishop defending e4; `...Nf6 Nxd5 Nxd5 Bxe4` wins
the pawn. The saved alternatives include the bishop retreat with a rook check
and `...cxd4` with a rook exchange. Evidence: `reviews.json#ramos-mureya-review`.

**C — Cave–Roselli Mailhe** (`removing-defender-c-cave-roselli-2026`):
`Bxd4` removes a knight guarding the queen f3. After `Bxd4`, the checking
bishop sacrifice `Bxh3+` diverts the king, the queen's second defender;
`Qxf3` then wins the queen. The game and a `Kh2` defensive variation are
saved through material recovery. Evidence: `reviews.json#cave-roselli-review`.

**A — Imomkuzieva–Contreras** (`removing-defender-a-imomkuzieva-contreras-2026`):
`Rxe6` exchanges the bishop defending the knight c4. Both `...fxe6` and
`...Rxe6` allow `Bxc4`; the saved lines show the bishop escaping `...b5` or
responding to `...Re4`. Evidence: `reviews.json#imomkuzieva-contreras-review`.

**A — Boulrens–Nigmatov** (`removing-defender-a-boulrens-nigmatov-2026`):
`Rxf2 Kxf2 Bxf4` exchanges the rook guarding f4, wins the pawn and attacks
the other rook. The game continued `Re2`; `Re1` also saves the rook. Evidence:
`reviews.json#boulrens-nigmatov-review`.

**B — Boulrens–Amdouni** (`removing-defender-b-boulrens-amdouni-2026`):
`fxg5 hxg5 Rf1` attacks the queen protecting e7. The played continuation
`Qxc3 Rxe7 f5 Bxg5 Rg8 Bf4+ Ka8 Be5` shows the bishop's escape and material
recovery. The sample and alternatives include both queen and pawn recaptures;
the latter reaches the main gain in three solver moves. All legal roots and
immediate replies were screened, including the actual game branch, but engine
screens are not exhaustive proofs. Evidence: `reviews.json#boulrens-amdouni-review`.

For each candidate retain its stable ID, exact FEN, starting material, side to
move and explicit objective; full original game, source URL and archive hash,
headers, ply and preceding move when applicable; actual continuation distinct
from the teaching line; each relevant defence and recapture; material payoff;
all legal initial moves including immediate mates, forcing and quiet
alternatives; level rationale; motif and duplication review; and a publish or
exclude decision with reason. Record incomplete analyses as unverified.
The stored solution is an example, not a uniqueness claim. Objective-specific
alternative verification and its bounded-search feedback must be integrated
before presenting alternatives as correct or incorrect.

## Leads, not approved positions

- [Chess.com: Removing the Defender](https://www.chess.com/terms/removing-the-defender-chess)
  mentions Alekhine–Evenson as an example. Locate and legally replay the full
  game from a documented primary game archive before assessing it.
- [Patterns for the Game of Chess](https://hillside.net/sugarloafplop/2016/wp-content/uploads/2016/11/6-Patterns-Game-of-Chess.pdf)
  describes Lukin–Timoshenko, Spartakiad 1979. Locate a complete source game
  and independently review the position, continuation and level. The quoted
  line is a lead, not proof or a substitute for provenance.

Search the existing validated local game collections first, then documented
PGN Mentor archives and dated TWIC batches. Preserve source manifests and
checksums and keep raw bulk archives outside the repository.

### Local preliminary scan

On 2026-11-03, a legal replay of the saved complete games in
`scripts/fixtures/pin/researched.json` found 116 **unreviewed leads** using a
narrow geometric screen: a played capture removes the sole defender of an
attacked enemy piece, and after at least one legal recapture the target can be
captured. This is a lead count, not a count of distinct games, sound tactics,
or eligible exercises. The screen did not assess material recovery, other
replies, simpler moves, level or whether removing the defender is essential;
it also misses unplayed tactics and non-capture removals.

Examples for subsequent review (FEN immediately before the played move):

- Firouzja–Carlsen, ply 46:
  `r4n2/pp1b2k1/3p1qp1/2pPp3/2P1Pr2/2N2n2/PP1QB1N1/2K3RR w - - 0 24`;
  screen line `Nxf4 Qxf4 Bxf3`.
- Howell–Gashimov, ply 16:
  `r1bqk2r/ppp1bppp/8/3p4/1nPPn3/3B1N2/PP3PPP/RNBQ1RK1 w kq - 1 9`;
  screen line `cxd5 Qxd5 Bxe4`.
- Caruana–Akobian, ply 68:
  `3r1q2/kbR5/1p1ppr2/p7/2B4P/1P6/P1PPQ3/1K3R2 w - - 0 35`;
  screen line `Rxf6 Qxf6 Bxe6`.

The displayed recapture and continuation are hypothetical legal lines from the
screen, not claims about the moves actually played. Full game records and
source links are in the named fixture; verify archive hashes and actual game
continuations independently before using any candidate.

## Page integration in progress

`/removing-defender` now uses the shared practice interface and protected
exercise and game-source endpoints. The protected worksheet catalog registers
the same exercise endpoint. The six levels remain visible with their actual counts. There are four printable
Beginner exercises and thirty-one printable original-game exercises. Game replay and
worksheet generation with actual examples, and a broader verifier for unsaved material-winning alternatives remain to be
completed before publishing exercises outside the narrow case described below. The empty page is an incomplete implementation,
not a completed collection.

## Local master-game pilot — 2026-11-03

Completed one-off player and Beginner review scripts have been retired. Their
full evidence remains in `scripts/fixtures/removing-defender/reviews.json`;
`test-removing-defender-research.py` replays the saved roots, replies, material
accounting and motif checks. This replay does not rerun the historical engine
search or replace independent editorial review. For new candidate batches, use
the reusable reviewer, which compares every legal root, checks short mates,
and probes every immediate defence along the candidate line:

```sh
python3 scripts/validate-removing-defender-batch.py /tmp/defender-candidates.json \
  --output /tmp/defender-reviewed.json --root-nodes 200000 --reply-nodes 120000
```

The input is the collector's `records` payload, including the complete game,
game key, source position and proposed moves. The output remains pending
editorial review. Use the required budgets and additional motif/payoff checks
for the candidate; these example budgets do not authorize publication.

`scripts/screen-removing-defender.py` reproduces the narrow geometric screen
against the complete games in the saved pin research corpus. The deduplicated
screen produced 115 position/move/target leads (the earlier exploratory count
of 116 counted one repeated lead). The disposable screen output is stored
outside the repository. Its scores are shallow ranking data, not evidence of a
verified exercise; the search also misses many legitimate defender removals.
The corpus is limited to previously selected games, not the full source archives.

Two candidates received a deeper preliminary review, recorded with stable game
IDs, complete games, archive hashes, exact starting FENs, preceding moves,
all legal root moves and all 35 legal replies to each proposed move in
`scripts/fixtures/removing-defender/reviews.json#pilot-engine-review`. Each all-root
MultiPV search used 1,000,000 nodes; each reply was probed at 150,000 nodes.
The recorded engine identity and settings are part of that evidence. A legal
move search also found no immediate mate or forced mate in two solver moves
from either starting position. Longer mates are not excluded. The original
game continuation is saved separately from each engine variation.

- `Morozevich,A–Sasikiran,K`, 2001, game ID `bb42ce6146dfe4ec`,
  FEN `7r/4qk2/1pp1r1p1/p2pPpR1/3P1P2/6RP/PPQ4K/8 w - - 1 35`:
  the played `Rxg6` removes the g6 pawn defending f5; after `...Rxg6`,
  `Qxf5+` begins the attack on the rook and king. The game continued
  `...Rf6 exf6 Qxf6`. The initial material balance is equal. The exact durable
  material payoff, all defensive continuations, competing moves and appropriate
  level remain unresolved, so this is not published.
- Geller–Szmetan, 1978, game ID `377ea0a28e2963ce`, FEN
  `1r1q1r1k/2pnp2p/6p1/1n2b1B1/8/6PP/1P2QPB1/R2R2K1 w - - 0 21`:
  `Rxd7` removes the knight defending e5, followed in the game by
  `...Qxd7 Qxe5+`. White begins three pawns of material down by conventional
  piece values; the resulting tactical sequence involves further exchanges.
  A complete objective proof, competing-move review and level decision remain
  open, so this is not published.

The checked game IDs are the `gameId` values in the evidence bundle. Verify
legal game, root and defence replay with
`python3 scripts/test-removing-defender-research.py`.
Neither engine variations nor the replay test prove a forced material gain.
These two games remain unpublished. The current published counts and coverage
gaps are recorded above and below.


## First reviewed Beginner composition

`removing-defender-beginner-01` is an original six-piece composition, FEN
`8/K7/8/8/4k3/3b4/1R2B3/1r6 w - - 0 1`. Material starts equal. The
black bishop on d3 is the sole defender of the rook on b1. The direct
`Rxb1 Bxb1` exchanges rooks and leaves White with no material gain.
`Bxd3+` removes the bishop with check: after `...Kxd3`, `Rxb1` wins the rook;
after any other legal king move, `Bxb1` does so. The seven legal replies and
all subsequent legal replies after the capture are recorded and replayed in
`reviews.json#beginner-01-review`. At each endpoint Black has only a king, and White's
material balance has improved by at least a rook. The seven branches are in
the interactive solution data, and the primary line and explanation are
available to the worksheet generator.

The review tests every legal first move for immediate mate and forced mate on
the second solver move. It probes all 20 legal first moves independently at
200,000 Stockfish nodes each; these bounded searches support the comparison
but do not constitute exhaustive proof of all longer alternatives. The
position is a direct exchange, with no sacrifice, and its check and short
material payoff fit Beginner. It contributes one checking bishop capture and
one white-to-move example; no broader level coverage is claimed. Validate the
retained review branches with
`python3 scripts/test-removing-defender-research.py`.

For unsaved root moves, the shared trainer now includes a deliberately
narrow, bounded objective-specific proof: it verifies a legal capture of a
real defender, every reply, capture of the specified target, and a material
gain after every immediate response, provided that the opponent is left with
only a king. The proof accepts either side; a timeout, other motif or more
complex ending remains unverified. It does not assert that an unverified move
is wrong. Run `node --test scripts/test-removing-defender-alternatives.cjs`
and `node --test scripts/test-mate-alternatives.cjs`.


## Faster archive screening and second Beginner composition

Two complete [TWIC](https://theweekinchess.com/) issue archives were scanned:
issue 1666 contained 9,211 legally parsed games and issue 1667 contained 8,561;
2,252 distinct games in the individual archive scans had both published ratings
at least 2400. The exact URLs, archive SHA-256 values, retrieval date, per-batch
parsing results and counts are in `corpus-manifest.json`. A rating is only a
lead filter; a player's title must be verified separately. Bulk archives and
checkpointed engine screens remain outside the repository.

The scanner `scan-removing-defender-archive.py` finds positions in played
games where a defended piece is captured and a target it alone guarded can be
captured after a legal recapture. It checks a material window first and keeps
full original games, exact source positions and moves for candidate review.
The scanner currently covers captures and one recapture pattern, not every way
to remove a defender. `screen-removing-defender-engines.py` deduplicates 757
position/move/target leads to 740 starting FENs and searches every legal root
at 50,000 nodes per position. That low-budget rank found 52 position/target
leads whose sampled engine line captured the target and showed a material
gain. They are not 52 approved exercises, unique games, or verified payoffs.
Checkpoint data records the engine identity and exact settings; it cannot be
reused as a deeper proof.

`reviews.json#twic-pilot-review` retains two selected complete games and stronger
evidence: all legal root moves at 1,500,000 nodes and each legal reply at
150,000 nodes. The test suite replays each complete game, the preceding move,
the starting position, all root variations and all replies. Neither position
has an immediate mate or a forced mate in two solver moves; this does not rule
out longer mates. At the time of that pilot both were unverified; the later Chaudhary review
below supersedes that status:

- Chaudhary–Kamble, First Saturday Budapest 2026, source game ended after
  `Qxd6+`; any payoff after that is analysis, not a played continuation.
  [FIDE records](https://ratings.fide.com/profile/25683012) identify Kamble as
  an international master; [Chaudhary's FIDE profile](https://ratings.fide.com/profile/88123570)
  lists no title. The line `...Kxd6 Rxf8` removes the queen defending the
  rook, but the d2 pawn and Black's rook require further calculation. Other
  legal checks including `b4+` and `Qa3+` also require objective and motif
  review before assigning a level. The subsequent C* review below records that work.
- Predke–Berkes, Serbian team championship 2026, `Bxf6` captures the knight
  defending g4. The actual game continued `...Qxf6 Qh7+ Kf7 Rh5`; a
  sample analysis with `Rxg4` is separate. `Qxg4 Nxg4 Bxd8 Rxd8 Rxg4`
  is a competing legal line with a pawn gain at its endpoint. Its other
  defences and possible material recovery must be examined before determining
  whether it bypasses the motif or whether either line is suitable.

The second published composition, `removing-defender-beginner-02`, uses FEN
`8/3k4/4p3/3r3R/3b4/5N2/P7/7K w - - 0 1`. The starting material is equal;
the rook on d5 is the sole defender of the bishop on d4. After `Rxd5+ exd5
Nxd4`, White has gained a bishop, and Black retains a blocked passed pawn. If
the king moves instead, `Rxd4` wins the bishop as well. All six replies to
`Rxd5+`, every legal reply after the target capture, and a further safe
continuation against every immediate defence are recorded and replayed in
`reviews.json#beginner-02-review`. Each final reply also has an 80,000-node engine
probe; every legal starting move received 200,000 nodes, and immediate and
two-move mates were checked. Finite engine probes are not proof of all later
play. `Nxd4` immediately fails to the rook on d5, and `Rxd5+` is an equal
exchange rather than a sacrifice. This decision differs from the first
composition: the defender is recaptured by a pawn rather than the king,
the target is taken by a knight, and the remaining pawn creates a distinct
blocked-pawn resource. The remaining Beginner coverage gaps are not filled
by changing piece types or mirroring either example.

Validate the retained detailed review with
`python3 scripts/test-removing-defender-research.py`.

## Beginner king deflection

`removing-defender-beginner-03` is an original seven-piece composition, with
Black to move in `4b3/4r3/4k3/K7/B1p5/8/5R2/8 b - - 0 1`. White's king a5
guards the bishop a4. `...Ra7+` checks and diverts the king: both legal
responses, `Kb6` and `Kb4`, allow `...Rxa4`. In the latter case the black
bishop e8 protects the rook on a4. Direct `...Bxa4 Kxa4` exchanges bishops
without a gain. The checking rook also escapes attack after `Kb6`, which
makes the decision distinct from the two capture-and-recapture compositions.

The review records all 18 legal starting moves at 200,000 nodes each, both
legal defenses to the check, all 19 immediate replies after the capture at
80,000 nodes each, and legal material accounting. It checks immediate mate and
mate in two solver moves; bounded engine analysis is not a full game-tree proof.
Replay the retained evidence with `python3 scripts/test-removing-defender-research.py`.

`removing-defender-beginner-04` is an original seven-piece composition in
`4K3/7R/4B2r/7k/5Pb1/8/8/8 w - - 0 1`. The black king h5 guards the bishop
g4 and rook h6. `Rxh6+ Kxh6` exchanges rooks and draws the king away; `Bxg4`
then wins the bishop. `Bxg4+` and `Bf7+` also use king deflection and are
retained as reviewed alternatives. The evidence records all 25 legal starting
moves at 200,000 nodes, the only legal reply to `Rxh6+`, the three replies
after `Bxg4`, and seven alternative branches. The position also checks for
immediate mate and mate in two; searches remain bounded. Replay the retained
evidence with `python3 scripts/test-removing-defender-research.py`.


## Reviewed master-game batch

The clarified project review standard permits bounded engine analysis and
documented tactical review for material objectives; it does not treat an engine
score as proof. Each published record below retains the complete game, source
URL, archive checksum, headers, source ply, preceding move, objective and
solution. All legal starting moves and relevant replies were examined; the
exact engine budgets and variations are in the linked JSON evidence. Initial
positions were checked for immediate mate and forced mate in two solver moves;
longer mates are not claimed to be exhaustively excluded. None of these
positions is claimed unique.

- **A — Vernay–Mosesov** (`removing-defender-a-vernay-mosesov-2026`): equal
  material. `Rxd7 Nxd7 Bxb7` exchanges the rook that defends b7 and wins a
  pawn. `Bxb7 Rxb7` loses a bishop for that pawn. In the sample analysis,
  `...Nc5 Bd5+` moves the bishop to safety; the game instead continued
  `...Kf7`. Every starting move was independently probed at 250,000 nodes,
  every reply to `Rxd7` at 120,000 nodes, and every reply after `Bxb7` at
  150,000 nodes. The captured pawn is the stated payoff, not a claim of a won
  game. This is a direct equal exchange with no sacrifice. Evidence:
  `reviews.json#vernay-mosesov-review` and `reviews.json#twic-batch-review`.
- **B — Klimkowski–Vakhidov** (`removing-defender-b-klimkowski-vakhidov-2026`):
  Black begins two pawns down by the recorded piece values. The white queen
  on d2 is the only defender of the attacked bishop d4. `...Qxd2 Nxd2 Bxd4`
  coordinates a queen exchange with the bishop capture; in the game
  `Nf3 Bf6` then moves the bishop away from attack. Direct `...Bxd4 Qxa5`
  loses the black queen. All 48 roots were probed at 200,000 nodes, all 41
  replies to the first move and all 25 immediate replies after the bishop
  capture at 120,000 nodes. The result is a three-pawn material gain from the
  starting position, not a claim that the game was won; the game was drawn.
  Evidence: `reviews.json#klimkowski-vakhidov-review`.
- **C — Cardoso Cardoso–Bilych** (`removing-defender-c-cardoso-bilych-2026`):
  equal material. `Rxd7 Qxd7 Qxe5+` offers a rook for a knight to remove the
  defender of e5; the bishop capture gives check. Against `...f6`, the sample
  analysis `Qe3` retains a net pawn, while the game continued `Rxf6`.
  Against `...Kg8`, the gain is already on the board. Direct `Qxe5+ Nxe5`
  loses the queen for the bishop. All 47 roots, 41 first replies, both replies
  to the check and 37 replies after `Qe3` were probed. The temporary exchange
  sacrifice and short payoff place the position in C. Evidence:
  `reviews.json#cardoso-bilych-review`.
- **C* — Chaudhary–Kamble** (`removing-defender-cstar-chaudhary-kamble-2026`):
  equal material. After `Qxd6+ Kxd6 Rxf8`, the pawn on d2 remains a real
  promotion threat. The illustrative `...Rxb2 Rd8+ Ke5 R8xd2 Rxd2 Rxd2`
  removes it and wins material; the game itself ended after `Qxd6+`.
  `Rxf8 Qxa6` fails because it leaves the queen en prise. This line uses
  five solver moves and an equal rook exchange rather than a sacrifice.
  All 34 roots and the 3, 19, 6 and 17 legal replies at the recorded key
  positions were independently probed; other moves remain possible and the
  line is analysis, not a claim that those replies are forced. Evidence:
  `reviews.json#chaudhary-kamble-review` and `reviews.json#twic-pilot-review`.
- **D — Kvaløy–Campos Gómez** (`removing-defender-d-kvaloy-campos-2026`):
  equal material. `Rxf6` offers a rook for the knight that protects e4. The
  played line `...Rb1+ Kd2 Rd8+ Ke2 Rbxd1 Nxd1 gxf6 Bxe4` resolves two
  checks and a rook exchange before the bishop is captured. Another important
  reply is `...Bf3+ Kxf3 gxf6`. The direct `Bxe4 Nxe4` exchanges bishops
  rather than gaining material. This is an exchange sacrifice with complex
  defensive checks and five solver moves. All 43 roots and the 28, 31, 38,
  29 and 20 legal replies at the reviewed key positions were probed.
  Evidence: `reviews.json#kvaloy-campos-review`.

FIDE player-profile links are saved in the individual evidence files.
Chaudhary's profile records no title; Kamble is an international master, so
the source is a game involving a titled master, not a claim that both players
held titles. In the Samunenkov–Caruana lead, the direct `Bxc6 Bxc6 Rxc6`
merits alternative-payoff review; that candidate remains unpublished.

Seven complete dated TWIC issue archives (1661–1667) have now been scanned:
57,023 legally parsed games and 6,465 per-archive eligible games at the rating
filter. The eligible count is not cross-archive deduplicated. Source URLs,
checksums, parsing results and retrieval dates are in `corpus-manifest.json`.
These games remain a search pool, not approved exercises; the level counts
and outstanding coverage gaps above remain in force.


## Skewer-style batch pipeline

`collect-removing-defender.py` follows the staged skewer collector pattern:
it replays complete source games, searches the capture seed and up to six
preceding plies, deduplicates positions, uses a shallow engine screen followed
by deeper candidate lines, and checkpoints disposable output outside the
repository. Its detection currently focuses on capture-based removal and does
not cover every defender-removal mechanism. Variant games such as Chess960 are
excluded because the shared practice viewer uses standard chess.

`validate-removing-defender-batch.py` independently replays each original game
and preceding move, compares every legal starting move, screens for immediate
and two-solver-move mates, and probes every legal reply after each sample
solver move. The output remains `needs-editorial-review`: engine scores and
one sample variation do not prove the objective or motif. Review the relevant
defences, simpler alternatives, difficulty and distinctness before marking an
exercise approved. Incomplete runs and budget-limited results are not proofs.

`approved.json` stores each approved exercise, local game data and its review
evidence hash. `build-removing-defender.py` validates and publishes those
records to the protected exercise and game-source files; `excluded.json`
prevents excluded IDs, FENs and games from returning. The builder refuses
unapproved or changed evidence, invalid moves, incorrect payoff thresholds,
duplicate games and positions, and invalid basic level metadata. These guards
supplement rather than replace editorial review. `--check` compares generated
outputs without writing.

Example using a completed archive scan outside the repository:

```sh
python3 scripts/collect-removing-defender.py /private/tmp/defender-twic1662.json --output /private/tmp/removing-defender-collector.json
python3 scripts/validate-removing-defender-batch.py /private/tmp/removing-defender-collector.json --output /private/tmp/removing-defender-batch.json --limit 8
python3 scripts/build-removing-defender.py --check
python3 scripts/test-removing-defender-pipeline.py
```

The first batch added two independently reviewed games:

- **A — Firouzja–Vachier-Lagrave**,
  `removing-defender-a-firouzja-vachier-2026`: `...Nxc1 Rxc1 Bxb2` removes
  the bishop guarding b2. Direct `...Bxb2 Bxb2` loses a bishop for the pawn.
  Black begins a pawn ahead; the solution gains another pawn. The source game
  continued `Re1`. All initial moves and all 36 and 30 replies after the two
  solver moves were searched at the recorded budgets. Evidence:
  `reviews.json#firouzja-vachier-review`.
- **B — Gharibyan–Deac**,
  `removing-defender-b-gharibyan-deac-2026`: `...Nxc3+` removes the bishop
  that protects the rook on e1; after `Kc2 Rxe1 Kxc3`, Black has gained a
  rook relative to the starting balance. `...Rxe1+ Bxe1` is an equal exchange.
  The stored continuation is analysis; the game used `Nd6+` before `Kxc3`.
  All 33 starting moves, five check replies and 30 replies after `...Rxe1`
  were probed; details are in `reviews.json#gharibyan-deac-review`.

The first 1662 collection batch screened 1,061 distinct starting positions
and produced 24 unapproved candidate lines from 20 games. Those leads are
not accepted exercises; duplicated starts from the same game are reviewed
together and no more than one game position is published without an explicit
editorial exception.

- **B — Macías Pino–Almagro Llamas**,
  `removing-defender-b-macias-almagro-2026`: `Nxf8` exchanges the bishop
  defending g7, after which the other knight captures the pawn. Direct
  `Nxg7 Bxg7` loses the knight for the pawn. In the sample analysis
  `...Nxf8 Nxg7 Nb4 a3`, White answers the knight's attack on a2; the
  actual game continued `...Rxf8 Nxg7 f4 Nxe6 Qxe6 Bxf4 Nxd4`. The review
  probes all initial moves and all immediate replies to both solver moves;
  an additional 21 black replies after `a3` received 120,000-node probes.
  Evidence: `reviews.json#macias-almagro-review`.


## Shared-index review — longer controls

The shared map and local index are described in `docs/tactics-index.md`.
Automatic detections, including any Lichess puzzle tags, remain leads until
full provenance and tactical review. Twenty-one of the twenty-two new games below are from
the 2026 Olympiad and report `40/5400:1800+30`; the Zhigalko–Lazavik game
is a three-minute game and was reviewed as a lower-priority exception. Player
titles were checked against FIDE profiles linked in the review records.

- **B — Sharifov–Sebenik** (`removing-defender-b-sharifov-sebenik-2026`):
  material starts equal. The knight e5 is the sole defender of c6.
  `Bxe5 Rxe5 Rxc6` removes that defender and wins a pawn; the direct
  `Rxc6 Nxc6` loses the rook for a pawn. The game continued `...b5 Ra6 b4`;
  `...b5 Ra6 bxa4 bxa4` is another relevant branch. The batch review probed
  all 28 legal starting moves and the 19 and 18 immediate replies after the
  two solver moves. Another 18 replies after `Ra6` were probed at 120,000
  nodes, including the countercapture. `reviews.json#sharifov-sebenik-review` records
  the complete game, exact settings, replies and evidence.
- **A — Petrov–Gürel** (`removing-defender-a-petrov-gurel-2026`): material
  starts equal. `...Rxc4` exchanges the sole rook defender of c5, after
  which `...Qxc5` wins a pawn. White can capture on c4 with the queen, knight
  or pawn. After `Qxc4 Qxc5 Qxc5 Rxc5`, the black rook recaptures the queen.
  Direct `...Rxc5 Rxc5 Qxc5 Qxc5` loses the black queen; the rook on c4
  must be addressed. All 44 legal initial moves and the 36 and 39 replies
  at the reviewed points were probed. The line `...Rxc4 Qxc4 Qxc5 Rd1`
  occurred in the original game; the queen exchange is a legal analysis
  alternative. `reviews.json#petrov-gurel-review` retains the evidence. The possible
  three recaptures and queen exchange distinguish this decision from the
  earlier Vernay exercise.
- **D — Martinović–Sipilä** (`removing-defender-d-martinovic-sipila-2026`):
  equal material initially. `Rxb6 axb6 Rxb6` clears the b-file at the cost
  of a rook. After `...Rh7 Rxb7+ Rxb7 Qxa6`, the queen guarding the knight
  has been exchanged, so the knight falls. `...f5 Nc5` saves the attacked
  white knight; `...Rb2+ Kh3 f4` occurred in the game, while the final
  `exf4` is an illustrative analysis continuation. The alternative `...Qxb6` also permits a queen
  exchange followed by `Qxa6`. `Qxb7+ Kxb7 Nxf6 Rxd6` wins no material.
  All initial moves and the immediate replies along the screened sample were
  searched at the recorded bounded budgets; this is engine-assisted review,
  not an exhaustive game-tree proof. Evidence: `reviews.json#martinovic-sipila-review`.
- **B — Petkov–Wei Yi** (`removing-defender-b-petkov-wei-2026`): Black
  begins a pawn ahead. The pawn on e4 and knight on c3 both guard d5.
  `...fxe4+ Nxe4` removes the pawn and diverts the knight, so `...Rxd5+`
  wins the d5 pawn. `...Kf7` then protects g7 against the white rook.
  Direct `...Rxd5+ Nxd5` loses the rook. Alternative king captures and
  the original complete game are retained in `reviews.json#petkov-wei-review`.
- **B — Gukesh–Nigmatov** (`removing-defender-b-gukesh-nigmatov-2026`):
  White starts a pawn behind. `Rxf8 Kxf8 Nxc8` exchanges the rook defending
  c8 and wins the bishop. After `...Nxe3 cxd5 cxd5 Kf2`, the king protects
  g2 and attacks the knight; this continuation is analysis, distinct from
  the game. Direct `Nxc8 Nxf2` permits a counterattack on the rook. Evidence:
  `reviews.json#gukesh-nigmatov-review`.
- **A — Zhigalko–Lazavik** (`removing-defender-a-zhigalko-lazavik-2026`):
  the game reports `180` seconds and is not in the preferred time-control
  group. Equal material initially. `Bxe7 Qxe7 Qxd6` removes the bishop defending
  d6 and wins the pawn. After the played `...Qxd6 Rxd6` White recaptures
  the queen; `...Qf6 Qg3` is a reviewed alternative. Direct
  `Qxd6 Bxd6 Rxd6` loses the queen for a bishop and pawn. Evidence:
  `reviews.json#zhigalko-lazavik-review`, including all 27 replies after the final
  recapture at 100,000 nodes each.
- **B — Can–Miezis** (`removing-defender-b-can-miezis-2026`): `Nxf5`
  removes the bishop guarding h3, allowing the king to capture the knight.
  The queen and rook recaptures require different continuations. In the
  played line the first moves through `...Qf6` occurred in the game; the
  subsequent queen maneuver and the `...Qxf5` branch are analysis.
  Evidence: `reviews.json#can-miezis-review`.
- **C — Georgiev–Hommadov** (`removing-defender-c-georgiev-hommadov-2026`):
  `Bxf7+ Qxf7 Qxf7+ Kxf7 Rxc7+` sacrifices a bishop for a pawn to exchange
  the queen defending the c7 knight. The two king moves declining the
  sacrifice are recorded as analysis. Evidence: `reviews.json#georgiev-hommadov-review`.
- **C — Abdusattorov–Caruana** (`removing-defender-c-abdusattorov-caruana-2026`):
  `Rxg7+` removes the pawn defending the f6 rook. After `...Kxg7 Re7+ Kf8
  Kxf6 Rd6+ Re6`, the white king takes the rook and protects the interposing
  rook. The actual game used `...Kg8` rather than `...Kf8`; both lines and
  king moves declining the sacrifice are saved. Evidence:
  `reviews.json#abdusattorov-caruana-review`.
- **A — Yip–Bulmaga** (`removing-defender-a-yip-bulmaga-2026`): the queen
  on g5 guards e5. After `Qxg5 hxg5 Nxe5`, `...f6 Ng4` saves the knight.
  The direct `Nxe5 Qxe5` loses it. The principal line was played in the
  game; the `...Rh6` response is analysis. Evidence: `reviews.json#yip-bulmaga-review`.
- **B — Lizano–Bullen** (`removing-defender-b-lizano-bullen-2026`):
  `Nxf5 Rxf5 Nxg7` exchanges the knight guarding g7. After `...Re5`, the
  white queen moves out of attack with `Qd2`. Evidence: `reviews.json#lizano-bullen-review`.
- **B — O’Gorman–Ezra** (`removing-defender-b-ogorman-ezra-2026`):
  `...Rxf3 Rxf3 Bxe4` removes the bishop defending e4. After `Kg2 Bxf3+
  Kxf3`, Black has exchanged a rook and bishop for two minor pieces. The
  moves through `Kg2` were played; the remaining line is analysis. Evidence:
  `reviews.json#ogorman-ezra-review`.
- **B — Amartuvshin–Garzón** (`removing-defender-b-amartuvshin-garzon-2026`):
  `Nxd5 Rxd5 Rxf7+` exchanges the bishop guarding f7. `...Kg8` attacks the
  rook, which withdraws with `Rf6`; after `...Rxa5`, the played `Rxg6+`
  recovers material with check. All 23 replies after `Rf6` received bounded
  engine review. The `...g5` and `...Kh8` lines are analysis. Evidence:
  `reviews.json#amartuvshin-garzon-review`.
- **A — Krasteva–Silva** (`removing-defender-a-krasteva-silva-2026`):
  `Nxf6+` exchanges the knight guarding d5; after `...Rxf6 Bxd5`, White wins
  a pawn. Direct `Bxd5 Nxd5` loses the bishop. The main line through
  `...Rc8` occurred in the game; subsequent moves and the alternatives are
  analysis. Evidence: `reviews.json#krasteva-silva-review`.
- **B — Terao–Clarke** (`removing-defender-b-terao-clarke-2026`):
  `Rxe7 Rxe7 Rxe7 Kxe7 Nxh7` exchanges the rook guarding h7 along with the
  other pair of rooks. The principal line was played; `Kc3 Rxe5 fxe5+ Ke7
  Nxh7` is an alternative analysis line with the same idea. Evidence:
  `reviews.json#terao-clarke-review`.
- **B — Barbot–Liu** (`removing-defender-b-barbot-liu-2026`):
  `hxg6 Kxg6 Rxf5` exchanges the pawn guarding f5. White must also account
  for the rook attack on a3; the played continuation is shown through
  `...Kf7`, followed by `Rxa4` in analysis. Evidence: `reviews.json#barbot-liu-review`.
- **C — Kourkoulos-Arditis–Chipanga** (`removing-defender-c-kourkoulos-chipanga-2026`):
  `Rxe6 Rxe6 Bxd5` sacrifices a rook for the bishop guarding d5 and then wins
  the knight. White began two pawns behind by material value and gains one
  point in the displayed continuation. The principal line was played;
  `...Bh2+` is analysis. Evidence: `reviews.json#kourkoulos-chipanga-review`.
- **B — Dahl–Berend** (`removing-defender-b-dahl-berend-2026`):
  `...Bxd2 Qxd2` removes the knight and moves the queen away from b3.
  `...Nxb3` then attacks both queen and rook; `...Nxa1 Rxa1` completes
  the gain. The principal line was played; `Qh6` is an analysis alternative.
  Evidence: `reviews.json#dahl-berend-review`.
- **B — Ortega–Parsa** (`removing-defender-b-ortega-parsa-2026`):
  `Nxf6 Rxf6 Qxe5` removes the bishop guarding e5. Against `...Rxd6`,
  `Qxd6` recaptures the rook. The original game used a longer checking
  sequence; the shorter teaching line is analysis and does not meet the
  C* definition. All 29 replies after `Qxe5` were searched at 150,000 nodes
  each. Evidence: `reviews.json#ortega-parsa-review`.
- **B — Amnol–Harper** (`removing-defender-b-amnol-harper-2026`):
  `...Nxe3 Qxe3 Bxf4` exchanges the bishop guarding f4 and wins a pawn
  with an attack on the queen. After `Qf2`, `...Qh6` saves Black's queen.
  The principal line was played; `Qf2` is analysis. Evidence:
  `reviews.json#amnol-harper-review`.
- **C — Iclicki–Singh** (`removing-defender-c-iclicki-singh-2026`):
  in the reviewed analysis `...Qd8 c5 Rxf3 Qxf3 Qxd2`, Black prepares to
  sacrifice a rook for the knight guarding d2, then captures the bishop.
  The game used `...Rfd8` as its preparation. Evidence: `reviews.json#iclicki-singh-review`.
- **D — Vázquez–Kawuma** (`removing-defender-d-vazquez-kawuma-2026`):
  the analysis line `Ncxe5 Rxe5 Nxe5 Qxe5 exf5` removes the rook guarding
  f5 and opens the e-file against the replacement queen. After `...Qf4`,
  a queen exchange preserves the gain. If `...Qxf5`, `g4` attacks the queen
  and knight, with the `...gxh5` recapture included in the published line.
  All 40 replies after `g4` received bounded review. The game used `Na5`;
  the teaching lines are analysis. Evidence: `reviews.json#vazquez-kawuma-review`.
- **A — Piorun–Niemann** (`removing-defender-a-piorun-niemann-2026`):
  `...Rxf2+` exchanges the rook defending f6, then the queen captures the
  pawn. Both `Qxf2 Qxf6` and `Kxf2 Qxf6+` are saved. The game used the
  former. Direct `...gxf6` allows `Qa7+` and counterplay; bounded root and
  defensive analysis did not establish a comparable simpler gain. Evidence:
  `reviews.json#piorun-niemann-review`. The source time control is not recorded in
  its headers, so it is not counted as a preferred 10-minute-plus game.

The Van Foreest–Zlatkov and Kuybokarov–Van Foreest leads from the shared index
were excluded: one wins a queen before the alleged payoff, one has a simpler
safe `Rxh5`, and one wins a bishop before the alleged defender-removal payoff.
Exact FENs, source hashes and reasons are retained in `excluded.json` and
synchronized to the local index.
