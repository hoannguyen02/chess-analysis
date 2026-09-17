# LIMA English

Open `/english-practice` (or `/vi/english-practice`). The desktop and mobile menus include English Practice / Luyện tiếng Anh. The interface supports English and Vietnamese; lesson content stays in its authored language.

## Available workflows

- Create, edit, reorder activities, duplicate, preview, search, and delete lessons.
- Import version 1 or 2 JSON lesson packs. Review each lesson and choose **Add as new lesson** or an existing lesson to update before confirming. Matching IDs, or a unique title/topic/level match, suggest an update; the preview makes the choice explicit.
- Import multiple lessons from one Excel workbook (`.xlsx` or `.xls`, under 2 MB) through **Import lessons**. Download **Excel template** in the library. Each worksheet is a complete lesson; duplicate a tab to add another. The Guide tab is ignored. The system generates lesson/activity IDs, standard instructions, and answers for model-sentence exercises. Review all lessons before confirming. Updating preserves the lesson identity, increments its revision, and retains activity IDs and progress for unchanged exercises, including reordered exercises. Changed exercises receive new IDs. Adding creates independent identities. Two incoming lessons cannot update the same existing lesson in one import.
- The downloadable template begins with four Start here lessons (instructions, questions, asking for help, and using LIMA), followed by three short foundation lessons (alphabet and spelling, numbers, months and dates) followed by seven Week 1 lessons: greetings, age and information, home, likes, questions, mini conversations, and review. It contains 260 vocabulary entries with Vietnamese meanings and 565 activities. Core length follows lesson content: guided examples, retrieval for every vocabulary entry, application exercises, and four fresh understanding checks. Each lesson also has three extra examples. Practise in rounds of 5–7 activities over multiple sessions. Every lesson covers its vocabulary and main patterns in core practice; additional examples are optional. Goals, personal speaking challenges, and teacher notes have separate fields. Challenges support recording and reflection without a percentage score. These lessons are only added when imported; the library still starts empty.
- Export all lessons or a single lesson from Preview. `examples/english-lessons.json` is an importable starter pack.
- Guided practice or one skill at a time: listening dictation; spoken repetition; word-order, vocabulary gaps, and grammar repair; reading comprehension and read-aloud.
- Review the latest attempts below 80%. Track word-match scores by skill, distinguishing hints/retries from unassisted answers. Edited activities no longer reuse scores from older content.

## Lesson notes

Lessons accept optional `notes`: `grammar`, `phrases`, `pronunciation`, `pronunciationModel`, `mistakes`, and `dialogue` (up to 4,000 characters each). Edit them under **Lesson notes (optional)**. All seven Week 1 template tabs include these fields before vocabulary. Older Excel/JSON lessons still import without notes. Notes survive export and sharing.

**Learn before you practise** shows expandable sections in preview, shared lesson landing, practice, and the teaching introduction. Pronunciation models and conversations have normal/slow playback using the selected voice. Practice displays notes without extra audio controls to avoid interfering with recordings. Use English-only pronunciation models and one speaker turn per line (`A:` / `B:`) for dialogue. Notes do not affect scores. Import the updated template to get the expanded content; existing lessons are not updated automatically.

Lesson packs export as version 2. Version 1 JSON and older five-column Excel templates remain supported. Legacy goals containing `Family challenge:` are split into goal and challenge during migration. Workbook version 2 adds **Practice section** (Core/Extra), **Personal challenge**, **Teacher notes**, and **Template version**; authors never enter IDs. Optional activity `tier` defaults to core; changing its tier does not reset its score. Teacher notes appear only in teacher views and backups and are omitted from shared snapshots.

## Audio and scoring

Model audio uses browser speech synthesis with an English voice and optional slower playback. Microphone recording uses MediaRecorder, is limited to 60 seconds, and releases tracks on stop/navigation. Recordings can be played back for the current activity; they are not stored in lessons, progress, or exported JSON.

