# Math Practice

- `/math-practice`: browser-local lesson library, editor, learner preview, practice, import/export, sharing.
- `/math-practice/learn#lesson=…`: standalone student snapshot; no account required.
- `/math-practice/learn`: received lesson history in this browser.

Four original examples are added only when no saved library exists: Grade 3 multiplication, Grade 4 rectangles, Grade 6 fractions, Grade 8 equations. An intentionally empty library stays empty.

## Authoring

A lesson contains metadata, ordered teaching blocks, and exercises. The five stages are `foundation`, `explore`, `example`, `guided`, and `practice`. Blocks support text, two fraction bars, and a labelled rectangle (dimensions in cm, illustration not to scale). Example blocks reveal one step at a time. Exercises support numbers (optional unit/tolerance), fractions (equivalent or simplest form), and choices. Hints, solutions, and common mistakes are editable.

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

- `Lessons`: id, title, grade, topic, goal, textbook, teacherNotes.
- `Blocks`: lessonId, id, section, title, text, visual, values.
- `Exercises`: lessonId, id, section, kind, prompt, answer, options, unit, hint, solution, simplified, tolerance, mistakes.

`values`, `options`, and `mistakes` cells contain JSON arrays. `simplified` is TRUE/FALSE. Preserve IDs when updating; use review to choose add-as-copy instead. For fractions, use an Excel text cell for answers such as `1/2` to avoid date conversion. Each block/exercise must reference a lesson in `Lessons`. Math and English packs are deliberately distinct.

## Checks

`npm run test:math` tests examples, grading, validation, import updates/copies, bounded share decoding, private-note exclusion, and Excel round trips. `npm run build` includes TypeScript validation and both routes.

## Extra practice

The optional `extra` exercise section adds one-question-at-a-time practice, navigation, local progress, a summary, and retry of unanswered/assisted questions. The fractions sample contains 20 questions (4 foundations, 8 skills, 6 applications, 2 challenges). Existing libraries receive the section directly through a one-time migration (`lima-math-extra-migration-v1`). It appends the exercises to the original Grade 6 fraction lesson, preserving teacher content. Existing extra sets and deleted lessons are left alone. No sample import is needed.

Teachers can add, reorder, edit or remove extra questions. Optional fields: `group` (foundation/skills/application/challenge), `skill`, `difficulty` (easy/medium/hard), `workspace` (small/medium/large). `written` questions are supported only in extra practice and require a model `solution` and `criteria` array; they are explicitly self-assessed, never automatically marked correct. Excel `criteria` cells contain JSON arrays. Existing packs without extra questions remain valid.

Extra progress uses `lima-math-extra-v1:<lessonId>` and an exact question-content fingerprint. Preview never writes progress. PDF worksheet and solutions use the same ordered questions; worksheets omit solutions and provide working space. Export runs locally in the browser and embeds the bundled licensed DejaVu Sans font, supporting Vietnamese and stacked fractions. No external PDF service or dependency is required. Unsupported font characters return an actionable export error. Teacher notes are omitted from both PDFs. PDFs are A4; there is no symbolic algebra or proof autograder.

`MATH_PDF_QA_DIR=/tmp/math-pdf npm run test:math` also writes representative worksheet and solution PDFs for rendering checks.

## Shared brand

`Brand.tsx` provides the responsive LIMA Chess symbol and wordmark. `_app.tsx` renders the main navigation for translated pages and a compact brand header for standalone/shared pages. `Layout.tsx` only handles page content, preventing duplicate headers.

The original `public/images/Logo_LIMA.svg` is the artwork source. Run `python3 scripts/build-brand.py` after updating it to generate the clean website SVG (`public/brand/lima-symbol.svg`) and matching PDF vector commands (`src/lib/brand/logo.ts`). The generator supports the source artwork's absolute M/L/C/Z paths, rectangles, and affine transforms. PDFs embed those vector commands directly: no image downloads or raster scaling, navy wordmark for print, larger first-page branding and compact subsequent headers. PDF headers pair the logo with LIMA Math; the footer credits “A learning resource by LIMA Chess”.

## Quick editing while viewing a lesson

Owned library lessons have **Sửa nhanh** beside metadata, each teaching block, and each question (including extra practice), plus a full-lesson shortcut. A modal drawer reuses the validated lesson editor, initially focused on the selected item, with an option to open all fields. Save persists the lesson and keeps the current lesson section; Undo restores the previous saved snapshot for the current visit. Invalid content or storage failure retains the draft. Cancel/Escape warns before discarding edits. Shared student lessons and learner previews have no edit controls. Existing share links remain independent; share again after editing. Content changes follow the existing progress fingerprint reset rules.
