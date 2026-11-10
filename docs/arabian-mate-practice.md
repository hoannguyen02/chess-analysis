# Arabian Mate practice

`/arabian-mate` and `/vi/arabian-mate` use the shared protected checkmate
trainer, timer, full-screen view, variation exploration and local game viewer.
The hub entry includes `/api/arabian-mate-exercises` as its worksheetEndpoint.
Starting side and the explicit checkmate objective remain visible while solving.

## Published selection

144 exercises: **24 each** for Beginner, A, B, C, C*, and D.

The selection includes 25 distinct real games, 95 reviewed composed or
modified positions at A–D, and the 24 preserved Beginner drills. The user
explicitly approved composed/modified positions alongside real games to fill
all levels. Every composed card identifies its origin; only actual game
positions offer a full-game replay. Modified positions are never presented as
positions from their reference game.

Full games, headers, source URLs, exact source ply, preceding move and archive
checksums remain local. Some exercise solutions are teaching variations after
resignation, while the viewer shows the actual original game. Candidate ancestry,
rejections, root reviews and legal all-defence proof trees are retained in the
fixtures. Published composed combinations have distinct full sequences of
moving pieces, captures and checks; color reversals do not establish distinctness.

## Motif and verification

Selection requires the defending king in a corner, a checking rook protected
by the knight, and an essential knight: removing the knight breaks checkmate.
Every published longer line has a saved certificate covering every legal
reply, independently checked with `two_rook_mate_proof.verify_certificate`.
Stockfish proposes moves and performs deeper root/defence review; the legal
certificate establishes the advertised mating bound. Finite engine review
is not an exhaustive proof that no shorter mate exists.

The expanded research covers 30 public PGN Mentor archives and 78,021 unique
games, plus the previously saved master-game collection. The final-position
search examined 48,287 decisive games ending before mate; a broader pass also
examined 263,416 earlier positions. Search is a candidate-finding process, not
an exhaustive statement about the corpus. Special-move coverage and limitations
are recorded in `research-scope.json`.

Composed candidates receive a separate deeper root review, enumeration of all
immediate mating alternatives, all-defence mate certificates, motif review and
sequence deduplication. Candidates failing the strict knight escape-square
requirement are durably excluded as related rook-and-knight mates.

## Rebuild and checks

- `python scripts/build-arabian-mate-intro.py`
- `python scripts/collect-arabian-mate-games.py --prepare --corpus PATH --seeds PATH`
- `python scripts/collect-arabian-mate-games.py --seeds PATH --target 24`
- `python scripts/review-arabian-mate-games.py --new-only`
- `python scripts/prove-arabian-mates.py`
- `python scripts/build-arabian-mate-games.py`
- `python scripts/test-arabian-mate-games.py`
- `node --test scripts/test-arabian-mate.cjs scripts/test-mate-alternatives.cjs scripts/test-practice-access.cjs scripts/test-worksheets.cjs`
- `node scripts/audit-worksheet-copy.cjs`

Research corpus normalizer: `scripts/prepare-queen-rook-mate-archives.py`.
`compose-arabian-mate-levels.py`, `prove-arabian-mates.py --composed` and
`review-arabian-compositions.py` generate and review supplemental positions.
`research-arabian-mate.py` searches the normalized corpus for mating
continuations from games ending in resignation. Paths to downloaded archives
are temporary; published exercises, full games and review evidence are durable.
