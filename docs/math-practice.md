# Math Practice

- The math navigation and both math routes are available in local development,
  but return 404 in production by default. Set
  `NEXT_PUBLIC_ENABLE_MATH_PRACTICE=true` at build time to publish them later.
- `/math-practice`: browser-local lesson library, editor, learner preview, practice, import/export, sharing.
- `/math-practice/learn#lesson=…`: standalone student snapshot; no account required.
- `/math-practice/learn`: received lesson history in this browser.

Four original examples are added only when no saved library exists: Grade 3 multiplication, Grade 4 rectangles, Grade 6 fractions, Grade 8 equations. An intentionally empty library stays empty.

## Authoring

A lesson contains metadata, ordered teaching blocks, and exercises. The five stages are `foundation`, `explore`, `example`, `guided`, and `practice`. Blocks support text, two fraction bars, and a labelled rectangle (dimensions in cm, illustration not to scale). Example blocks reveal one step at a time. Exercises support numbers (optional unit/tolerance), fractions (equivalent or simplest form), and choices. Hints, solutions, and common mistakes are editable.

Exercise `prompt` contains only the question, including any mathematical requirements such as simplifying a fraction. Put web answer-entry guidance in the optional `inputInstruction` field (up to 1,000 characters), exposed in the editor as **Hướng dẫn nhập đáp án (chỉ hiện trên web)**. The learner sees it beside the answer controls; neither PDF variant renders this field. Guidance can use any wording without changes to the PDF exporter. JSON, Excel and shared links preserve it.

Old built-in examples with combined question/guidance text are upgraded at the data-loading boundary using exact historical records from `exercise-content.ts`. This covers local libraries, old imports, duplicate copies and shared links, is idempotent and preserves custom wording. `lima-math-input-instructions-v1` records the local library upgrade. There is no phrase blacklist or sentence-removal rule in PDF rendering. Custom legacy questions can be split into the two editor fields; arbitrary prose is never silently classified or deleted. As with other learner-content edits, upgraded content follows the existing progress-fingerprint reset behavior.

Write `1/2` or `(1 × 3)/(2 × 3)` in lesson text; the student renderer shows stacked fractions. This renderer is for fractions, not arbitrary LaTeX or symbolic algebra. Equation exercises currently ask for a numeric solution. There is no automatic proof grading.

In web lesson text, the stored `□` placeholder renders as a small square with a centered `?`, including numerator/denominator blanks and worked examples. The shared style vertically centers the box with digits/operators in both regular examples and bold question headings, including earlier addition/subtraction lessons. Screen readers announce “Ô trống cần điền”. Worksheet and solutions PDFs also draw a vector square with a centered question mark, including fraction blanks, summaries and solutions. PDF boxes retain the original marker's text width and carry `ActualText` for the stored `□`; ordinary question punctuation is unchanged. This is presentation only: saved/imported/shared question text, answer checking and progress fingerprints are unchanged.

In solution PDFs, the shared `printableShortSolution` formatter shows `Đáp án: …` first for numeric, fraction and multiple-choice exercises. By default, working containing an equality uses `Cách làm`; other reasoning uses `Giải thích`. Authors can override this with optional `solutionStyle` (`method`, `explanation`, `answer-only`) in the lesson editor, JSON or workbook. Only explicit answer-only content or an exact duplicate of the stored answer is omitted; other authored reasoning is preserved. Answer-only choices include the option text, for example `Đáp án: B. Một phần tư`. The setting survives saving, sharing and Excel round trips. Untouched historical unit-fraction examples receive meaningful equal-parts explanations; teacher edits are preserved. Tables and written tasks retain their model solutions; word problems retain the approved `Bài giải`/`Đáp số` layout. Worksheets never show this answer block.

Save is explicit. Preview returns to the draft. Duplication gets new identifiers. Deletion has confirmation and one-level undo. Existing shared copies are independent of edits/deletion.

## Teaching mode

