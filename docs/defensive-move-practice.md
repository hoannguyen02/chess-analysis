# Defensive Move practice

The protected practice route shares the generic tactics page, trainer,
owner editor and Beginner importer. Reviewed master-game exercises appear
alongside the owner's positions. [Defensive Move practice](/tactic-positions?theme=defensiveMove)
The full original game opens separately from the teaching line. The same
protected exercise endpoint supplies worksheets.

## Scope and coverage checklist

The initial A, B and C research focuses on positions where the opponent could
give immediate checkmate if the solver could pass. The initial threat is
derived from the board and confirmed against real legal moves that allow it.
The goal is to avert that threat and withstand the strongest reviewed
continuation. Stockfish comparisons support the viability judgment. They do
not establish a game-theoretic result or a longer forced mate.

| Level | Candidate decisions to cover |
| --- | --- |
| A | Capture a mating attacker, exchange it, shield a mating square, interrupt a line or open a safe square for the king. Compare quiet moves and captures by the king, queen, rook, bishop, knight and pawn. |
| B | Coordinate two defensive moves, including a forcing check followed by defence, an exchange or interposition followed by a second decision, and a quiet move that prepares an answer to the renewed attack. Compare choices against checks, captures and threats on a different square. |
| C | Verify a simple offer of material to remove, divert or obstruct an attacker or to open an escape square. Include the opponent's acceptance and the solver's response. Check strong declines, immediate recaptures and simpler viable defences. |
| D | Verify a purposeful sacrifice within four or five connected defensive decisions. Compare shorter defences, the strongest replies, material recovery and any attack that continues after the saved line. |

Check both sides to move, queen and rook mating lines, minor-piece support,
mating-square guards, escape-square changes and checks used to defend.
Castling, en passant and promotion are legal possibilities for the verifier.
They require a genuine defensive role before inclusion. Keep separately
documented gaps when the indexed master games do not provide suitable examples.
Beginner supports both owner authoring and the reviewed real-game set below.
The page keeps all practice levels visible.

## Review and publication

Use the shared `research-tactics.py` run ledger, candidate bank, collection,
review, editorial packets and `finish-batch`. The adapter compares every legal
solver move and screens every reply. It probes strong, checking and capturing
replies and the sample at the defence budget. It checks immediate mates by
legal move generation. Beginner, A and B review captures of the moved piece
and newly offered stationary pieces. C requires a real material cost in the sample.
An exact editorial approval and visual worksheet review are required before
the builder publishes a record.

