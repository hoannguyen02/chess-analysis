# Shared tactics map and game index

The machine-readable [tactics map](../scripts/fixtures/tactics-index/tactics-map.json)
uses stable IDs for dedicated project pages and proposed topics. It separates
tactical motifs, mate patterns, endgame ideas and special moves. A Lichess
link is not represented as a dedicated project page. Mate-in-N tags describe
an objective or calculation length; they do not replace the six practice levels.

The catalog now also records the three development priorities from the coaching
review, parent-child relationships and aliases. See
[the theme expansion review](tactics-theme-expansion.md) for the complete mapping,
overlap decisions, optional version-1 fields and validation commands. The 35 new
entries are planned topics, with no claimed exercise collections or detectors.
The existing protected `/api/private-tactics` endpoint returns this same catalog
as `themeCatalog`, alongside its unchanged `topicGroups` of working Lichess links.

Each current theme also has an optional `levels` array for planned teaching
suitability, in the order Beginner, A, B, C, C*, D. These arrays are independent
of development priority, child-theme assessment and published exercise counts.
They do not filter the six-level practice navigation or grade positions.
See [the suitability review](tactics-level-suitability.md) for all 110 initial
assessments and their reasons. An omitted array on a future theme means
unassessed; it does not default to every level.

## Local index

The shared [research workflow](tactic-research-workflow.md) also imports prepared,
checksummed master-game corpora directly into this index. On 2026-11-05 the
13,471-game Discovery research corpus was retained, bringing the normalized
complete-game count to 21,348. A metadata-only import deliberately leaves motif
tagging pending; it does not claim that every added game has geometric matches.
Its exact corpus/manifest fingerprint and progress are stored in
`research_corpora`, so repeat imports skip completed replay work.

`research-tactics.py sync-decisions` adds level-aware Discovery review decisions
and current owner removals, transfers and classifications. B-specific editorial
rejections stay separate from game-wide durable exclusions. These decisions
support research triage; the protected API remains authoritative for practice
and worksheet membership.

`scripts/tactics-index.py` builds the local SQLite index at
`research/tactics-index.sqlite`. This file is ignored by Git, stays in the
workspace across ordinary restarts, and can be rebuilt from the listed source
archives and selected evidence. Back it up if local review notes or status
changes need to survive deletion or moving machines. Raw bulk archives stay
outside the repository. Durable published exercises, reviewed evidence,
exclusions and source manifests remain in `scripts/fixtures/` and the protected
server data.

The index stores complete normalized game moves once per game, original headers,
source URL and archive SHA-256, exact starting position and source ply, previous
move and actual played move. A position can have several tags and multiple
source games. One complete game can have multiple source references. The
four-field FEN identity includes side to move, castling and en-passant rights;
full FENs and game ply are retained for replay. Source games are deduplicated
by the SHA-256 of starting FEN plus complete UCI move sequence, not by player
names or result. Chess960 and other variants are excluded because the practice
viewer currently uses standard chess.

Automatic geometric matches are **leads**, not verified tactics. The first
version detects possible captures of defenders, forks, absolute pins, skewers,
discoveries, discovered and double checks, actual checkmate and stalemate,
back-rank checkmate, promotion, underpromotion, castling and en passant. The
other map entries are intentionally present without a detector; they are not
claimed covered. These detectors are permissive: for example, a geometric fork
might be harmless, or a defender removal incidental to a simpler win.

The index also stores engine sample variations separately from the actual game
move. A variation can tag the source position as a possible preparation for
more than one motif. It is not recorded as played game history. Review status
is per position, game and theme: `lead`, `reviewed`, `rejected` or `approved`.
Only the existing approved-record builder publishes exercises. Synchronizing
approved records and durable exclusions never makes a geometric tag approved.

## Time control and player priority

For the current research queue, a game is prioritized when the source headers
report at least one FM, IM or GM and an initial clock of at least 600 seconds.
This includes 10+0 and 10+5 as well as longer base controls. It uses the initial
base, not a rating, puzzle rating or estimated game duration. Missing or
unparseable time controls and missing titles are retained as lower-priority
unknowns; they are not silently classified as blitz or discarded. A source
header is evidence of a reported title, not a substitute for checking player
identity and master credentials before publication.