Open a lesson and choose **Giảng bài** to use the full-viewport teaching view. It removes the surrounding site chrome, keeps section and Previous/Next navigation visible, and presents one teaching block or core exercise at a time. Use the left section rail, the persistent buttons, or the Left/Right arrow keys to change steps; Escape exits teaching mode. Form fields, exercise buttons and dialogs retain their own keyboard behavior. Returning to an earlier step preserves its current hint, solution and draft answer.

Teaching navigation does not mark content as read or change completion by itself. Answering an exercise still uses the lesson's normal progress storage. Extra practice keeps its existing one-question-at-a-time numbered navigation while the teaching shell stays compact; PDF controls are hidden until teaching mode is closed.

## Storage and sharing

Library key: `lima-math-lessons-v1`. Progress is stored by lesson ID with an exact learner-content fingerprint. Changing learner content starts a new progress record; changing teacher notes does not. Older snapshots remain readable but switching between different revisions of the same lesson does not retain separate progress records. Results are local, not submitted to teachers. Preview never saves progress.

History key: `lima-math-shared-history-v1`, at most 50 snapshot links. Sharing compresses validated learner content into a URL fragment, excluding private teacher notes and all progress. Anyone possessing a link can read its lesson and solutions. Limits: 16,000 token characters / 256,000 uncompressed bytes. Localhost links work only on that device; generate student links on the reachable deployed app. No new backend is required.

Unreadable browser data is not silently overwritten. Save failures retain the open draft. Export backups before clearing browser storage. JSON/Excel exports include teacher notes; student links do not.

## Import/export

Use **Export JSON** for a portable backup or **Export Excel / import template** for a workbook that can be edited and imported again. Import always validates and presents a review: add a copy or explicitly select an existing lesson to update. No lessons are changed before confirmation. Maximum file size is 2 MB; maximum library size is 100 lessons.

JSON envelope: `{ "version": 1, "subject": "math", "lessons": [...] }`. See `src/lib/math/lessons.ts` for the types and validation rules, and `examples.ts` for complete records.

Excel sheets:

- `Lessons`: id, title, grade, topic, goal, textbook, teacherNotes, knowledgeSummary (optional).
- `Blocks`: lessonId, id, section, title, text, visual, values.
- `Exercises`: lessonId, id, section, kind, prompt, inputInstruction (optional), answer, options, unit, hint, solution, simplified, tolerance, mistakes.

`values`, `options`, and `mistakes` cells contain JSON arrays. `simplified` is TRUE/FALSE. Preserve IDs when updating; use review to choose add-as-copy instead. For fractions, use an Excel text cell for answers such as `1/2` to avoid date conversion. Each block/exercise must reference a lesson in `Lessons`. Math and English packs are deliberately distinct.

## Checks

`npm run test:math` tests examples, grading, validation, import updates/copies, bounded share decoding, private-note exclusion, and Excel round trips. `npm run build` includes TypeScript validation and both routes.

## Extra practice

The optional `extra` exercise section adds one-question-at-a-time practice, navigation, local progress, a summary, and retry of unanswered/assisted questions. The fractions sample contains 20 questions (4 foundations, 8 skills, 6 applications, 2 challenges). Existing libraries receive the section directly through a one-time migration (`lima-math-extra-migration-v1`). It appends the exercises to the original Grade 6 fraction lesson, preserving teacher content. Existing extra sets and deleted lessons are left alone. No sample import is needed.

Teachers can add, reorder, edit or remove extra questions. Optional fields: `group` (foundation/skills/application/challenge), `skill`, `difficulty` (easy/medium/hard), and legacy `workspace` (small/medium/large, retained for compatibility). Worksheet writing space is now automatic: dotted rows are sized from the formatted model solution, including wrapped text and stacked fractions, with one spare handwriting row and a two-row minimum. Number-line tasks reserve at least five rows. Choice and table tasks have no extra writing rows. The old fixed workspace size does not override this sizing. `written` questions are supported only in extra practice and require a model `solution` and `criteria` array; they are explicitly self-assessed, never automatically marked correct. Excel `criteria` cells contain JSON arrays. Existing packs without extra questions remain valid.

