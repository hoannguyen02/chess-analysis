import { migrateLegacyExerciseContent } from './exercise-content';
import { parseSegment } from './segment';
import {
  parseSolutionNumberLine,
  SolutionNumberLine,
} from './solution-number-line';

export type MathSection =
  | 'foundation'
  | 'explore'
  | 'example'
  | 'guided'
  | 'practice'
  | 'extra';
export const SECTION_LABELS: Record<MathSection, string> = {
  foundation: 'Kiểm tra nền tảng',
  explore: 'Khám phá',
  example: 'Ví dụ từng bước',
  guided: 'Em thử làm',
  practice: 'Tự kiểm tra',
  extra: 'Luyện tập thêm',
};
export const TOPICS = [
  'Số học',
  'Số tự nhiên',
  'Số nguyên',
  'Phân số',
  'Phân số mở rộng',
  'Số hữu tỉ',
  'Đại số',
  'Hình học',
  'Đo lường',
  'Hàm số',
  'Thống kê',
  'Xác suất',
];
export type MathBlock = {
  id: string;
  section: MathSection;
  title: string;
  text: string;
  visual:
    | 'none'
    | 'fractions'
    | 'rectangle'
    | 'number-line'
    | 'unit-fraction'
    | 'segment';
  values: number[];
  segmentLabels?: [string, string, string];
};
export type MathExercise = {
  id: string;
  section: 'foundation' | 'guided' | 'practice' | 'extra';
  kind: 'number' | 'fraction' | 'choice' | 'written';
  group?: 'foundation' | 'skills' | 'application' | 'challenge';
  skill?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  workspace?: 'small' | 'medium' | 'large';
  criteria?: string[];
  prompt: string;
  inputInstruction?: string;
  answer: string;
  options: string[];
  unit: string;
  hint: string;
  solution: string;
  segment?: number[];
  segmentLabels?: [string, string, string];
  solutionStyle?: 'method' | 'explanation' | 'answer-only';
  solutionNumberLine?: SolutionNumberLine | null;
  table?: { rows: string[][]; solution: string[][] };
  simplified: boolean;
  tolerance: number;
  mistakes: { answer: string; feedback: string }[];
};
export type MathLessonData = {
  id: string;
  title: string;
  grade: number;
  semester?: '1' | '2';
  topic: string;
  goal: string;
  textbook: string;
  teacherNotes: string;
  knowledgeSummary?: string;
  blocks: MathBlock[];
  exercises: MathExercise[];
};
export type MathPack = {
  version: 1;
  subject: 'math';
  lessons: MathLessonData[];
};
export const uid = () => crypto.randomUUID();
export const packLessons = (lessons: MathLessonData[]): MathPack => ({
  version: 1,
  subject: 'math',
  lessons,
});
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Dữ liệu không hợp lệ.');
  return value as Record<string, unknown>;
};
const text = (
  value: unknown,
  name: string,
  max = 4000,
  required = false
): string => {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error(
      `${name}: cần văn bản${required ? ' không rỗng' : ''}, tối đa ${max} ký tự.`
    );
  return value;
};
const list = (value: unknown, max: number): unknown[] => {
  if (!Array.isArray(value) || value.length > max)
    throw new Error(`Danh sách phải có tối đa ${max} mục.`);
  return value;
};
const finite = (value: unknown, min: number, max: number): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error(`Số phải nằm trong khoảng ${min}–${max}.`);
  return value;
};
const idText = (value: unknown) => {
  const result = text(value, 'ID', 100, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(result) || result in Object.prototype)
    throw new Error('ID chỉ gồm chữ, số, dấu gạch ngang và gạch dưới.');
  return result;
};
const unique = (items: { id: string }[]) => {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('Có ID trùng lặp.');
};
const segmentLabels = (value: unknown): [string, string, string] => {
  const labels = list(value, 3).map((label) =>
    text(label, 'Nhãn điểm', 10, true)
  );
  if (labels.length !== 3 || new Set(labels).size !== 3)
    throw new Error('Hình đoạn thẳng cần ba nhãn điểm khác nhau.');
  return labels as [string, string, string];
};
export function fraction(value: string): [number, number] | null {
  const match = value.trim().match(/^(-?\d+)\s*\/\s*([1-9]\d*)$/);
  if (!match) return null;
  const n = Number(match[1]),
    d = Number(match[2]);
  return Math.abs(n) <= 100000 && d <= 100000 ? [n, d] : null;
}
export function numeric(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) && Math.abs(n) <= 1e12 ? n : null;
}
function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}
export function checkAnswer(
  exercise: MathExercise,
  answer: string,
  unit = ''
): { correct: boolean; message: string } {
  if (exercise.kind === 'written')
    return {
      correct: false,
      message:
        'Bài tự luận: đối chiếu lời giải mẫu và tự đánh giá theo tiêu chí.',
    };
  let correct = false;
  if (exercise.kind === 'fraction') {
    const actual = fraction(answer),
      expected = fraction(exercise.answer);
    if (!actual)
      return {
        correct: false,
        message:
          'Nhập tử số nguyên và mẫu số nguyên dương, có giá trị tuyệt đối không quá 100 000.',
      };
    correct = !!expected && actual[0] * expected[1] === expected[0] * actual[1];
    if (correct && exercise.simplified && gcd(...actual) !== 1)
      return {
        correct: false,
        message: 'Giá trị đúng rồi! Em hãy rút gọn phân số về dạng tối giản.',
      };
  } else if (exercise.kind === 'number') {
    const actual = numeric(answer),
      expected = numeric(exercise.answer);
    if (actual === null)
      return {
        correct: false,
        message:
          'Nhập một số hợp lệ. Có thể dùng dấu phẩy hoặc dấu chấm thập phân.',
      };
    correct =
      expected !== null &&
      Math.abs(actual - expected) <=
        exercise.tolerance +
          Number.EPSILON * Math.max(1, Math.abs(expected)) * 4;
  } else correct = answer === exercise.answer;
  if (
    correct &&
    exercise.unit &&
    unit.trim().toLowerCase().replace(/\s/g, '') !==
      exercise.unit.trim().toLowerCase().replace(/\s/g, '')
  )
    return {
      correct: false,
      message: `Số đúng rồi. Kiểm tra đơn vị: ${exercise.unit}.`,
    };
  return {
    correct,
    message: correct
      ? `Đúng rồi! ${exercise.solution}`
      : exercise.mistakes.find((m) => m.answer.trim() === answer.trim())
          ?.feedback ||
        'Em hãy kiểm tra lại cách làm. Nếu cần, nhấn “Gợi ý” để được hỗ trợ.',
  };
}
export function parseMathPack(value: unknown): MathPack {
  const root = record(value);
  if (root.version !== 1 || root.subject !== 'math')
    throw new Error(
      'Cần tệp bài học Toán phiên bản 1. Tệp Tiếng Anh không dùng cho mục này.'
    );
  const lessons = list(root.lessons, 100).map(
    (entry, index): MathLessonData => {
      try {
        const raw = record(entry);
        const grade = finite(raw.grade, 1, 12);
        if (!Number.isInteger(grade)) throw new Error('Lớp phải là số nguyên.');
        if (
          raw.semester !== undefined &&
          raw.semester !== '' &&
          raw.semester !== '1' &&
          raw.semester !== '2'
        )
          throw new Error('Học kỳ phải là 1, 2 hoặc để trống.');
        const blocks = list(raw.blocks, 50).map((entry): MathBlock => {
          const b = record(entry);
          if (
            b.section === 'extra' ||
            !Object.hasOwn(SECTION_LABELS, String(b.section))
          )
            throw new Error('Phần học không hợp lệ.');
          if (
            ![
              'none',
              'fractions',
              'rectangle',
              'number-line',
              'unit-fraction',
              'segment',
            ].includes(String(b.visual))
          )
            throw new Error('Hình minh họa không hợp lệ.');
          const values = list(b.values, 4).map((v) =>
            finite(v, b.visual === 'number-line' ? -1000 : 0, 1000)
          );
          if (
            b.visual === 'fractions' &&
            (values.length !== 4 ||
              values.some((v) => !Number.isInteger(v)) ||
              values[1] < 1 ||
              values[3] < 1 ||
              values[1] > 24 ||
              values[3] > 24 ||
              values[0] > values[1] ||
              values[2] > values[3])
          )
            throw new Error(
              'Thanh phân số cần 4 số: tử, mẫu, tử, mẫu; mẫu từ 1–24, tử không lớn hơn mẫu.'
            );
          if (b.visual === 'segment') parseSegment(values);
          if (
            b.visual === 'unit-fraction' &&
            (values.length !== 2 ||
              values.some((v) => !Number.isInteger(v)) ||
              values[0] < 2 ||
              values[0] > 9 ||
              values[1] < 0 ||
              values[1] > 9)
          )
            throw new Error(
              'Một phần mấy cần 2–9 phần, mỗi nhóm 0–9 đồ vật (0 để vẽ băng giấy).'
            );
          if (
            b.visual === 'number-line' &&
            (values.length !== 4 ||
              !Number.isInteger(values[0]) ||
              !Number.isInteger(values[1]) ||
              values[0] >= values[1] ||
              values[0] > 0 ||
              values[1] < 0 ||
              !Number.isInteger(values[2]) ||
              values[2] < 1 ||
              values[2] > 12 ||
              (values[1] - values[0]) * values[2] > 60 ||
              values[3] < values[0] ||
              values[3] > values[1] ||
              Math.abs(
                values[3] * values[2] - Math.round(values[3] * values[2])
              ) > 1e-8)
          )
            throw new Error(
              'Trục số cần hai đầu nguyên bao gồm 0, từ 1–12 phần mỗi đơn vị, tối đa 60 khoảng; điểm nằm trên một vạch trong trục.'
            );
          if (
            b.visual === 'rectangle' &&
            (values.length !== 2 || values.some((v) => v <= 0))
          )
            throw new Error('Hình chữ nhật cần chiều dài và chiều rộng dương.');
          return {
            id: idText(b.id),
            section: b.section as MathSection,
            title: text(b.title, 'Tên phần', 200, true),
            text: text(b.text, 'Nội dung', 8000),
            visual: b.visual as MathBlock['visual'],
            values,
            ...(b.segmentLabels !== undefined
              ? { segmentLabels: segmentLabels(b.segmentLabels) }
              : {}),
          };
        });
        const exercises = list(raw.exercises, 100).map(
          (entry): MathExercise => {
            const e = record(entry);
            if (
              !['foundation', 'guided', 'practice', 'extra'].includes(
                String(e.section)
              ) ||
              !['number', 'fraction', 'choice', 'written'].includes(
                String(e.kind)
              )
            )
              throw new Error('Loại hoặc phần bài tập không hợp lệ.');
            const answer = text(e.answer, 'Đáp án', 500, true);
            const unit = text(e.unit, 'Đơn vị', 40);
            if (e.kind === 'choice' && unit)
              throw new Error(
                'Trắc nghiệm: ghi đơn vị trong lựa chọn, không đặt đơn vị riêng.'
              );
            const options = list(e.options, 8).map((o) =>
              text(o, 'Lựa chọn', 500, true)
            );
            if (e.kind === 'number' && numeric(answer) === null)
              throw new Error('Đáp án phải là số.');
            if (e.kind === 'fraction' && !fraction(answer))
              throw new Error('Đáp án phân số cần dạng a/b với mẫu dương.');
            if (
              e.kind === 'choice' &&
              (options.length < 2 ||
                new Set(options).size !== options.length ||
                !options.includes(answer))
            )
              throw new Error(
                'Trắc nghiệm cần 2–8 lựa chọn khác nhau và đáp án nằm trong lựa chọn.'
              );
            if (typeof e.simplified !== 'boolean')
              throw new Error('Yêu cầu tối giản không hợp lệ.');
            const parsed = fraction(answer);
            if (
              e.kind === 'fraction' &&
              e.simplified &&
              parsed &&
              gcd(...parsed) !== 1
            )
              throw new Error(
                'Đáp án mẫu phải tối giản khi bật yêu cầu tối giản.'
              );
            if (e.kind === 'written' && e.section !== 'extra')
              throw new Error('Bài tự luận được hỗ trợ trong Luyện tập thêm.');
            const extra: Partial<MathExercise> = {};
            if (e.segment !== undefined)
              extra.segment = parseSegment(e.segment);
            if (e.segmentLabels !== undefined)
              extra.segmentLabels = segmentLabels(e.segmentLabels);
            if (e.table !== undefined) {
              if (e.kind !== 'written')
                throw new Error('Bảng cần bài tự luận.');
              const table = record(e.table);
              const readRows = (value: unknown) =>
                list(value, 3).map((row) =>
                  list(row, 7).map((cell) =>
                    text(cell, 'Ô trong bảng', 20, true)
                  )
                );
              const rows = readRows(table.rows),
                solution = readRows(table.solution);
              if (
                rows.length !== 3 ||
                rows[0].length < 2 ||
                solution.length !== rows.length ||
                rows.some(
                  (row, i) =>
                    row.length !== rows[0].length ||
                    solution[i].length !== row.length ||
                    row.some((cell, j) =>
                      j === 0
                        ? cell !== solution[i][j]
                        : !/^\d+$/.test(solution[i][j]) ||
                          (cell !== '?' && cell !== solution[i][j])
                    )
                )
              )
                throw new Error(
                  'Bảng cần 3 hàng cùng số cột, các ô số hoặc ? và lời giải tương ứng.'
                );
              extra.table = { rows, solution };
            }

            if (e.solutionNumberLine !== undefined)
              extra.solutionNumberLine = parseSolutionNumberLine(
                e.solutionNumberLine
              );
            for (const [field, allowed] of Object.entries({
              group: ['foundation', 'skills', 'application', 'challenge'],
              difficulty: ['easy', 'medium', 'hard'],
              workspace: ['small', 'medium', 'large'],
            })) {
              if (e[field] !== undefined) {
                if (!allowed.includes(String(e[field])))
                  throw new Error(`Giá trị ${field} không hợp lệ.`);
                Object.assign(extra, { [field]: e[field] });
              }
            }
            if (e.skill !== undefined)
              extra.skill = text(e.skill, 'Kỹ năng', 150, true);
            if (e.inputInstruction !== undefined) {
              const instruction = text(
                e.inputInstruction,
                'Hướng dẫn nhập đáp án',
                1000
              );
              if (instruction) extra.inputInstruction = instruction;
            }
            if (e.criteria !== undefined)
              extra.criteria = list(e.criteria, 8).map((c) =>
                text(c, 'Tiêu chí', 500, true)
              );
            if (e.kind === 'written' && !extra.criteria?.length)
              throw new Error(
                'Bài tự luận cần ít nhất một tiêu chí tự đánh giá.'
              );
            if (
              e.solutionStyle !== undefined &&
              !['method', 'explanation', 'answer-only'].includes(
                String(e.solutionStyle)
              )
            )
              throw new Error('Kiểu trình bày lời giải không hợp lệ.');
            return migrateLegacyExerciseContent({
              ...(e.solutionStyle !== undefined
                ? {
                    solutionStyle:
                      e.solutionStyle as MathExercise['solutionStyle'],
                  }
                : {}),
              ...extra,
              id: idText(e.id),
              section: e.section as MathExercise['section'],
              kind: e.kind as MathExercise['kind'],
              prompt: text(e.prompt, 'Câu hỏi', 2000, true),
              answer,
              options,
              unit,
              hint: text(e.hint, 'Gợi ý'),
              solution: text(e.solution, 'Lời giải', 8000, true),
              simplified: e.simplified,
              tolerance: finite(e.tolerance, 0, 1000),
              mistakes: list(e.mistakes, 10).map((entry) => {
                const m = record(entry);
                return {
                  answer: text(m.answer, 'Đáp án sai', 500, true),
                  feedback: text(m.feedback, 'Phản hồi', 2000, true),
                };
              }),
            });
          }
        );
        unique(blocks);
        unique(exercises);
        if (!blocks.length || !exercises.length)
          throw new Error('Cần ít nhất một phần giảng và một bài tập.');
        return {
          id: idText(raw.id),
          title: text(raw.title, 'Tên bài', 200, true),
          grade,
          ...(raw.semester ? { semester: raw.semester as '1' | '2' } : {}),
          topic: text(raw.topic, 'Chủ đề', 100, true),
          goal: text(raw.goal, 'Mục tiêu', 1000, true),
          textbook: text(raw.textbook, 'Tham chiếu sách', 1000),
          teacherNotes: text(raw.teacherNotes ?? '', 'Ghi chú riêng'),
          ...(raw.knowledgeSummary !== undefined
            ? {
                knowledgeSummary: text(
                  raw.knowledgeSummary,
                  'Kiến thức cần nhớ',
                  4000
                ),
              }
            : {}),
          blocks,
          exercises,
        };
      } catch (error) {
        throw new Error(`Bài ${index + 1}: ${(error as Error).message}`);
      }
    }
  );
  unique(lessons);
  return packLessons(lessons);
}
export function learnerCopy(lesson: MathLessonData): MathLessonData {
  return { ...lesson, teacherNotes: '' };
}
export function duplicateLesson(lesson: MathLessonData): MathLessonData {
  return {
    ...lesson,
    id: uid(),
    blocks: lesson.blocks.map((b) => ({ ...b, id: uid() })),
    exercises: lesson.exercises.map((e) => ({ ...e, id: uid() })),
  };
}
export function applyImport(
  existing: MathLessonData[],
  incoming: MathLessonData[],
  targets: Record<string, string>
): MathLessonData[] {
  const result = [...existing],
    used = new Set<string>();
  for (const lesson of incoming) {
    const target = targets[lesson.id];
    if (!target) result.push(duplicateLesson(lesson));
    else {
      const index = result.findIndex((l) => l.id === target);
      if (index < 0 || used.has(target))
        throw new Error(
          'Mỗi bài chỉ được cập nhật một lần; hãy kiểm tra lựa chọn nhập.'
        );
      used.add(target);
      result[index] = { ...lesson, id: target };
    }
  }
  return parseMathPack(packLessons(result)).lessons;
}
export const blankExercise = (): MathExercise => ({
  id: uid(),
  section: 'practice',
  kind: 'number',
  prompt: '',
  answer: '',
  options: [],
  unit: '',
  hint: '',
  solution: '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
});
export const blankBlock = (): MathBlock => ({
  id: uid(),
  section: 'explore',
  title: '',
  text: '',
  visual: 'none',
  values: [],
});
export const blankLesson = (): MathLessonData => ({
  id: uid(),
  title: '',
  grade: 6,
  topic: 'Phân số',
  goal: '',
  textbook: '',
  teacherNotes: '',
  blocks: [blankBlock()],
  exercises: [blankExercise()],
});

export const EXTRA_GROUPS = {
  foundation: 'Củng cố kiến thức',
  skills: 'Luyện kỹ năng',
  application: 'Vận dụng',
  challenge: 'Thử thách',
} as const;
