import * as XLSX from 'xlsx';
import { MathLessonData, packLessons, parseMathPack } from './lessons';
import { withKnowledgeSummary } from './knowledge-summary';
export function exportMathWorkbook(lessons: MathLessonData[]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      lessons
        .map(withKnowledgeSummary)
        .map(({ blocks, exercises, ...lesson }) => {
          void blocks;
          void exercises;
          return lesson;
        })
    ),
    'Lessons'
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      lessons.flatMap((l) =>
        l.blocks.map((b) => ({
          lessonId: l.id,
          ...b,
          values: JSON.stringify(b.values),
        }))
      )
    ),
    'Blocks'
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      lessons.flatMap((l) =>
        l.exercises.map((e) => ({
          lessonId: l.id,
          ...e,
          segment: e.segment ? JSON.stringify(e.segment) : undefined,
          table: e.table ? JSON.stringify(e.table) : undefined,
          options: JSON.stringify(e.options),
          mistakes: JSON.stringify(e.mistakes),
          criteria: e.criteria ? JSON.stringify(e.criteria) : undefined,
          solutionNumberLine:
            e.solutionNumberLine !== undefined
              ? JSON.stringify(e.solutionNumberLine)
              : undefined,
        }))
      )
    ),
    'Exercises'
  );
  XLSX.writeFile(book, 'lima-math-lessons.xlsx');
}
export function importMathWorkbook(data: ArrayBuffer) {
  const book = XLSX.read(data, { type: 'array', sheetRows: 10002 });
  for (const name of ['Lessons', 'Blocks', 'Exercises'])
    if (!book.Sheets[name])
      throw new Error(`Thiếu trang tính ${name}. Hãy dùng mẫu Excel đã xuất.`);
  const rows = (name: string) =>
    XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[name], {
      defval: '',
      raw: false,
    });
  const lessons = rows('Lessons'),
    blocks = rows('Blocks'),
    exercises = rows('Exercises');
  if (lessons.length > 100 || blocks.length > 5000 || exercises.length > 10000)
    throw new Error('Tệp Excel có quá nhiều dòng.');
  const ids = new Set(lessons.map((l) => String(l.id)));
  if ([...blocks, ...exercises].some((r) => !ids.has(String(r.lessonId))))
    throw new Error('Có dòng tham chiếu lessonId không tồn tại.');
  const json = (value: unknown, fallback: string) =>
    JSON.parse(String(value || fallback));
  return parseMathPack(
    packLessons(
      lessons.map((l) => ({
        ...l,
        grade: Number(l.grade),
        semester: l.semester || undefined,
        blocks: blocks
          .filter((b) => b.lessonId === l.id)
          .map((b) => ({ ...b, values: json(b.values, '[]') })),
        exercises: exercises
          .filter((e) => e.lessonId === l.id)
          .map((e) => {
            if (
              !['TRUE', 'FALSE', 'true', 'false'].includes(String(e.simplified))
            )
              throw new Error('simplified cần TRUE hoặc FALSE.');
            return {
              ...e,
              segment: e.segment ? json(e.segment, '[]') : undefined,
          table: e.table ? json(e.table, 'null') : undefined,
              group: e.group || undefined,
              skill: e.skill || undefined,
              inputInstruction: e.inputInstruction || undefined,
              solutionStyle: e.solutionStyle || undefined,
              difficulty: e.difficulty || undefined,
              workspace: e.workspace || undefined,
              criteria: e.criteria ? json(e.criteria, '[]') : undefined,
              solutionNumberLine: e.solutionNumberLine
                ? json(e.solutionNumberLine, 'null')
                : undefined,
              tolerance: Number(e.tolerance),
              simplified: String(e.simplified).toLowerCase() === 'true',
              answer: String(e.answer),
              options: json(e.options, '[]'),
              mistakes: json(e.mistakes, '[]'),
            };
          }),
      })) as MathLessonData[]
    )
  );
}