Browser speech recognition is optional and feature-detected. The user explicitly enables transcription; the browser may send audio to its speech service and may require a network connection. Recording requires HTTPS or localhost and microphone permission. Unsupported browsers still offer recording/playback where available, but do not invent automatic speech scores.

Scores use word-level edit distance, normalized for case and punctuation, with the best match among curated accepted answers. Missing, added, and changed words are highlighted. A speech score is **transcript word match**, not pronunciation, fluency, accent, or a CEFR assessment. Free-form semantic grading and a dedicated pronunciation service are not implemented. No paid API or API key is required for this version.

## Storage and JSON

Lessons: `lima-english-lessons-v1`. Progress: `lima-english-progress-v1` (most recent 2,000 attempts). Both live in localStorage on the current browser/origin. Export lessons before clearing browser data. Progress can be exported separately; progress import and multi-device sync are not implemented.

Lesson pack shape:

```json
{
  "version": 2,
  "lessons": [
    {
      "id": "daily-life",
      "title": "My morning",
      "topic": "Daily routines",
      "level": "A1",
      "goal": "Describe a simple morning routine.",
      "vocabulary": [
        {
          "word": "breakfast",
          "meaning": "bữa sáng",
          "example": "I have breakfast at seven."
        }
      ],
      "activities": [
        {
          "id": "morning-listen",
          "kind": "dictation",
          "prompt": "Listen, then write what you hear.",
          "text": "I have breakfast at seven.",
          "answers": ["I have breakfast at seven."],
          "explanation": "Use at before a time."
        }
      ]
    }
  ]
}
```

Activity kinds: `dictation`, `repeat`, `word-order`, `gap-fill`, `correction`, `comprehension`, `read-aloud`. Skill is derived from kind. For dictation/repeat/read-aloud, an accepted answer must match the source text. Reading comprehension requires a passage, question, and accepted answers. Word-order uses the first accepted answer as the word bank (maximum 30 words).

Imports are capped at 2 MB, 100 lessons, 100 activities and 100 vocabulary entries per lesson, and 10 accepted answers per activity. All imported data is validated and copied into plain lesson fields, rendered as text. Lesson JSON contains no media or executable content.

## Verification

- `npm run test:english`: schema round-trips, malformed imports, edit-distance scoring, alternatives, duplicate words, progress validation, and content fingerprints.
- `npx tsc --noEmit`
- `npx eslint src/components/english src/lib/english src/pages/english-practice.tsx`

For manual checks: create and save a lesson; reload; export/import; finish a typed activity; check progress and mistake review; test microphone permission, optional transcription, recording playback, and leaving an active recording in each supported browser.

## Teaching together and family profiles

Use **Add learner** above the library to create up to 20 local profiles. Choose
**Practicing as** before starting a practice session. Lessons are shared, while
scores, reviews and progress exports belong to the selected learner. Existing
results appear under **Me**. Rename a profile without losing its history.
Profiles live in this browser; they are not separate accounts.

Choose **Teach together** on a lesson for a teacher-paced sequence: learning goal,
vocabulary, activities and a wrap-up. Play model audio, invite a learner to respond,
reveal model answers and accept alternatives during discussion. Teaching does not
write individual scores. Use normal Practice for scored attempts.

**Focus view** enlarges the teaching surface. **Clean view for video** hides teacher
controls and the learner selector, leaving lesson content and navigation for screen
recording. It does not record video itself. **Show teaching controls** restores the
controls; **Exit focus view** returns to the page. Left/right arrow keys navigate
when focus is outside form controls.

## Sharing a lesson

Choose **Share lesson**, then **Copy link**, and send the link to a learner.
**Preview learner page** opens the exact shared copy. The learner can practice
independently or use **Follow the teacher** to select a lesson step manually.
This does not synchronize with the teacher's screen.