Extra progress uses `lima-math-extra-v1:<lessonId>` and an exact question-content fingerprint. Preview never writes progress. PDF worksheet and solutions use the same ordered questions; worksheets omit solutions and provide working space only for non-choice questions. Multiple-choice questions have no ruled lines or reserved writing space, regardless of any saved `workspace` value; the editor hides that setting for choices. Export runs locally in the browser and embeds the bundled licensed DejaVu Sans font, supporting Vietnamese and stacked fractions. No external PDF service or dependency is required. Unsupported font characters return an actionable export error. Teacher notes are omitted from both PDFs. PDFs are A4; there is no symbolic algebra or proof autograder.

Both worksheet and solutions PDFs omit the practice-group headings (Củng cố kiến thức, Luyện kỹ năng, Vận dụng, Thử thách) and their reserved height. Question order and numbering are unchanged. Saved groups and browser practice remain intact; the worksheet's separate Kiến thức cần nhớ summary is also preserved.

Every newly exported worksheet and solutions PDF includes the approved light `LIMA Math` watermark by default, for all grades and custom/imported/future lessons. Each page has six repeated 36 pt labels rotated 30 degrees, in 5% grey (RGB 0.95 on white), drawn behind the content and marked as decorative PDF artifacts. The embedded font, selectable question text, vector diagrams, header/footer, spacing and page breaks are unchanged; no external service or image conversion is used. This is a branding deterrent, not a guarantee against editing or removal. Existing downloaded PDFs need to be exported again to receive the watermark.

Solutions PDFs use the Grade 4 **Tìm phân số của một số** workbook layout as the shared word-problem standard, for every grade and both existing and future lessons. A centered `Bài giải:` heading occupies its own line. Explanatory sentences and calculations are centered; `Đáp số: ...` starts on the next row beneath the midpoint of the final calculation, while question prompts stay left-aligned. Single-step examples retain the three body lines: `An được số điểm là:` / `4 × 5 + 3 × (-2) = 14 (điểm)` / `Đáp số: 14 điểm`. Each purely numeric equality chain displays its original expression and final result directly, e.g. `3/4 : 1/8 = 6 (chai).` Separate calculation steps and all explanations are retained, including prose containing an equation. The question and solution stay together when they fit on a page. Longer solutions wrap within the margins and keep the heading with the first step, explanation/calculation pairs together, and the answer with the final calculation where possible. Decimals in generated solutions use a comma, with parentheses around the unit only on the calculation line.

The left edge of `Đáp số` is anchored halfway across the preceding calculation's last rendered line, not at its right end or the page margin. Since calculations are centered, this midpoint stays consistent for stacked fractions and wrapped lines. The answer remains on its own row and extends to the right; it shifts left only enough to avoid the right margin when necessary. Answers wider than the available page content wrap at the page margins.

