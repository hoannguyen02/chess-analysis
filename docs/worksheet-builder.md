# Printable chess worksheets

`/worksheets` (also `/vi/worksheets`) is linked from the private practice library.
It uses `PrivateContent` and the existing protected topic APIs; no exercise data
is embedded in the public/static page. Topic discovery uses `/api/private-pages`,
the same protected registry that backs the page at `PRIVATE_HUB_PATH`. There is
no separate hard-coded worksheet topic list.

To add a printable topic, set `worksheetEndpoint` on its existing entry in
`src/lib/server/private-hub.ts`. The endpoint must require practice access and
return `{ categories: DrawCategory[] }`. The builder uses the entry's title,
order and route ID, and loads protected sources to calculate level availability. Current
entries include tactics, checkmates, simplification and draw practice. Schedules,
saved games, external Lichess links and the London course have no compatible
exercise endpoint and are not listed. An empty registry shows no selectable
sections and prevents export. Renaming the private hub URL needs no builder change.

Choose levels once using the shared checkboxes, then order topics and set the
quantity per available selected level. Each chapter topic can be selected once:
Add section chooses the first unused eligible topic, and topic dropdowns omit
other rows' topics. Removing or changing a row releases its old topic. Mixed
review can revisit preceding chapter topics at multiple levels; each topic-level
pair can appear once per block. Adding review rows prefers an unused available
pair from preceding topics. These rules apply to fresh and reused positions.

Levels are Beginner, A, B,
C, C\*, D; availability is calculated from the current published exercises.
Beginner uses the existing boolean flag, never the level A fallback. Missing
levels remain visible. Each section starts a fresh page; the final page may
have fewer than six positions. Selection follows library order and skips
positions already used elsewhere in the packet (FEN including side, castling,
and en-passant rights). There is no fixed position-count cap; the selected pools and duplicate checks
determine availability. Exports over 120 positions show a non-blocking time/
resource warning (an advisory threshold, not a measured browser limit). This release does
not provide manual per-position picking or random selection.

Both PDF files are generated from one selection snapshot. Editing any selection
invalidates the download links. URLs are revoked when replaced/unmounted.
The browser loads pdf-lib and fontkit on demand. Assets are bundled locally.
No PDF service or server-side browser is required.

## Approved layout

Name/date fields and solving instructions appear only on the first worksheet page.
Topic and level remain on every page.

A4 portrait, two columns by three rows; 194-point (~68 mm) boards. Side to move
is taken from the starting FEN and the solving side faces the bottom. The
previous move is displayed only when supplied and its replay reaches the exact
starting FEN. Standard notation accompanies Vietnamese piece/move explanations.
Per user approval, objectives and tactic/level labels are omitted from each
position; topic and level remain in the page header. One unlabeled dotted
answer line appears below each board. Cburnett pieces replace Unicode glyphs. Dark squares use pure-black 0.3-point
diagonal vector hatching at 2.6-point offsets, inset 0.35 points inside each
square. Light squares remain white; no pale gray fill is required. The pattern
is drawn before the opaque piece artwork, in either board orientation.

Design reference: W3C G111 (using patterns alongside color),
https://www.w3.org/WAI/GL/WCAG20/WD-WCAG20-TECHS-20071211/G111.html .
PDF rendering verifies geometry; physical printer output still needs a paper check.

Answers use matching global numbers, full saved lines and alternatives,
Vietnamese explanations, stored solution notes, and source captions when
available. They are suggested continuations, not uniqueness claims. Page breaks
repeat the exercise label when an answer continues. No new tactical verification
or grading is claimed by the export. Existing curated data and exclusions remain
the source of truth. Interactive trainer/alternative-mate code is unchanged.

## Checks

- `node --test scripts/test-worksheets.cjs`
- `node --test scripts/test-practice-access.cjs scripts/test-practice-library.cjs scripts/test-mate-alternatives.cjs`
- `npx tsc --noEmit`
- `WORKSHEET_RENDER=1 node --test scripts/test-worksheets.cjs` additionally emits
  temporary PDF specimens in `tmp/pdfs` for Poppler rendering and visual review.

Browser checks: authorized entry, empty Beginner level, reorder, downloads,
stale-download invalidation, mobile overflow, and unauthenticated API denial.

## Configurable footer

The builder exposes name, telephone, and address fields, prefilled with LIMA
Chess contact details. Blank fields are omitted. Editing these fields clears
previous PDF links. The same contact footer appears on every worksheet and
answer page, with page numbering reserved at the right; long text scales to
fit the contact area. Values belong to the current builder session.

## Watermark