The index reuses seven complete TWIC archive scans and imports preferred games
directly from issues 1663–1668, including games that did not happen to
appear in the defender-removal scan. Issues 1661 and 1662 were also scanned
directly but their headers did not produce eligible games under the
title-and-clock filter.
A further collector pass screened 10,909 indexed candidate positions from
issue 1663 and stored 125 leads in the index. These leads are not published
exercises; tactical and editorial review is still required.
Issue 1668 contributed 153 preferred games with title and clock headers; its
complete archive contained 7,159 parsed games and no parser errors. The archive
manifest records its checksum and the separate 827-game scan eligibility count.
Additional indexed passes over issues 1665–1667 screened 5,077 candidate
positions and recorded 68 further unreviewed leads.
Issues 1655–1660 were also scanned and their checksums and parse results are
in the defender corpus manifest. Their PGN headers omit clocks, so the index
retains them as lower-priority unknowns. For a focused follow-up, the 2026
Sinquefield Cup and Turkish Super League leads were separately selected using
their published classical controls; the [Sinquefield organizer](https://grandchesstour.org/tours/2026/tournaments/2026-sinquefield-cup/)
states 90 minutes for 40 moves plus 30 minutes and a 30-second increment, and
the [TWIC Turkish league report](https://theweekinchess.com/html/twic1657.html)
reports 90 minutes plus a later 30 minutes and a 30-second increment. This
event-level evidence does not change missing
PGN headers or automatically approve any candidate.
`import-scans` indexes the complete
games present in candidate scan files, not all games in the original archive.
`import-archive` scans every game in a zip and can run for all games or only
preferred games; the selected policy and progress are checkpointed separately.
A partial run resumes by archive URL, exact SHA-256 and policy. Reimporting a
game adds source references without duplicating it or resetting editorial
statuses. Use `stats` for current counts rather than treating a discovery count
as a count of suitable exercises.

```sh
# Reuse complete game leads from a completed prior archive scan.
python3 scripts/tactics-index.py import-scans /private/tmp/defender-twic1662.json

# Scan complete games directly; omit --preferred-only to include unknown/shorter controls.
python3 scripts/tactics-index.py import-archive /private/tmp/twic1664g.zip \
  --source https://theweekinchess.com/zips/twic1664g.zip \
  --retrieved 2026-11-02 --preferred-only

python3 scripts/tactics-index.py stats
python3 scripts/tactics-index.py query --theme capturingDefender --preferred-only --limit 20
python3 scripts/tactics-index.py sync-approved

# Feed preferred unreviewed leads into the existing staged collector.
python3 scripts/tactics-index.py export-leads --theme capturingDefender \
  --output /private/tmp/tactics-index-defender-leads.json --limit 1000 --preferred-only
python3 scripts/collect-removing-defender.py /private/tmp/tactics-index-defender-leads.json \
  --output /private/tmp/tactics-index-defender-collector.json --limit 200
python3 scripts/tactics-index.py import-candidates /private/tmp/tactics-index-defender-collector.json
```

`set-status` can record a reason for a reviewed or rejected lead. Accepted
exercise records must go through their topic's approved evidence and builder;
`sync-approved` mirrors those records and durable exclusions into the local
index. A rejected lead is not republished merely because a game is rescanned.

## Lichess puzzle leads

The Lichess puzzle CSV is a high-recall lead index, not evidence of a master's
title, a time control, a complete game or a sound exercise. Its FEN is the
position **before** the opponent's first listed move; apply that move before
presenting the exercise. The [official dataset format](https://database.lichess.org/#puzzles)
describes this convention. The optional `master` theme is a lead filter; it
does not establish that a particular player holds FM, IM or GM.

`import-lichess-puzzles` streams a local CSV or `.zst` file, checks legal UCI
moves, stores source game URLs and relevant map tags, and checkpoints by exact
dataset hash and filter. It leaves each entry `unresolved` until the complete
original Lichess game has been separately imported. A limited run resumes from
its saved row (compressed inputs must be decompressed again to reach that row).
`resolve-lichess-puzzles` matches the source game ID, puzzle FEN, first move
and URL ply when present, and stores the puzzle solution as analysis separate
from the original played move. Repeated or mismatched positions remain
unresolved. Only after the full game is available can the title and clock be
used for priority and later independently checked for publication.

```sh
python3 scripts/tactics-index.py import-lichess-puzzles /path/to/lichess_db_puzzle.csv.zst --master-only --limit 1000
# Import a zip of complete original Lichess PGNs with import-archive, then:
python3 scripts/tactics-index.py resolve-lichess-puzzles
```

No Lichess puzzle dataset or game was downloaded during the initial index
build. The importer is ready to use when that source is available; the current
longer-control leads came from TWIC. Verify the full game, FIDE title, legal
position, relevant defences, alternate moves, objective, level, duplication and
motif before publishing. See `docs/removing-defender-practice.md` for the
current topic and remaining gaps.

## Validation

`python3 scripts/test-tactics-index.py` checks map routes, title/clock priority,
representative detectors, game and source deduplication, review-status
preservation, archive resume, engine-variation separation and Lichess puzzle
resolution including the first-move/FEN convention. It is not a proof that each
automatic tag is a correct tactic.