Links carry a compressed, validated lesson snapshot in the URL fragment; there is
no hosted lesson database. Editing the draft does not change existing links.
Create and send a new link after updates. Anyone with a link can read its lesson
content, including model answers; links cannot be revoked. Family profiles,
scores and recordings are never included. This is a practice tool, not a secure
exam.

Learner results use a separate browser history, with up to 2,000 attempts, and are
not sent to the teacher. One shared device uses one shared-page learner history.
Sharing works from a deployed app address or a network address reachable by the
recipient; localhost links only work on the originating computer. The new route
must be deployed before links on the public site work.

The format is versioned gzip/base64url, with a 16,000-character token limit and
256 KB maximum decoded data. Oversized lessons must be split. Modern browsers
with CompressionStream/DecompressionStream are required. Some messaging tools
may truncate long links; always copy the entire link.

## Voice preferences

Use **Voice** and **Preview voice** to choose an English voice by its actual name
and accent. The list updates when the browser loads additional voices. No gender
or quality is inferred from a voice name. Availability depends on the device.

Each family profile saves its own choice for vocabulary, listening, repetition,
read-aloud models and teaching audio. Shared lesson pages save an independent
device preference, which is not included in lesson links. If a chosen voice is
missing, playback uses the default English voice, then an available English
voice. The picker explains when a saved voice is unavailable. Changing voices
stops current playback; it does not change the lesson or its scores.

## Shared lesson history

Successfully opened links automatically appear under **Shared lessons** at
/english-practice/learn. Local storage contains only share ID, title, relative
link and last-opened date, not a separate lesson object. The link itself still
contains the snapshot. Search by title, reopen a lesson, or remove a bookmark
with Undo. The latest 200 entries stay in this browser; nothing syncs to another
device. Failed links are not added, and storage errors do not block practice.

New links carry a unique share ID stored by the publisher against the lesson ID.
Sharing edits from that same browser retains the share ID; opening the updated
link replaces the bookmark and moves it to the top. Duplicating a lesson creates
a new identity. Clearing publisher storage or importing elsewhere creates a new
share identity. Old links without an ID deduplicate by a hash of their snapshot;
different old versions cannot be reliably associated with one teacher.

## Interface language

The main English page and shared learner pages offer English / Tiếng Việt and
use the same saved browser preference. The interface switches without reloading
the activity. Lesson titles, prompts, passages, answers and voice names remain as
authored; English audio is unchanged. Shared history leaves a 20px gap below search.

## Preparation and review

Optional lesson notes `beforeYouStart` and `quickCheck` appear in the editor, preview, practice, teaching introduction and shared learner pages. These are short self-check or teacher-led prompts, not scored prerequisites or completion locks. The Excel template includes **Before you start** and **Quick check** for every day. Existing files without these fields still work.

Choose an **Optional review lesson** from the library in the editor. The selection saves a portable shared snapshot (with teacher notes and further review links omitted), so learners can open it even in a different browser. It opens in a new tab to preserve the current practice session. Select the review lesson again after editing its source to refresh the snapshot. Authors do not need to enter IDs or URLs. Removing the review link does not remove the source lesson.

After importing, choose Foundation 1 as the optional review for Day 1 and Foundation 2 for Day 2. Foundation 3 provides calendar practice and can link to Foundation 2 for numbers. These review selections are made in the editor, so the workbook requires no IDs. The library remains unchanged until the import is confirmed.

Understanding checks are labelled in exercise instructions and ask learners to work without hints. This is author guidance, not a new app-enforced test mode or automatic mastery certification. Use the personal challenge to check independent use and revisit the material later.

The Start here lessons use bilingual English/Vietnamese goals and exercise prompts, with English-only spoken models. They include written demonstrations and guided practice; they do not add animated demos or a new example button to the app. A helper can read instructions aloud for children who cannot read yet. Recording is optional. Start here content is imported by the user, not automatically seeded into the library.