The optional “Chữ chìm (watermark)” field sits beside the worksheet title.
It defaults to LIMA Chess; clearing it disables the mark. Every worksheet and
answer page receives light-gray vertical text in the right margin, outside
boards and answer text. The mark uses a solid 75% gray value instead of
transparency; even if monochrome printing darkens it, content remains clear.
The text is capped at 12 points and fitted to 500 points of vertical space.
White squares have an explicit white background. Changes invalidate existing
PDF download links.

Design rationale: contrast should be maintained between main text and its
background (https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).
Section508.gov also notes watermark-related contrast risks
(https://www.section508.gov/create/alternative-text/). Margin placement is our
print-layout choice, not a guarantee about a specific printer's gray rendering.

## A4 book mode

Choose **Sách bài tập A4** in the format selector. Worksheet mode remains the
original layout. Book mode adds a cover with name/start-date lines, optional
introduction, ordered practice sections, optional mixed review, and optional
closing text. Use “Chỉnh sửa trang mở đầu và kết thúc” to open the editor dialog.
“Lưu thay đổi” applies edits; Cancel, Close, and Escape discard draft changes.
Edit the introduction/closing titles and bodies; a blank body
omits that section. Paragraphs and long words wrap, with additional pages as
needed at a readable font size. Settings are held in the current session.

Review scheduling is dynamic and enabled by default: recent-group review after every
3 topics, 6 positions per topic per available selected level, plus a final cumulative review. The interval,
count, cumulative/recent-group scope, and final review toggle are configurable.
A final block replaces the periodic block at the same endpoint. Ten chapters
therefore yield blocks after 3, 6, 9, and 10 chapters, containing 18, 18, 18,
and 60 positions when one populated level is selected for each topic. The final block always covers all chapters.

Automatic blocks derive their topics, chapter levels and anchors from the current
chapter order. One customization button opens a native modal dialog containing a block selector
to customize topics, levels and counts across all reviews. Draft edits survive
switching blocks; Save applies all edits together, and Cancel/Escape discards all
unsaved edits. Reset and orphan-block removal are available inside the dialog. Automatic
placement is read-only in the dialog. Reset restores current shared settings.
Custom overrides follow their schedule slot (the final slot follows the book end),
retain chosen rows, and flag topics that no longer precede their block. Overrides
whose slot disappears remain visible outside the schedule for correction/deletion;
they are not silently discarded. Disabling automatic review omits all review
blocks while retaining edits for re-enabling. Topic-level pairs are unique within each block.

Fresh review positions are reserved globally across every block before chapter
selection. They repeat neither chapter nor other review positions. Reuse mode
selects from preceding chapter positions only; deliberate repeats between review
blocks are permitted, while duplicates within a block are excluded. Both modes
report shortages without changing levels or silently reducing counts. There is
no fixed book-size limit.

Each block starts a new page, uses six positions per page and is numbered in
book order. “Trộn thứ tự bài ôn tập” is checked by default and shuffles/interleaves
within each block. Unchecking preserves the configured topic and library order.
All configuration changes invalidate both PDF links. Review pages hide topic
labels; the answer book retains original topic/level and global exercise numbers.

Numbering continues across chapters and review. Each review entry retains its
original topic and level for the answer book, which has its own cover and page
numbers and includes the same saved lines, alternatives, and provenance as
worksheet answers. Both PDFs use the same frozen selection. Intro/closing
text is not duplicated in the answer book.

Book pages have mirrored horizontal offsets: a 40-point left content margin
on odd pages and 20-point left margin on even pages, preserving board size.
Print at actual size on A4, duplex, flipping on the long edge, for left binding.
This is normal sequential A4 pagination, not folded-booklet imposition. Chapters
start on fresh pages; they are not forced to start on odd pages. Footer and
watermark settings apply to both books. A physical printer check is still
recommended before printing a full run.

Book regressions cover reservation, reuse, shortages, zero/invalid counts,
continuous numbering, stable mixing, answer metadata, A4 page structure, and
long introduction pagination. Browser checks cover both downloads, edits
invalidating downloads, reuse/fresh switching, empty counts, mobile layout,
and switching back to worksheets. Render specimens remain ignored in tmp/pdfs.

## Book cover design

Covers use the original gold-and-dark vector LIMA symbol above a
centered title, an outlined rook/knight/bishop illustration, and a compact
name/date area. The illustration is decorative, not an exercise position.
The exercise cover omits the redundant book-type label and position count.
The answer cover uses the same composition, marked “SÁCH LỜI GIẢI”.
Brand text follows the configurable footer name (falling back to LIMA Chess).
Cover text uses dark green with gold rules; introduction headings use the same
accents. Body text and exercise pages remain monochrome. No large background
fills or pale shading are needed to understand the design. Existing footer/watermark settings
and binding margins remain in effect.

`public/chess-print/lima-logo.json` contains the paths and transforms from
`public/brand/lima-symbol.svg`; rectangles are represented as equivalent paths.
The PDF renderer preserves the original SVG fill colors and geometry.
If the brand symbol changes, refresh this derived geometry from that SVG.
The PDF uses the existing licensed Cburnett artwork for the decorative pieces.

Design references: IBM's layout guidance on hierarchy and whitespace
(https://www.ibm.com/design/language/layout/tips-and-techniques/) and W3C's
contrast/color-independent design guidance
(https://www.w3.org/WAI/tips/designing/). These inform our composition choices;
they are not print certification. Review a physical print before a large run.

## Level guide and continuing practice

The introduction includes an optional level guide in the exact
Beginner, A, B, C, C*, D order. The closing uses a practical self-review sheet. Descriptions follow AGENTS.md, including the
sacrifice distinction between C and C* and solver-move counting for D. The
current book's levels are derived from its actual selected exercises, including
review metadata. The guide does not assert that every topic has all levels.

“Hiện hệ thống cấp độ và phần tự đánh giá” in the page editor controls the
introduction table and the closing self-review sheet. Blank introduction/closing bodies still omit their sections.
The closing page adds reflection lines and a prompt to contact the configured
footer organization for a suitable next book, with a space to record that choice.
There is no automatic promotion, score threshold, or invented public access link.
Long custom text and guide rows paginate without clipping.

Research informing the editorial choices (general learning evidence, not a
validation of these particular chess levels):

- EEF: planning, monitoring, and evaluating learning:
  https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation/
- AERO: spaced retrieval and feedback:
  https://www.edresearch.edu.au/guides-resources/practice-guides/spacing-and-retrieval-practice-guide-full-publication


Editorial copy uses a professional Vietnamese chess-coaching register. Opening
instructions focus on candidate moves, defensive replies, and checking the
stated objective. Closing copy identifies exercises/topics to consolidate and
uses a direct contact sentence instead of referring learners to page-layout
terms such as “chân trang”. The underlying footer setting labels may still use
that term because they describe document layout to the builder user.

## PDF editorial conventions

See [the copy review](worksheet-copy-review.md) for the complete scope and terminology.
Answers include a notation key, numbered moves with Vietnamese explanations,
and source URLs alongside player/event captions. An export-only editorial
adapter cleans reviewed wording and removes exact duplicate SAN recaps without
changing the underlying positions, variations or provenance.

`node scripts/audit-worksheet-copy.cjs` checks the complete current printable
catalog. Set `WORKSHEET_RENDER=1` to generate cross-topic PDF specimens under
`tmp/pdf-copy-audit/` for visual inspection.

## LIMA introduction branding

The first introduction page uses the existing vector LIMA symbol above
“TRUNG TÂM CỜ VUA”, a gold “LIMA Chess” wordmark and
“TƯ DUY · TẬP TRUNG · KỶ LUẬT · BẢN LĨNH”, following the center's wall branding.
The book title, editable introduction and optional level guide follow beneath.
The default content fits one A4 page; longer custom text flows to continuation
pages with compact section headings rather than repeating the brand block.
The shared contact footer remains configurable. Practice boards and the closing
page retain their monochrome treatment.


## Shared multi-level selection

The builder has one checkbox group above the topic rows, in the shared order
Beginner, A, B, C, C*, D. No level is selected initially; the first eligible topic is added only after a level is selected. It loads registered
protected exercise sources with at most four requests in flight, using the
existing access headers. Counts use `levelExercises`, including its playable-move,
recognition-mode and duplicate-position exclusions. No public count endpoint is
introduced. Successful sources remain usable if another source fails; the UI
reports failed loading and supports retry. A selected source that failed to load
cannot be silently omitted from export.

The topic selector includes a source if **any** selected level has at least `POSITIONS_PER_PAGE`
exportable positions (currently six, enough for one A4 page). Selected levels
with fewer than six positions are omitted from that topic. Topics already used
in another row remain excluded. A retained topic that no longer matches the level
selection stays visible as an invalid selection, blocks export and can be replaced
or deleted; changing a level never silently deletes a configured topic. Empty
level selection blocks export and all six level controls remain available.

Each topic row expands to its available selected levels in the shared order.
`Số thế / cấp độ` applies separately to each available level. New rows default to
`POSITIONS_PER_PAGE` positions per eligible level. Entered counts
remain unchanged on level changes; shortages are reported by the existing planner.
Topic-level IDs remain stable on reorder, and level sections carry a topic group
ID. Review intervals count topic groups, not the number of selected levels; reviews
are inserted after the last selected level of the relevant topic. Automatic review
rows include every available selected topic-level pair. Custom review rows can
include the same topic at different levels without duplicate topic-level pairs.

The single `Tùy chỉnh ôn tập` button sits beside the final-review checkbox; the
dialog manages all blocks. There is no separate review-count card.


`src/lib/chess/worksheet-layout.ts` owns `POSITIONS_PER_PAGE = 6`, matching the
A4 layout of two columns and three rows. Chapter defaults, automatic-review
defaults, topic/level availability and both chapter/review pagination use this
constant. Counts refer to distinct, playable positions returned by
`levelExercises`. Custom quantities and partial last pages remain supported;
source eligibility is based on having at least one complete page in that level.


## Chess notation reference page

The two explanatory paragraphs below the introduction's level table are removed.
A separate, printable Vietnamese-English notation page follows the introduction
by default. `showNotationGuide` (default true) controls it independently from the
level guide. The page editor exposes "Thêm hướng dẫn ký hiệu cờ vua". A blank
introduction still omits the complete opening section, including this reference.
The introduction table has a concise explanation of sacrifices and solver-move counts.

The reference covers files/ranks/squares, English piece letters with Cburnett
artwork, pawn notation, ordinary moves, captures, check/checkmate, both castlings,
promotion (including capture-promotion), en passant and file/rank/full-square
disambiguation. All displayed move explanations come from composed example FENs
via the shared legal-replay helper; these are notation illustrations, not new
practice exercises. `scripts/test-worksheets.cjs` verifies each example's exact
SAN, check vs mate, captured en-passant square, promotions and disambiguation.

Editorial reference checked 2026-11-04: [FIDE Laws of Chess, Appendix C]
(https://handbook.fide.com/chapter/E012023), with Articles 3.7.3 and 3.8.2 for
special-move wording, cross-checked against the [2025 FIDE Arbiters' Manual]
(https://arbiters.fide.com/wp-content/uploads/Publications/Manual/Arbiters_Manual_2025.pdf).
The PDF uses O-O/O-O-O and =Q/=N as its SAN examples and notes the 0-0/0-0-0 and
promotion-without-= forms that readers may encounter in other materials. It uses
# for mate, without redefining ++ as double check. Disambiguation considers legal
moves, so a piece pinned to its King does not create a second legal origin.

### Introduction copy and notation cross-reference

The default opening uses two short practice instructions. It omits the previous
"Tự giải trước khi đối chiếu lời giải" paragraph and inline Nd4 example. An
outlined "Tra cứu ký hiệu" callout follows the practice instructions when the
notation page is enabled. The renderer reserves the callout's space during introduction
pagination, then fills its target only after every introduction/level page has
been laid out. The reference uses the same one-based page numbering as the PDF
footer; it is not a fixed "page 3" string. Disabling notation or omitting the
introduction removes the callout completely.

All six levels remain in order. Levels actually included in the selected chapters
or reviews have bold labels, using the bundled DejaVu Sans Bold font under the
existing DejaVu license. Introduction descriptions use 10-point text and taller
rows. Verification covered the normal page-3 target, a long introduction whose
guide starts on page 6, and a document without notation; no text falls outside
page bounds in these specimens.


The introduction is ordered as: LIMA branding and book title, level system with
all six levels, practice instructions, then the notation callout at the bottom.
This keeps the reading/recording instructions next to the following notation
page. Custom introduction text follows the level table and can continue across
pages with its own heading; the notation page reference is resolved afterward.
When the level guide is disabled, the practice instructions follow the branding
directly. A clear gap separates the table from the practice heading.


### Coaching content review

The cover identifies the actual included levels (including exercise-level review
metadata) on both the exercise and answer books. A single level uses the full
bilingual label; a multi-level book uses a compact shared caption. Long titles
and captions use measured wrapping so they do not overlap the answer-book label.

The six descriptions retain the established definitions, with B explicitly
requiring preparation/coordination. The default practice text follows observation,
candidate selection (including quiet preparation), calculation against important
defences, and checking the final payoff including recaptures. Recording guidance
and the notation reference remain beneath the level table. The introduction's
brand header is slightly more compact to keep the expanded guidance readable on
one page; the cover retains its full-size branding.

The closing no longer repeats the six-row level table. Its editable opening is
followed by a printed checklist, a field for exercise numbers to revisit,
categories of missed decisions, an explicit readiness criterion based on new
positions rather than memorized answers, and topic/level fields for the next
practice plan. Checkboxes and writing lines use black vector outlines. Contact
information remains below the practice plan. Turning off the guide option omits
these structured additions; a blank closing body omits the complete closing.

The default copy lives in `worksheet.ts`, including `worksheetClosingReview`,
so the PDF renders source wording rather than applying editorial substitutions.