The indexed corpus includes [PGN Mentor](https://www.pgnmentor.com/files.html)
player archives and [The Week in Chess](https://theweekinchess.com/twic) issue
archives. The approved bundle records each game’s headers, complete moves,
source ply and checksummed archive references. The explanations of castling,
en passant and promotion follow Articles 3.7 and 3.8 of the
[FIDE Laws of Chess](https://handbook.fide.com/chapter/E012023).

## Initial collection

| Level | Verified master-game positions | Owner-authored | Total |
| --- | ---: | ---: | ---: |
| Beginner | 0 | 0 | 0 |
| A | 24 | 0 | 24 |
| B | 24 | 1 | 25 |
| C | 24 | 0 | 24 |
| C* | 0 | 0 | 0 |
| D | 0 | 0 | 0 |
| D* | 0 | 0 | 0 |

Examples of distinct decisions include the king's escape in A
(`c4d09687beb38001`), the support-line block with a knight
(`a3e7ae668fb5678e`), the renewed threat and en passant reply in B
(`28eeb5704ed37f43`), and the f-pawn interposition that opens a new
checking diagonal (`412588e1f819ab34`). C includes a queen sacrifice
followed by promotion (`aad5ac15075dc82e`), a rook sacrifice that lets
the defender pin the attacking queen (`07074b0fd2f947ce`), and a knight
sacrifice that opens an escape square (`fe3ee81b6a95f80f`). The publication
bundle retains the full coverage checklist and stable record IDs.

Castling is available in reviewed A alternatives. A has no selected sample
starting with en passant or promotion. B has no selected defensive move
using castling or promotion. C has no selected castling or en passant
sequence securing the sacrifice. The collection focuses on immediate
mating threats. Defending other tactical objectives is a separate research
scope.

## Six additional Level B positions

The six positions each use two solver moves and preserve their preceding move
and full source game. Three are White to move and three are Black to move.
The saved lines in Anand–Adly and Zhang–Gelfand were played in full. The other
four identify where the teaching line differs from the game.

Anand–Adly guards d3 with `Rad1`, then uses `Qf7+` to free the king's f4 escape
square against a new mating threat (`161ce453b20b6d36`). In Gukesh–Carlsen,
`Re8` covers e7 and `Nxf4+` removes the knight that renews the threat on f6
(`06b9c1861e7063f4`). Zhang–Gelfand guards g7 with `Qg6` and completes the
queen exchange with `hxg6` (`26432197f7037d4f`).

The candidate bank supplied all leads without replaying archives for collection.
The shared workflow reviewed 80 distinct exact records, 29 of which reached
tactical readiness for editorial review. It recorded 844 engine calls and
68 engine-cache hits, excluding supplemental editorial comparisons. Three
exact tactical results were reused during the final review pass.

The run took 9.33 minutes through publication, validation and visual inspection
of ten worksheet and answer pages. With the current owner selections, the
active Level B count went from 22 to 28.

## Reviewed Beginner additions

The first Beginner batch added 24 original positions from 24 complete games
alongside five previously visible Beginner positions. Fourteen of those
reviewed positions are White to move and ten are Black to move. Each board
has four to ten pieces, counting kings and
pawns. Each answer takes one move. All 246 other legal starting moves
allow immediate checkmate.

The batch includes capturing an attacker or removing its support, cutting a
line, guarding the mating square, pinning the mating piece, opening an escape
square and checking to displace a guard. For example, Duda–Ponomariov uses
`Nd3` to interrupt a bishop's support of the mating square
(`c68d9b099bf37903`). Jobava–Artemiev uses `exf6` to stop two queen mates
by opening the e-file and removing the pawn that guards g7
(`09f030b5a023c071`). Fedosov–Laddha uses `f4` to vacate f3 for the king
(`5f05922bf807608b`).

In 23 positions, the player made the defensive move in the game.
Vaganian–Shanava starts from the final recorded position and marks `Kf8`
as analysis (`0923d3e2a64d8532`). Every exercise preserves the preceding move
and full source game. The set includes two defenses against promotion mate.
Queen moves, castling, en passant and promotion remain coverage gaps among
the selected defensive answers. [Beginner practice requirements](beginner-one-move-game-requirements.md)

The three collection passes searched 40,630, 65,758 and 100,982 eligible
indexed games, including overlap between passes. The final pass took
71.66 seconds for geometry and engine screening, with 65,744 geometric
cache hits and 297 engine calls. Full tactical review compared 898 legal
starting moves across 72 candidates, with 648 engine calls across the
three passes. Editorial selection withheld near-duplicates and positions
that required another decision against a renewed mating threat. The full
run took 19.82 minutes from preflight through publication, validation and
visual inspection of 15 worksheet and answer pages.

### Ten more one-move defenses

The follow-up adds 10 original positions from 10 complete games. All ten
defenses were played. Six positions are White to move and four are Black
to move. The boards have five to ten pieces, and all 100 alternative legal
starting moves allow mate in one. The existing 20 visible Beginner entries
and the owner's prior transfers and removals were preserved. Beginner now
shows 30 positions.

Reprintsev–Castro Lombana uses `Bxb1` to capture a newly promoted queen
that threatens mate on two squares (`95dce844438a13e4`). Zhong–Mu uses
`Kg6` to reach a position where a pawn can block the threatened bishop
check (`c470286844375589`). Starozhilov–Kengurov uses `b4+` to check
while clearing b3 for the king (`10da502b8295208d`).

Research reused eight saved candidates and screened 32,953 eligible games
linked to 14 issues of The Week in Chess. The source scan took 45.61 seconds
and produced 22 distinct leads. Full review compared 299 legal starting
moves across 25 candidates from the bank and the source scan, with 154
engine calls and 59 engine cache hits. Editorial review kept a mix of
king escapes, captures, pawn guards and pawn moves that clear an escape.
The full run took 9.31 minutes through publication, validation and visual
inspection of all 11 worksheet and answer pages.

## Level D real-game additions

Level D uses four or five solver moves against a continuing attack. The
starting board shows a concrete mate threat. An exercise may also start in
check when a legal evasion allows immediate mate. The saved continuation must
include a purposeful sacrifice and answer the strongest reviewed resources.
An ordinary exchange or the incidental loss of an already exposed piece does
not establish the grade.

The verifier compares all legal solver moves at each decision and screens all
opponent replies. It checks shorter viable defenses and looks for continued
forcing pressure at the endpoint. Editorial review separately checks the
sacrifice, material recovery, and whether any strong alternative changes the
grade. The engine comparisons support a bounded tactical judgment.

The three batches add 30 positions from complete master games. Sixteen are
White to move and fourteen are Black to move. Seventeen solutions take four
solver moves and thirteen take five. Twenty-three solutions were played in
full. The other seven identify where the teaching line departs from the game.
Every exercise retains its preceding move and full original replay.

Spizharny–Vershinin gives up a rook to promote with check, then trades the
promoted queen to reach an equal knight ending (`459169743ae353ef`).
Movahed–Niemann gives up a queen for a rook and uses `Rd2` to close the checking
line (`280190c63b9a0054`). Donner–Geller offers a bishop to interrupt the attack
and exchanges queens after `Qxf5` (`c851613579239683`).

The five engine-assisted collection passes examined 59,920 game entries,
including overlap, and made 38,509 engine calls. A separate scan checked the
played moves of all 126,204 indexed games and retained 851 raw variants. The
review files cover 570 distinct exact candidate records, of which 102 reached
tactical readiness for editorial review. The completed shared review commands
recorded 6,790 engine calls and 601 engine cache hits, separate from collection
and targeted editorial probes.

The run took 45.86 minutes from the initial preflight through all three
publications, final regression checks and visual inspection of 39 worksheet
and answer pages. Collection and editorial review overlapped during the run.

## Measured initial run

The first 6,000-game collection took 81.86 seconds with 2,587 engine calls.
Replaying that collection from completed caches took 3.31 seconds with
6,000 geometric cache hits and no engine calls. The broader collection
searched 30,720 indexed games in 412.28 seconds with 9,540 engine calls.
It retained 105 raw C leads, including multiple frames from some games.

The four main tactical-review passes compared 6,553 legal starting moves
across 213 candidates and made 1,865 engine calls. They sent 115 positions
to editorial review and withheld 98. The first batch took 17.89 minutes
from preflight through publication and visual review, including overlapping
collection, editorial work and integration. The final B reserve reused its
exact tactical review with zero engine calls. Its separate publication
preserved all 71 earlier approved records, games and exercises.

The full elapsed time through the final B addition and regression checks
was 20.67 minutes. The publication previews covered 44 pages
across both batches. The application type check excluded ignored research
staging copies from earlier tasks.