The heading and statement/calculation/answer sequence follow the worked examples in [Trường Tiểu học Lê Quý Đôn's teaching guide](https://c1lequydon-cubao.daklak.edu.vn/ren-luyen-ki-nang-giai-toan-co-loi-van-cho-hoc-sinh-lop-3.html). The exact left/center/right alignment follows the requested LIMA worksheet style, rather than claiming a universal textbook requirement. Choice explanations, pure calculations and unrecognized solution structures keep their existing presentation.

An authored non-choice solution with working followed by an explicit `Đáp số:` row uses this layout based on that structure, not a lesson ID, grade, question phrase or list of arithmetic symbols. Cancellation marks and future notation cannot force it back to the inline `Lời giải:` layout. Equation classification only controls page-break grouping and safe compaction of numeric equality chains; algebra and prose remain unchanged. For legacy solutions consisting of a single numeric equality chain, the formatter can also derive the statement and answer from a single `bao nhiêu` question when the final value matches the exercise answer. Saved lesson content and browser feedback retain their full working, including intermediate cancellation steps. Existing downloaded PDFs must be downloaded again to receive the new layout.

PDF downloads use `LIMAMath - Lớp {grade} - {lesson title} - Bài tập.pdf` or `LIMAMath - Lớp {grade} - {lesson title} - Lời giải.pdf`. The specific lesson title distinguishes lessons within the same broad topic. Vietnamese accents are preserved; colons become separators and filename-unsafe/control characters are removed. Long titles are shortened so the complete UTF-8 filename stays within 240 bytes, preserving the grade, document type and `.pdf` extension. Repeated downloads of the same lesson may still receive a browser-added counter; no date or timestamp is added automatically.

Worksheet PDFs include **Kiến thức cần nhớ** before the exercises by default. The export checkbox can omit it for tests; solution PDFs never include it. Edit the optional `knowledgeSummary` text (up to 4,000 characters) in **Thông tin bài học**. Aim for half a page: key rules/formulas, a separate worked example and common pitfalls. Newlines and the existing fraction notation are supported. Longer summaries paginate with a continuation heading rather than being truncated.

Existing built-in lessons receive authored defaults only when their grade, topic and title exactly match the sample. Unknown/custom lessons are never summarized from answers, hints or teacher notes. An explicit empty string suppresses the default. Editing a lesson captures its displayed summary, so renaming it does not lose the text. JSON/Excel exports and new shared snapshots capture the resolved text for portability; old packs remain valid without the optional field.

PDF export shows whether it is loading the exporter or the font. A 20-second deadline covers both network stages; **Hủy tạo PDF** cancels immediately, aborts the font request and re-enables retry. Late module/font responses cannot trigger a cancelled download. Leaving the lesson cancels its pending export. A timeout indicates a connection/server problem, not a need to wait indefinitely; check the local development server and reload the page after recovery.

`MATH_PDF_QA_DIR=/tmp/math-pdf npm run test:math` also writes representative worksheet and solution PDFs for rendering checks.

## Shared brand

`Brand.tsx` provides the responsive LIMA Chess symbol and wordmark. `_app.tsx` renders the main navigation for translated pages and a compact brand header for standalone/shared pages. `Layout.tsx` only handles page content, preventing duplicate headers.

The original `public/images/Logo_LIMA.svg` is the artwork source. Run `python3 scripts/build-brand.py` after updating it to generate the clean website SVG (`public/brand/lima-symbol.svg`) and matching PDF vector commands (`src/lib/brand/logo.ts`). The generator supports the source artwork's absolute M/L/C/Z paths, rectangles, and affine transforms. PDFs embed those vector commands directly: no image downloads or raster scaling, navy wordmark for print, larger first-page branding and compact subsequent headers. PDF headers pair the logo with LIMA Math; the footer credits “A learning resource by LIMA Chess”.

## Quick editing while viewing a lesson

Owned library lessons have **Sửa nhanh** beside metadata, each teaching block, and each question (including extra practice), plus a full-lesson shortcut. A modal drawer reuses the validated lesson editor, initially focused on the selected item, with an option to open all fields. Save persists the lesson and keeps the current lesson section; Undo restores the previous saved snapshot for the current visit. Invalid content or storage failure retains the draft. Cancel/Escape warns before discarding edits. Shared student lessons and learner previews have no edit controls. Existing share links remain independent; share again after editing. Content changes follow the existing progress fingerprint reset rules.

### Natural numbers and divisibility lessons

Grade 6 content is split into two built-in lessons:

- Số tự nhiên: tập hợp và phép tính — 5 regular and 15 extra exercises.
- Tính chia hết, số nguyên tố, ƯCLN và BCNN — 8 regular and 17 extra exercises,
  with independent practice, sharing, editing and worksheet/solution exports.

The one-time `lima-math-divisibility-split-v1` migration moves the relevant stored
blocks and exercises to the new lesson, preserving teacher edits. Conflicting
copies in an existing target are preserved in both lessons. If capacity prevents
the move, the source stays intact. The earlier common-factor migration runs before
the split for existing libraries.

Teaching references (consulted 2026-09-21; examples are independently authored):

- https://hoc24.vn/ly-thuyet/bai-11-uoc-chung-uoc-chung-lon-nhat.85320
- https://olm.vn/chu-de/boi-chung-va-boi-chung-nho-nhat-3781020575

### Grade 6 fraction sequence

Five additional lessons in `fraction-lessons.ts` cover foundations and reduction,
common denominators and comparison, subtraction, multiplication/division, and the
two basic fraction word-problem types. Each has 4 regular exercises, 20 extra
exercises, worked examples and an explicit PDF knowledge summary. The existing
addition lesson remains independent. The one-time `lima-math-fraction-lessons-v1`
migration adds missing lessons without replacing existing teacher edits.

### Grade 4 versus Grade 6 fraction scope

Five Grade 4 lessons in `primary-fraction-lessons.ts` cover introduction/reduction,
common denominators/comparison, addition/subtraction, multiplication/division, and
finding a fraction of a known quantity. Each has 20 extra exercises. Addition,
subtraction and common-denominator comparisons use equal denominators or one
that divides the other; subtraction stays nonnegative. Grade 4 does not require
negative integers, GCD or LCM, or finding the whole from a known fraction.

Grade 6 titles and introductions distinguish review from extension to signed
fractions and finding an original quantity. The earlier addition lesson remains
at Grade 6 as review and practice with arbitrary denominators.
`lima-math-fraction-levels-v1` adds the Grade 4 lessons and updates only exact
original Grade 6 wording; custom edits and existing lessons are retained.

Scope reference: Ministry of Education and Training mathematics curriculum,
Grade 4 and Grade 6 sections, PDF pages 116–117 and 124 in the reproduced document:
https://static3.luatvietnam.vn/genfile/contentmix/2018/12/26/noi-dung-mix-thong-tu-so-32-2018-tt-bgddt-110829.pdf

### Consolidated Grade 6 fraction library

The visible built-in Grade 6 fraction library now contains exactly three lessons:
Cộng trừ phân số; Nhân chia phân số; Hai bài toán cơ bản về phân số.
`fraction-consolidation.ts` combines introduction, reduction, comparison, addition
and subtraction content under the original addition ID. All 98 exercises (80
extra) are retained. Duplicate stock prerequisite/guided blocks are omitted;
teacher-edited blocks, exercises and summaries are retained. The applications
lesson is unchanged. The one-time `lima-math-fraction-consolidation-v1` migration
runs after older migrations. If customized content exceeds model limits, source
lessons remain intact instead of losing content. Legacy sample data remains
available for identifying edits and upgrading older libraries.

### Comparing and ordering mixed number formats (Grade 6)

`fraction-order-lesson.ts` adds **So sánh và sắp xếp các số** under Phân số mở rộng.
It combines fractions, integers, positive mixed numbers and finite decimals,
including negative integers/fractions/decimals. It includes 4 regular questions
and 20 extra questions: 10 comparisons, 4 ascending sequences, 4 descending
sequences and 2 minimum-selection questions. Sequence answers retain the original
number formats, with one correct multiple-choice ordering. Equivalent forms and
the danger of rounding before comparison are explicitly covered.

`lima-math-fraction-order-v1` adds the lesson once without overwriting saved edits.
It does not participate in the older three-lesson consolidation.

Research reference (consulted 2026-09-22): Mathematics curriculum, Grade 6 fraction
and decimal requirements, PDF pages 124–125. This lesson combines those skills;
it does not claim to be a verbatim textbook lesson.
https://static3.luatvietnam.vn/genfile/contentmix/2018/12/26/noi-dung-mix-thong-tu-so-32-2018-tt-bgddt-110829.pdf

### Grade 7 number line

`number-line-lesson.ts` adds **Biểu diễn số trên trục số** under Số hữu tỉ, with
6 SVG number-line examples, 4 regular exercises and 20 extra exercises (including
one self-assessed drawing task). Online diagrams are editable using the new
`number-line` block visual. Its values are `[left, right, divisionsPerUnit, point]`:
integer endpoints include zero; 1–12 subdivisions per unit; at most 60 intervals;
the marked point must lie on a subdivision within the range. PDF practice uses
self-contained textual instructions; the drawing task is completed on paper.
The `lima-math-number-line-v1` migration adds the lesson once and preserves edits.

Solution PDFs now include vector number lines for exercises 16–20: reflection
through zero, leftmost/rightmost values, common subdivisions, and plotting a set
of numbers. Text explanations stay visible above each diagram. Tick spacing is
uniform, fraction/mixed-number labels retain their written form, and the selected
answer has a double-ring point so it remains identifiable in black-and-white.
All numeric labels sit below the axis. Point names such as A and A′ sit above,
centered on the same x-coordinate as their point and value; they are not printed
as `A = value`. A plotted integer replaces the corresponding ordinary tick label
so values such as -1 and 0 appear only once. Tick and point labels share collision
layout, with close numeric labels staggered only below the axis.
Diagrams are never printed in the worksheet. The exporter reserves room for the
question, explanation and diagram together when they fit on a page.

The optional exercise field `solutionNumberLine` is reusable in JSON/Excel packs:
`{ min: -2, max: 2, divisions: 2, points: [{ value: "-3/2", name: "A" },
{ value: "3/2", name: "A′", emphasis: true }], caption: "..." }`.
Point values may be integers, finite decimals, fractions or mixed numbers. The
validated range includes zero, has integer endpoints, 1–12 divisions per unit,
at most 60 intervals and 1–12 distinct points on ticks. Labels are positioned
from their numeric value, not a separate coordinate that could disagree.
Closely spaced labels use separate rows with leader lines. The field survives
JSON, Excel and sharing; `null` explicitly disables the diagram. Existing saved
copies without this field receive defaults only when their ID, prompt, answer,
options and solution still match the built-in exercise, without changing storage.
No diagram is guessed from question phrases or applied to edited questions.

Reference: OLM Grade 7, Biểu diễn số hữu tỉ trên trục số (reviewed 2026-09-22):
https://olm.vn/chu-de/bieu-dien-so-huu-ti-tren-truc-so-1487903

### Grade 3: addition and subtraction components

The default multiplication sample `math-arithmetic-3` is replaced by
`math-add-subtract-components-3` (Tìm thành phần trong phép cộng, phép trừ).
It includes missing addends, minuends and subtrahends, checking by substitution,
and 24 exercises (20 extra practice). Content uses whole numbers within 1,000.
Reference: [Toán 3 Kết nối tri thức teacher training material](https://api.iseebooks.vn/upload/Tap%20huan/Bo%20ket%20noi/Lop%203/Toan/SGV3.pdf).
The one-time browser migration replaces only the old sample ID; other lessons
and any existing edited copy of the new lesson are preserved.

### Semester placement

Lesson metadata has an optional `semester` field (`"1"` or `"2"`). Missing or
blank values mean **Chưa phân loại**, so older libraries require no migration.
Edit **Lớp** and **Học kỳ** under lesson information. Placement changes retain
lesson and exercise IDs, preserving progress. Library filters combine grade,
semester, topic and search; changing grade or semester clears the topic filter
and updates its options. JSON, shared lessons and Excel preserve semester;
PDFs include it when assigned. Existing shared links remain snapshots of the
lesson at the time they were created, so share again to distribute a new placement.

Grade 3 extra practice now replaces the two former challenge questions with
addition and subtraction component tables at positions 13 and 14, before the
word problems. Each table has five independent calculations with one `?` per
column. Tables are written exercises: learners record answers and compare with
the filled solution table. `table.rows` and `table.solution` round trip through
JSON, sharing and Excel; both can be edited in the exercise editor (one row per
line, cells separated by `|`). PDFs keep each table together and omit extra
writing lines for these fill-in exercises. A one-time upgrade removes only the
two specified exercise IDs and preserves existing table edits and other content.
Reference: Toán 3 Kết nối tri thức, Bài 3, “Tìm thành phần trong phép cộng,
phép trừ” (pages 11–13); new table values are independently authored.

### Grade 3, semester 1: multiplication and division components

`math-multiply-divide-components-3` adds **Tìm thành phần trong phép nhân,
phép chia** next to the addition/subtraction lesson. It covers missing factors,
dividends and divisors with exact division, worked examples and substitution
checks. There are 4 lesson exercises and 20 extra exercises: 12 short questions,
2 component tables, then 6 word problems. It uses multiplication tables up to 9,
includes a zero product with a nonzero known factor, and avoids division by zero
or indeterminate missing divisors. A one-time library update adds the lesson
without replacing existing copies or their edits.

### Grade 3, semester 1: Một phần mấy

`math-unit-fractions-3` introduces 1/2 through 1/9 as one of equal parts of a
shape, and 1/2 through 1/5 of equal groups of objects. Source: Toán 3 Kết nối
tri thức teacher guide, Bài 14 (tập 1):
https://api.iseebooks.vn/upload/Tap%20huan/Bo%20ket%20noi/Lop%203/Toan/TLGV.pdf.
The 22 exercises include reading/writing, recognizing equal parts and grouping.
The two former drawing exercises are removed from defaults and saved libraries. No fraction arithmetic is introduced. The new
`unit-fraction` block visual uses `[parts, objectsPerGroup]`: 2–9 equal parts,
0 for a shaded strip or 1–9 dots per group. It is editable and survives all
lesson import/export formats. Existing libraries receive the lesson once;
existing edited copies are preserved. PDF exercises are self-contained text
and drawing tasks; the online teaching illustrations remain in lesson blocks.

### Grade 3, semester 1: measurement units

`math-measurement-units-3` adds **Một số đơn vị đo độ dài, khối lượng, dung tích**,
covering mm, g and ml with explicit connections to cm, dm, m, km, kg and l.
Source: [OLM Toán 3, Chủ đề 5, Bài 30–32](https://olm.vn/bg/toan-3), aligned to
Kết nối tri thức tập 1. The authored lesson has 10 teaching blocks and 24
exercises (4 lesson checks plus 20 extra questions), including unit selection,
conversion, comparison and varied word problems. It avoids decimals and
conversions between unlike quantities. A one-time migration adds it without
replacing an existing edited copy. A separate one-time migration removes the
two requested drawing exercise IDs from saved copies of Một phần mấy.

The measurement lesson now focuses on direct practice: 8 fill-in equalities,
12 same-unit calculations (including left-to-right addition/subtraction), and
8 multiple-choice estimates, plus 4 lesson checks (32 exercises total).
Mixed-unit word problems are replaced. The one-time revision keeps lesson
identity, grade/semester placement and custom exercise IDs; new built-in
exercise IDs avoid inheriting results from replaced questions.

The measurement lesson additionally includes six word problems (two each for
mm, g and ml), appended after the direct practice: 34 extra exercises and 38
overall. Worked answers explicitly include “Bài giải”, a calculation with units
and “Đáp số”; PDF layout recognizes these as structured word-problem solutions.
A one-time migration appends missing questions without overwriting edited copies.

### Grade 3, semester 1: points and midpoints

`math-midpoint-3` adds **Điểm ở giữa, trung điểm của đoạn thẳng** with 10 teaching
blocks and 24 exercises (20 extra), including six word problems with worked
solutions and final answers. It explicitly distinguishes collinearity,
betweenness and equal halves; equal distance alone is insufficient.
Reference: [OLM, Điểm ở giữa. Trung điểm của đoạn thẳng](https://olm.vn/chu-de/diem-o-giua-trung-diem-cua-doan-thang-2061561479), Toán 3 Kết nối tri thức Bài 16.

Segment diagrams use four values: left/right relative lengths (1–20), whether
M is off AB (0/1), and whether to show lengths in cm (0/1). Off-line diagrams
cannot display length labels. They are supported in teaching blocks and optional
exercise `segment` metadata, with validation, editor controls, JSON/Excel/share
round trips and worksheet/answer PDF drawing. Displayed diagrams are illustrative,
not physical rulers; questions use supplied lengths. A one-time library update
adds the lesson while preserving existing edited copies.
