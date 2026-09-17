import { read, utils } from 'xlsx';
import {
  Kind,
  Lesson,
  LessonNotes,
  NOTE_LABELS,
  parseLessonPack,
  uid,
} from './lessons';

const types: Record<string, Kind> = {
  'Listen and write': 'dictation',
  'Listen and repeat': 'repeat',
  'Arrange words': 'word-order',
  'Fill in the blank': 'gap-fill',
  'Fix the sentence': 'correction',
  'Read and answer': 'comprehension',
  'Read aloud': 'read-aloud',
};

/** One worksheet per lesson. IDs and routine exercise instructions are app-owned. */
export function importLessonWorkbook(data: ArrayBuffer): Lesson[] {
  const book = read(data, { type: 'array', sheetRows: 1001 });
  const lessons: Lesson[] = [];
  for (const name of book.SheetNames) {
    if (name === 'Guide') continue;
    const sheet = book.Sheets[name];
    if (!sheet['!ref']) continue;
    const bounds = utils.decode_range(sheet['!fullref'] || sheet['!ref']);
    if (bounds.e.r > 999 || bounds.e.c > 5)
      throw new Error(
        `${name}: use the template columns and at most 1,000 rows.`
      );
    const rows = utils
      .sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        blankrows: true,
        range: 0,
      })
      .map((row) =>
        Array.from({ length: 6 }, (_, i) => String(row[i] ?? '').trim())
      );
    if (rows.every((row) => row.every((value) => !value))) continue;
    if (rows[0]?.[0] !== 'LIMA English lesson')
      throw new Error(`${name}: use a lesson tab from the Excel template.`);
    const fail = (row: number, message: string): never => {
      throw new Error(`${name}, row ${row + 1}: ${message}`);
    };
    const vocabularyStart = rows.findIndex(
      (row) => row[0] === 'Word' && row[1] === 'Meaning'
    );
    const activitiesStart = rows.findIndex(
      (row) => row[0] === 'Activity' && row[1] === 'Content'
    );
    if (vocabularyStart < 1 || activitiesStart <= vocabularyStart)
      throw new Error(
        `${name}: keep the Word / Meaning and Activity / Content headers.`
      );
    const metadata = (label: string, fallback = '') =>
      rows.slice(1, vocabularyStart).find((row) => row[0] === label)?.[1] ||
      fallback;
    const lesson: Lesson = {
      id: uid(),
      title: metadata('Lesson title'),
      topic: metadata('Topic', 'General English'),
      level: metadata('Level', 'A1'),
      goal: metadata('Goal', 'Practice English through this lesson.'),
      vocabulary: [],
      activities: [],
    };
    const templateVersion = metadata('Template version', '1');
    if (!['1', '2'].includes(templateVersion))
      throw new Error(`${name}: unsupported template version.`);
    if (metadata('Teacher notes'))
      lesson.teacherNotes = metadata('Teacher notes');
    if (metadata('Personal challenge'))
      lesson.challenge = metadata('Personal challenge');
    if (
      rows[activitiesStart][5] &&
      rows[activitiesStart][5] !== 'Practice section'
    )
      fail(activitiesStart, 'the sixth column must be Practice section.');
    if (
      rows.some(
        (row, i) =>
          i !== activitiesStart &&
          row[5] &&
          (i < activitiesStart ||
            rows[activitiesStart][5] !== 'Practice section')
      )
    )
      throw new Error(
        `${name}: unexpected content outside the template columns.`
      );
    const notes: LessonNotes = {};
    for (const key of Object.keys(NOTE_LABELS) as (keyof LessonNotes)[]) {
      const value = metadata(NOTE_LABELS[key]);
      if (value) notes[key] = value;
    }
    if (Object.keys(notes).length) lesson.notes = notes;
    for (let i = vocabularyStart + 1; i < activitiesStart; i++) {
      const [word, meaning, example, extra, extra2] = rows[i];
      if (rows[i].every((value) => !value)) continue;
      if (!word || !meaning)
        fail(i, 'enter both a word and its meaning, or clear the row.');
      if (extra || extra2)
        fail(i, 'vocabulary uses only Word, Meaning and Example.');
      lesson.vocabulary.push({ word, meaning, example });
    }
    for (let i = activitiesStart + 1; i < rows.length; i++) {
      const [label, content, instruction, answer, explanation, section] =
        rows[i];
      if (rows[i].every((value) => !value)) continue;
      const kind = types[label];
      if (!kind) fail(i, 'choose an activity from the dropdown.');
      if (!content) fail(i, 'enter the sentence or passage in Content.');
      if (section && !['Core', 'Extra'].includes(section))
        fail(i, 'choose Core or Extra in Practice section.');
      const audio = ['dictation', 'repeat', 'read-aloud'].includes(kind);
      if (['gap-fill', 'correction', 'comprehension'].includes(kind) && !answer)
        fail(i, 'enter at least one correct answer.');
      if (kind === 'comprehension' && !instruction)
        fail(i, 'enter a question about the passage.');
      const defaults: Record<Kind, string> = {
        dictation: 'Listen, then write what you hear.',
        repeat: 'Listen to the model, then repeat the sentence.',
        'word-order': 'Arrange the words to make a sentence.',
        'gap-fill': `Fill in the blank: ${content}`,
        correction: `Correct this sentence: ${content}`,
        comprehension: instruction,
        'read-aloud': 'Read the passage aloud.',
      };
      lesson.activities.push({
        id: uid(),
        kind,
        prompt: instruction
          ? ['gap-fill', 'correction'].includes(kind)
            ? `${instruction}\n${content}`
            : instruction
          : defaults[kind],
        text: audio || kind === 'comprehension' ? content : '',
        answers: answer
          ? answer
              .split(/\r?\n/)
              .map((a) => a.trim())
              .filter(Boolean)
          : [content],
        explanation,
        ...(section === 'Extra' ? { tier: 'extra' as const } : {}),
      });
      // Validate each exercise early so errors identify the spreadsheet row.
      try {
        parseLessonPack({
          version: Number(templateVersion),
          lessons: [{ ...lesson, activities: [lesson.activities.at(-1)] }],
        });
      } catch (error) {
        fail(i, error instanceof Error ? error.message : 'Invalid activity.');
      }
    }
    try {
      lessons.push(
        parseLessonPack({ version: Number(templateVersion), lessons: [lesson] })
          .lessons[0]
      );
    } catch (error) {
      throw new Error(
        `${name}: ${error instanceof Error ? error.message : 'Invalid lesson.'}`
      );
    }
  }
  return parseLessonPack({ version: 2, lessons }).lessons;
}
