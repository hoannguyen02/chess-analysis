# Math Practice

- `/math-practice`: browser-local lesson library, editor, learner preview, practice, import/export, sharing.
- `/math-practice/learn#lesson=…`: standalone student snapshot; no account required.
- `/math-practice/learn`: received lesson history in this browser.

Four original examples are added only when no saved library exists: Grade 3 multiplication, Grade 4 rectangles, Grade 6 fractions, Grade 8 equations. An intentionally empty library stays empty.

## Authoring

A lesson contains metadata, ordered teaching blocks, and exercises. The five stages are `foundation`, `explore`, `example`, `guided`, and `practice`. Blocks support text, two fraction bars, and a labelled rectangle (dimensions in cm, illustration not to scale). Example blocks reveal one step at a time. Exercises support numbers (optional unit/tolerance), fractions (equivalent or simplest form), and choices. Hints, solutions, and common mistakes are editable.

Exercise `prompt` contains only the question, including any mathematical requirements such as simplifying a fraction. Put web answer-entry guidance in the optional `inputInstruction` field (up to 1,000 characters), exposed in the editor as **Hướng dẫn nhập đáp án (chỉ hiện trên web)**. The learner sees it beside the answer controls; neither PDF variant renders this field. Guidance can use any wording without changes to the PDF exporter. JSON, Excel and shared links preserve it.

Old built-in examples with combined question/guidance text are upgraded at the data-loading boundary using exact historical records from `exercise-content.ts`. This covers local libraries, old imports, duplicate copies and shared links, is idempotent and preserves custom wording. `lima-math-input-instructions-v1` records the local library upgrade. There is no phrase blacklist or sentence-removal rule in PDF rendering. Custom legacy questions can be split into the two editor fields; arbitrary prose is never silently classified or deleted. As with other learner-content edits, upgraded content follows the existing progress-fingerprint reset behavior.

Write `1/2` or `(1 × 3)/(2 × 3)` in lesson text; the student renderer shows stacked fractions. This renderer is for fractions, not arbitrary LaTeX or symbolic algebra. Equation exercises currently ask for a numeric solution. There is no automatic proof grading.

Save is explicit. Preview returns to the draft. Duplication gets new identifiers. Deletion has confirmation and one-level undo. Existing shared copies are independent of edits/deletion.

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

Teachers can add, reorder, edit or remove extra questions. Optional fields: `group` (foundation/skills/application/challenge), `skill`, `difficulty` (easy/medium/hard), `workspace` (small/medium/large). `written` questions are supported only in extra practice and require a model `solution` and `criteria` array; they are explicitly self-assessed, never automatically marked correct. Excel `criteria` cells contain JSON arrays. Existing packs without extra questions remain valid.

Extra progress uses `lima-math-extra-v1:<lessonId>` and an exact question-content fingerprint. Preview never writes progress. PDF worksheet and solutions use the same ordered questions; worksheets omit solutions and provide working space only for non-choice questions. Multiple-choice questions have no ruled lines or reserved writing space, regardless of any saved `workspace` value; the editor hides that setting for choices. Export runs locally in the browser and embeds the bundled licensed DejaVu Sans font, supporting Vietnamese and stacked fractions. No external PDF service or dependency is required. Unsupported font characters return an actionable export error. Teacher notes are omitted from both PDFs. PDFs are A4; there is no symbolic algebra or proof autograder.

Both worksheet and solutions PDFs omit the practice-group headings (Củng cố kiến thức, Luyện kỹ năng, Vận dụng, Thử thách) and their reserved height. Question order and numbering are unchanged. Saved groups and browser practice remain intact; the worksheet's separate Kiến thức cần nhớ summary is also preserved.

Solutions PDFs present supported Vietnamese word problems under a centered `Bài giải:` heading on its own line. Explanatory sentences and calculations are centered; `Đáp số: ...` starts on the next row beneath the midpoint of the final calculation, while question prompts stay left-aligned. Single-step examples retain the three body lines: `An được số điểm là:` / `4 × 5 + 3 × (-2) = 14 (điểm)` / `Đáp số: 14 điểm`. Authored multi-step solutions ending with an explicit `Đáp số:` retain every explanation and calculation, including prose containing an equation. The question and solution stay together when they fit on a page. Longer solutions wrap within the margins and keep the heading with the first step, explanation/calculation pairs together, and the answer with the final calculation where possible. Decimals in generated solutions use a comma, with parentheses around the unit only on the calculation line.

The left edge of `Đáp số` is anchored halfway across the preceding calculation's last rendered line, not at its right end or the page margin. Since calculations are centered, this midpoint stays consistent for stacked fractions and wrapped lines. The answer remains on its own row and extends to the right; it shifts left only enough to avoid the right margin when necessary. Answers wider than the available page content wrap at the page margins.

The heading and statement/calculation/answer sequence follow the worked examples in [Trường Tiểu học Lê Quý Đôn's teaching guide](https://c1lequydon-cubao.daklak.edu.vn/ren-luyen-ki-nang-giai-toan-co-loi-van-cho-hoc-sinh-lop-3.html). The exact left/center/right alignment follows the requested LIMA worksheet style, rather than claiming a universal textbook requirement. Choice explanations, pure calculations and unrecognized solution structures keep their existing presentation.

The formatter recognizes a single `bao nhiêu` question and a numeric equality chain whose final value matches the exercise answer. It preserves authored explanations, separate calculations, algebra, multiple questions and unrecognized formats. This is a PDF presentation change; saved lesson content and browser feedback retain their full working.

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
