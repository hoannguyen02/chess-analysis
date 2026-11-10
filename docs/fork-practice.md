# Fork practice

`/fork` (and `/vi/fork`) is a private, noindex page. It reuses `ChessPractice`,
`DrawTrainer`, `PracticeBoard`, the teaching timer, full-screen view, branch
exploration, analysis link and `DrawGameViewer`. Protected exercise/source APIs
keep original game data out of the static page. The private hub links to it.

## Collection

149 positions from 149 different recorded games: A 26, B 35, C 28, C* 32, D 28.
These A–D records are real-game positions. Publication and both
validation suites now require at least 20 distinct real games in **each** level.
A game contributes only one exercise; duplicate starting FENs are excluded.

Full games come from the previously downloaded public
[PGN Mentor archives](https://www.pgnmentor.com/files.html) and checksummed
The Week in Chess archives. Each published
record retains the source URL, headers, complete game, preceding move, FEN and
original-game ply. The relevant archive checksums are in
`scripts/fixtures/fork/corpus-sources.json`. A solution can differ from actual
play; the full-game dialog always shows the original recorded continuation.

## Beginner position-first authoring

The initial Beginner import added **17 source-derived FEN-only positions** for
owner review. The 7 reviewed compositions remain in their source bundle but
are hidden by current owner removals. Subsequent owner authoring has brought
the active Beginner count to **98**, preserved by this extension. These manual
positions are not claimed to be tactically verified or already simplified.
At the latest D extension's publication snapshot, owner-adjusted counts are
**A 24, B 20, C 29, C* 38, D 24**. Owner removals and level changes were
retained. The four-position B gap is outside this D-only request.

On Beginner, choose **Lấy thế cờ từ B, C, C*, D, D\***. The protected API
uses the shared topic extractor to replay each source solution up to, not
including, its forking move. The selected move can be adjusted in the preview.
The importer accepts current source levels B, C, C*, D and D*. It skips A to reduce
overlap with Beginner. The four earlier A-derived imports were retired and
replaced with B–D source boards; the seven original compositions were retained.
The preview retains the original game reference, labels teaching-analysis
positions, skips duplicates and owner removals/transfers, and suggests only
the number needed to reach 24. Select boards, optionally edit them, then use
the single confirmation to import. More candidates remain available on demand.

Choose **Chỉnh sửa thế cờ / lời giải** on any Beginner board to arrange pieces
freely, change the side, paste/copy FEN, or record an optional solution. The
piece editor is separate from legal-move recording. Changing FEN resets old
lines; Cancel discards the draft. Save keeps the same entry ID and source.
Without a solution, the shared exploration board permits free practice with no
correctness or completion verdict. Worksheet diagrams remain available; answer
pages explicitly say no solution is recorded.

The 7 reviewed compositions and evidence are in
`scripts/fixtures/fork/beginner.json`, built into
`src/lib/server/fork-beginner-exercises.json`. The 17 imported boards use the
existing `src/lib/server/manual-tactics.json`; no per-request candidate bundle
is committed. Original A–D records, solutions, source games and owner decisions
are preserved. See [manual authoring](manual-tactic-positions.md) and the
[Beginner workflow](tactic-research-workflow.md#beginner-only-position-authoring).

## Selection and verification

### Ten-position B extension (2026-11-07)

Ten verified additions bring the owner-adjusted B collection from **20 to 30**.
Each sample uses three solver moves and follows the original recorded game.
Five positions have White to move and five have Black to move.

| Stable game ID | Game | Preparatory decision |
| --- | --- | --- |
| `3c26fbc4d79d9939` | Nguyen–Aikhoje | Double the rooks so the bishop's recapture creates the fork. |
| `9832d80de8a5f143` | Vargas–Cvitan | Check with the rook to line up a queen fork along a rank and a long diagonal. |
| `51b6258a7c5e5a7b` | Terry–Erigaisi | Move the king with a queen check, then use the knight to fork and reopen the queen's line with check. |
| `72cd744406b68caf` | Ivic–Trost | Protect the queen's entry square with a quiet bishop move. |
| `7d4f16253d545f09` | Wong–Doumassi | Attack the knight that guards b7 to clear the checking rook entry. |
| `9ba626cc76e3180c` | Meshkovs–Almiron | Threaten a checking capture to draw the king into a queen fork of king and rook. |
| `bd529176a44de824` | Stalmach–Wang | Force the king toward a protected queen entry, then distinguish the unguarded pawn from two defended pawns. |
| `6926d695db06ea62` | Zaw–Kandil | Use a pawn move to support a checking rook capture between exchanges. |
| `522e2bf0bee473d7` | Erdogmus–Bogner | Threaten mate so the blocking knight becomes the second target of the queen's check. |
| `f39be840937a0c34` | Moosavifar–Pranav | Use a rook check to draw the king onto a knight-fork square. |

The saved candidate bank yielded nine approvals. A bounded pass over indexed
TWIC games supplied the tenth. Automated tactical review screened 174 position
revisions in about 92 seconds, excluding source scanning, supplemental probes
and editorial review. The follow-up collection reused 2,600 cached game scans.
Unused leads, exclusions and deferred reviews remain in research memory.
The approved lines, source games and scoped exclusions are in
`scripts/fixtures/fork/expansion-evidence.json`.

### Two-position D extension (2026-11-07)

Two newly approved positions bring the active D count from **22 to 24** while
preserving all 231 previously active entries, all 137 source exercises/games,
manual Beginner boards and owner removals/level choices. Other levels are outside
this request; B retains its four-position gap.

| Stable game ID | Game | Advanced decision |
| --- | --- | --- |
| `881f21662999c535` | Rogule–Salimova | Offer the stationary Knight, deflect the Queen, then sacrifice a Rook to remove the Knight defending e2; the Queen fork recovers material for a net one-pawn gain. Six solver moves. |
| `3917e1eb97e46199` | Firouzja–Aronian | Use quiet Queen pressure and a checking move to set the King on h8, then sacrifice the Queen for the Knight fork on f7. Five solver moves, net gain of a Knight. |

Both sample lines match the original games. Full-budget topic-specific review
compares every legal starting move and relevant preparation replies, accepted
and declined sacrifices, alternatives and material recovery. Independent review
retains Rogule's complex `Rc5` alternative and Firouzja's longer `Nf7+` route;
the samples are not claimed unique. Rogule's continuation checks the live d-pawn.
The protected catalog, complete-game replay and shared worksheet exports use the
same approved records and reviewed Vietnamese solutions/hints.

Research reused indexed complete games and saved candidates without downloading
another archive. Kacharava remains deferred: fresh analysis found a credible
`g3` route collecting material before the fork against the strongest examined
defence; other replies remain an editorial question. Its exact supplemental
evidence is retained in this batch's coverage record. The unselected Ben Ghanem
lead and other unused source positions remain available for later review.
Pawn, Bishop and King forks and en passant/castling-created forks remain D
coverage gaps; the count is not a claim of complete coverage.

The publisher now permits a freshly reviewed approval of a deferred lead while
preserving the exact earlier decision in `deferralHistory`; prior approvals and
exclusions remain protected. The regression suite also checks indexed approvals
against their complete durable review rather than requiring invented legacy
screen scores or PVs. Full elapsed time, retries, engine/cache metrics and actual
independent reviewer intervals are retained in the ignored run ledger.

### Scoped D extension (2026-11-06)

Six additional verified D positions bring the active count from **18 to 24**.
Publication preserved all 226 entries active immediately before it, all
131 previous source exercises/games, nine earlier A/B approvals, manual data
and owner choices, including the two removed D examples. The initial 229-entry
research snapshot preceded concurrent owner removals/level changes; those
changes were retained. A D addition
must require a genuine sacrifice and advanced coordination over more than three
solver moves; a long equal exchange or an incidental final fork is unsuitable.

The original D set had nine Queen, seven Knight and two Rook forks. Selection
compared accepted/declined sacrifices, attraction, removal of defenders,
clearance, counterchecks and material recovery; both colors; quiet/capturing and
checking/non-checking forks. Bishop, Pawn and King forks and relevant promotion,
en passant or castling cases are coverage leads, subject to the same depth and
complexity requirements. No mechanical piece or color quota justifies padding.
The selected batch has three White/three Black positions. The complete D set
now has 13 Queen, nine Knight and two Rook forks.

The initial persistent D lookup returned no eligible leads: its 24 legacy rows
lacked complete source evidence. Three unpublished legacy game records were
checked and all failed the local fork-payoff check. Saved cross-topic variations
are reused only as discovery leads and require new Fork-specific verification.

| Stable game ID | Game | Distinct advanced decision |
| --- | --- | --- |
| `46bccd944e7969ac` | Karpov–Ribli | Answer check, exchange two Rooks for a Queen, then exploit King attraction and the cleared e4 square. |
| `59a4bbff8800ef22` | Maurizzi–Agmanov | Calculate a Rook offer through a countercheck and Queen exchange, then use the remaining Rook to prepare the Knight fork. |
| `5bf5716fb3926512` | Kramnik–Leko | Sacrifice a Knight to open the Queen diagonal while respecting the opponent's passed a-pawn. |
| `a3a964496ef9318a` | Pantsulaia–Kramnik | Start with a quiet Rook fork; after the exchange sacrifice, choose the Queen-check order that keeps the King away from its passer. |
| `48c4a54ae6c7e136` | Xiong–Aronian | Remove one defender, divert another with a pawn move, then coordinate a Knight sacrifice and the essential final Knight fork. |
| `1b5b4544d8068285` | Aronian–Gelfand | Use promotion as a Queen decoy, then a genuine Rook sacrifice to place the Rook on the Queen-fork square; net gain is one pawn, not a forced game win. |

The cumulative `expansion-evidence.json` retains per-record hashes, complete
games and sources, every starting move, sacrifice accept/decline probes,
concrete recovery evidence, independent editorial notes and Vietnamese copy.
`publicationBatches` keeps old budgets and evidence unchanged. Supplemental
exact-history comparisons are embedded for Kramnik's simpler capture,
Pantsulaia's check order and Gelfand's competing `Qg4` root.

The source search reused saved variations, scanned bounded tournament and
master-player windows, and revalidated the existing Aronian archive checksum.
The archive legally parsed 5,610 games with zero parser errors; 4,339 passed
the conservative post-2010 master filter and were imported once. Metadata-only
corpora are now included in cached, bounded parallel Fork geometry scans.
These scan counts and unselected leads are not approved-exercise counts.

Editorial review rejected Begmuratov–Mao's incidental pawn fork after promotion
had already gained material, and Aronian–Dubov's incidental bishop fork beside
a discovered Rook check. Giri's immediate equal Knight recovery was withheld
from D. Rogule remains a sound unselected lead; Kacharava retains an unresolved
simpler-pawn-retention question. Pawn, Bishop and King forks and en passant or
castling-created forks remain D coverage gaps. Promotion is represented as
necessary preparation in Aronian–Gelfand; complete motif coverage is not claimed.

The isolated builder, legal replay, worksheets, access, alternative-mate,
viewer and copy checks passed. All six diagrams and all 6 worksheet/8 answer
pages were visually inspected before applying the append. The fixed two-known-D
worker benchmark used identical budgets and 44 legal roots: one worker took
20.51 s cold, two took 11.35 s, each with 58 engine calls. Warm repeats took
0.19/0.16 s with zero calls and identical decisions. This measures automated
review under ongoing editorial work, not fresh research or total task speed.
Full elapsed time, retries and reviewer intervals remain in the ignored ledger.

### Scoped A/B extension (2026-11-06)

The requested scope is four new A positions and five new B positions. The
starting owner-adjusted counts are A 20 and B 19. Existing positions, manual
Beginner boards, removals and level choices are preserved; other levels are
outside this extension.

The selection checklist considers direct and prepared forks separately: Pawn,
Knight, Bishop, Rook, Queen and King attackers; White and Black; captures and
quiet moves; checking and non-checking double threats; target movement,
counterchecks, captures of the attacker and material recovery. A needs a direct
decision; B needs short, meaningful preparation without a sacrifice. Existing
Knight/Queen checking forks do not by themselves establish coverage of quiet
forks or other pieces. Castling, en passant and promotion are assessed only
when they create the fork and fit the level; they are coverage leads, never a
quota. Final selected IDs and unresolved coverage are recorded with approvals.

Candidate lookup precedes game replay. Three unused legacy A/B leads were
retrieved from the persistent store; none passed both local-payoff and balanced
material screening. The indexed collector retains unselected geometric leads
in the same store. These are candidates, not publication approvals.

Four A and five B additions are now published in
`scripts/fixtures/fork/expansion-evidence.json`, with exact record/evidence
hashes, all-root comparisons, strong defences, recapture review, independent
editorial decisions, Vietnamese copy and checksummed complete source games.

| Level | Stable game ID | Additional decision |
| --- | --- | --- |
| A | `657d5d5f31ec9b43` | Arab–Bouzidi: Queen check displaces the King and wins the Bishop. The teaching line differs from play. |
| A | `62138295fa82f959` | Junior–Ali: Knight fork wins the exchange despite the d-pawn recapture. |
| A | `2ab7133b89879fa6` | Nihal–Hafiz: Queen check wins the Knight with Rook support; `Kd8` allows immediate mate. |
| A | `ca58ef45b3eaa150` | Kandil–Blackman: the attacked Queen escapes with check and forks the Rook; Queen interposition is covered. |
| B | `5e9a092d7ac5a531` | Sorensen–Elena: exchange the blocking Knight, then create the Knight fork by capture. |
| B | `738d8a295b87ffa3` | Supi–Khusenkhojaev: Rook check brings the King onto a Knight-fork square; Rook recapture is included in the explanation. |
| B | `34164659aebe3932` | Baninga–Morazo: equal Rook exchange places the Bishop on the Queen-fork line. |
| B | `d3f989771c8a877c` | Eltag–Rodi: escape check by capturing a pawn, then answer the opponent's pawn recovery with a Rook fork. |
| B | `8c0cea11ccc3f265` | Righi–Soliz: equal Bishop exchange places the Rook on a quiet Knight-fork square. |

The nine additions include both colors and checking and quiet forks. Pawn and
King forks, en passant and castling-created forks remain unresolved A/B coverage
leads; this batch does not claim complete motif coverage. A promotion lead was
withheld for a simpler material route. Existing special-move exercises remain.
Nine other editorial candidates were deferred, including Druska's material
recovery defence and Fronda's extra countercheck, which exceeds B's short line.
Unused positions and full research reports stay in the persistent local store
and ignored research directories.

The protected catalog was checked at **Beginner 98, A 24, B 24, C 29, C* 36,
D 18**. All 220 previously active entries, all prior games, manual data and
owner decisions were preserved. The shared isolated `finish-batch` workflow ran
Fork, worksheet, access, mate-alternative, game-viewer and copy checks before
exporting the selected nine positions. All 7 worksheet and 16 answer pages were
visually inspected, including enlarged diagram and solution pages.

The fixed two-position worker benchmark used identical full review budgets:
one worker took 4.16 s cold, two took 2.50 s; both made six engine calls and
compared the same 69 legal roots. Warm repeats took 0.14/0.16 s with zero engine
calls and identical decisions. This measures automated review of known leads,
not fresh research or an end-to-end speedup. Full task timing is retained in
the ignored run ledger, including collection, editorial review and inspection.

`collect-forks.py` identifies an actual double attack by a single moving piece.
At least two enemy pieces (including the king) must be attacked simultaneously.
The opponent responds to the check or moves one of those targets; the same
attacker then captures a remaining target on its next turn. The captured target
must not already have been attacked by that piece before the fork. The line
must gain material from both its start and the position before the fork,
including two further principal-variation plies for exchanges.

Stockfish searches use 12,000 nodes for candidate screening, 300,000 nodes with
three principal variations, and a fresh 100,000-node defence search after each
solver move. The selected root scores at least +150 cp and within 40 cp of the
best searched root; defensive probes must retain at least +100 cp.

`build-forks.py` then enumerates **every legal reply immediately after the
fork**. Each response must allow a capture by the forking piece that gains at
least a pawn, even after any legal immediate countercapture. Stalemates and
immediate mating counterattacks are rejected. The primary capture must meet
this check too. These reply/capture branches are stored for the shared trainer.
Merely attacking two pieces does not complete the exercise: the capture must
be played.

This exhaustive local check covers the fork's immediate payoff, not every
possible earlier defence or indefinite play. Engine searches are finite
validation, not a proof of a forced game win or a unique solution.

Difficulty follows the existing teaching scale: A is a direct fork/capture,
B includes simple preparation, C one short sacrifice, C* four or five solver
moves without sacrifice, D more than three solver moves with a genuine
sacrifice and advanced coordination. A single minor-piece sacrifice can qualify
when the complete decision is sufficiently complex. Immediately recovered equal exchanges do not
count as sacrifices. Grades are suggestions and remain open to review.

## Reproduce

- Prepare complete PGN archives with `scripts/prepare-pin-corpus.py`.
- `python3 scripts/collect-forks.py --phase tactics --extra-corpus CORPUS.json --output scripts/fixtures/fork/CANDIDATES.json --target 20`
- For new indexed leads, use `collect-forks.py --index research/tactics-index.sqlite
  --levels A B --workers 2 --max-games 2500 --output research/scratch/fork-leads.json
  --cache research/runs/engine.sqlite`. `--bank-only` reuses candidate positions
  without replay; `--offset-games` selects the next bounded window in the same
  stable index order. Collection and screens remain unpublished leads.
- Use shared `research-tactics.py review --topic fork --level A|B|D`, editorial
  packets/merge and `finish-batch` for new reviewed A/B bundles. The CLI's
  generic `collect`/`index-positions` remain Discovery-only and fail closed.
- `python3 scripts/build-forks.py` deduplicates and publishes the local payoff
  checks. It ignores `published.json` as input and respects `excluded.json`.
- `python3 scripts/test-forks.py` verifies game identity, exact FEN, fork geometry,
  material payoff, difficulty evidence and full local response coverage.
- `node --test scripts/test-forks.cjs scripts/test-practice-access.cjs scripts/test-draw-game-viewer.cjs`
  checks independent chess.js replay, capture-before-completion, protected
  endpoints, navigation and the shared viewer.

## Beginner authoring validation (2026-11-06)

86 focused JavaScript tests and 5 Python Fork tests passed, with TypeScript,
ESLint and the worksheet copy audit. Browser checks covered batch confirmation,
saving without a solution, piece removal and undo, FEN import, Apply/Cancel and
stable identity after a saved FEN change. The test edit was restored to its
source board. All 24 diagrams and the answer export were rendered and visually
inspected; the 17 FEN-only entries explicitly have no recorded answer. Source
A–D JSON, complete games, publication records, owner adjustments and all prior
manual entries matched their pre-import snapshot.
