import { commonFactorBlocks, commonFactorExercises } from './gcd-lcm-content';
import { naturalLesson, combinedNaturalLesson, divisibilityLesson, isDivisibilityBlock, isDivisibilityExercise } from './natural-example';
import {
  integerSetBlocks,
  integerSetExercises,
  rationalSetBlocks,
  rationalSetExercises,
} from './set-content';
import { integerLesson } from './integer-example';
import { rationalLesson } from './rational-example';
import { fractionExtraExercises } from './extra-examples';
import { MathLessonData } from './lessons';

// Run once for libraries saved before extra practice was built into the lesson.
// Preserve teacher edits and existing practice sets; never recreate deleted lessons.
export function addBuiltInFractionPractice(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (
      lesson.id !== 'math-fractions-6' ||
      lesson.grade !== 6 ||
      lesson.topic !== 'Phân số' ||
      lesson.exercises.some((exercise) => exercise.section === 'extra') ||
      lesson.exercises.length + fractionExtraExercises.length > 100
    )
      return lesson;
    const ids = new Set(lesson.exercises.map((exercise) => exercise.id));
    const extra = structuredClone(fractionExtraExercises).map((exercise) => {
      let id = exercise.id;
      while (ids.has(id)) id += '-extra';
      ids.add(id);
      return { ...exercise, id };
    });
    return { ...lesson, exercises: [...lesson.exercises, ...extra] };
  });
}

export function addBuiltInRationalLesson(lessons: MathLessonData[]) {
  if (
    lessons.some((lesson) => lesson.id === rationalLesson.id) ||
    lessons.length >= 100
  )
    return lessons;
  return [...lessons, structuredClone(rationalLesson)];
}

// Update only the original sample wording; keep teacher-edited blocks intact.
export function updateRationalFoundationWording(lessons: MathLessonData[]) {
  const originalText =
    'Phân số có mẫu khác 0. Nhân hoặc chia cả tử và mẫu với cùng một số nguyên khác 0 tạo phân số bằng nó. Khi cộng số nguyên khác dấu, lấy giá trị tuyệt đối lớn trừ giá trị tuyệt đối nhỏ và giữ dấu của số có giá trị tuyệt đối lớn hơn.';
  const replacement = rationalLesson.blocks.find(
    (block) => block.id === 'r-block-1'
  )!;
  return lessons.map((lesson) => {
    if (lesson.id !== rationalLesson.id) return lesson;
    return {
      ...lesson,
      blocks: lesson.blocks.map((block) =>
        block.id === replacement.id && block.text === originalText
          ? { ...block, text: replacement.text }
          : block.id === 'r-block-7' &&
              block.text ===
                '-4/6 + 5/6 = (-4 + 5)/6 = 1/6. Kết quả dương vì 5/6 lớn hơn 2/3.'
            ? { ...block, text: '-4/6 + 5/6 = (-4 + 5)/6 = 1/6.' }
            : block
      ),
    };
  });
}

// Replace only unchanged sample fields in previously saved libraries.
const rationalMultiplicationUpdates = [
  {
    id: 'r-block-5',
    field: 'text',
    before:
      'Cộng, trừ: quy đồng mẫu dương rồi cộng hoặc trừ các tử số, giữ mẫu chung. Nhân: nhân các tử với nhau và các mẫu với nhau. Chia cho số khác 0: nhân với số nghịch đảo của số chia. Hai thừa số cùng dấu cho tích dương, khác dấu cho tích âm. Luôn rút gọn kết quả.',
    after:
      'Cộng, trừ: quy đồng mẫu dương rồi cộng hoặc trừ các tử số, giữ mẫu chung. Nhân: rút gọn các thừa số chung ở tử và mẫu (nếu có), rồi nhân tử với tử, mẫu với mẫu. Chia cho số khác 0: nhân với số nghịch đảo của số chia. Hai thừa số cùng dấu cho tích dương, khác dấu cho tích âm. Luôn rút gọn kết quả.',
  },
  {
    id: 'r-block-9',
    field: 'text',
    before:
      '(-3/4) : (9/8) = (-3/4) × (8/9) = -24/36 = -2/3. Số chia phải khác 0. Nghịch đảo của 9/8 là 8/9.',
    after:
      '(-3/4) : (9/8) = (-3/4) × (8/9). Rút gọn 3 với 9 cho 3, 8 với 4 cho 4, rồi nhân: (-1 × 2)/(1 × 3) = -2/3. Số chia phải khác 0.',
  },
  {
    id: 'r-ex-5',
    field: 'solution',
    before: '(-3/5) × (10/9) = -30/45 = -2/3.',
    after:
      'Rút gọn 3 với 9 cho 3, 10 với 5 cho 5. Khi đó: (-3/5) × (10/9) = (-1 × 2)/(1 × 3) = -2/3.',
  },
  {
    id: 'r-ex-6',
    field: 'solution',
    before: '(2/3) × (-5/4) = -10/12 = -5/6.',
    after:
      'Đổi phép chia thành (2/3) × (-5/4). Rút gọn 2 với 4 cho 2, rồi nhân: (1 × -5)/(3 × 2) = -5/6.',
  },
  {
    id: 'r-ex-15',
    field: 'hint',
    before: 'Rút gọn trước hoặc sau khi nhân.',
    after: 'Rút gọn 3 với 9 cho 3, 14 với 7 cho 7 trước khi nhân.',
  },
  {
    id: 'r-ex-15',
    field: 'solution',
    before: '-42/63 = -2/3.',
    after:
      'Rút gọn 3 với 9 cho 3, 14 với 7 cho 7. Khi đó: (-3/7) × (14/9) = (-1 × 2)/(1 × 3) = -2/3.',
  },
  {
    id: 'r-ex-16',
    field: 'hint',
    before: 'Nhân -5/8 với -4/15.',
    after:
      'Nhân -5/8 với -4/15, rồi rút gọn 5 với 15 và 4 với 8 trước khi nhân.',
  },
  {
    id: 'r-ex-16',
    field: 'solution',
    before: '(-5/8) × (-4/15) = 20/120 = 1/6.',
    after:
      '(-5/8) : (-15/4) = (-5/8) × (-4/15). Rút gọn 5 với 15 cho 5, 4 với 8 cho 4, rồi nhân: (-1 × -1)/(2 × 3) = 1/6.',
  },
  {
    id: 'r-ex-18',
    field: 'solution',
    before: '(-3/4) × (2/3) = -1/2; 1/2 − 1/2 = 0.',
    after:
      'Trong (-3/4) × (2/3), rút gọn 3 với 3 và 2 với 4: (-1 × 1)/(2 × 1) = -1/2. Vậy 1/2 − 1/2 = 0.',
  },
  {
    id: 'r-ex-20',
    field: 'solution',
    before: 'x = (1/2) × (-4/3) = -2/3.',
    after:
      'x = (1/2) × (-4/3). Rút gọn 4 với 2 cho 2, rồi nhân: x = (1 × -2)/(1 × 3) = -2/3.',
  },
];
rationalMultiplicationUpdates.push(
  ...[
    {
      id: 'r-block-9',
      field: 'text',
      before:
        '(-3/4) : (9/8) = (-3/4) × (8/9). Rút gọn 3 với 9 cho 3, 8 với 4 cho 4, rồi nhân: (-1 × 2)/(1 × 3) = -2/3. Số chia phải khác 0.',
      after:
        '(-3/4) : (9/8) = (-3/4) × (8/9) = (-~3~ × ~4~ × 2)/(~4~ × ~3~ × 3) = -2/3.',
    },
    {
      id: 'r-ex-5',
      field: 'solution',
      before:
        'Rút gọn 3 với 9 cho 3, 10 với 5 cho 5. Khi đó: (-3/5) × (10/9) = (-1 × 2)/(1 × 3) = -2/3.',
      after: '(-3/5) × (10/9) = (-~3~ × ~5~ × 2)/(~5~ × ~3~ × 3) = -2/3.',
    },
    {
      id: 'r-ex-6',
      field: 'solution',
      before:
        'Đổi phép chia thành (2/3) × (-5/4). Rút gọn 2 với 4 cho 2, rồi nhân: (1 × -5)/(3 × 2) = -5/6.',
      after:
        '(2/3) : (-4/5) = (2/3) × (-5/4) = (-~2~ × 5)/(3 × ~2~ × 2) = -5/6.',
    },
    {
      id: 'r-ex-15',
      field: 'solution',
      before:
        'Rút gọn 3 với 9 cho 3, 14 với 7 cho 7. Khi đó: (-3/7) × (14/9) = (-1 × 2)/(1 × 3) = -2/3.',
      after: '(-3/7) × (14/9) = (-~3~ × ~7~ × 2)/(~7~ × ~3~ × 3) = -2/3.',
    },
    {
      id: 'r-ex-16',
      field: 'solution',
      before:
        '(-5/8) : (-15/4) = (-5/8) × (-4/15). Rút gọn 5 với 15 cho 5, 4 với 8 cho 4, rồi nhân: (-1 × -1)/(2 × 3) = 1/6.',
      after:
        '(-5/8) : (-15/4) = (-5/8) × (-4/15) = (~5~ × ~4~)/(~4~ × 2 × ~5~ × 3) = 1/6.',
    },
    {
      id: 'r-ex-18',
      field: 'solution',
      before:
        'Trong (-3/4) × (2/3), rút gọn 3 với 3 và 2 với 4: (-1 × 1)/(2 × 1) = -1/2. Vậy 1/2 − 1/2 = 0.',
      after:
        '1/2 + (-3/4) × (2/3) = 1/2 + (-~3~ × ~2~)/(2 × ~2~ × ~3~) = 1/2 − 1/2 = 0.',
    },
    {
      id: 'r-ex-20',
      field: 'solution',
      before:
        'x = (1/2) × (-4/3). Rút gọn 4 với 2 cho 2, rồi nhân: x = (1 × -2)/(1 × 3) = -2/3.',
      after:
        'x = (1/2) : (-3/4) = (1/2) × (-4/3) = (-~2~ × 2)/(~2~ × 3) = -2/3.',
    },
  ]
);
rationalMultiplicationUpdates.push({
  id: 'r-ex-19',
  field: 'solution',
  before: 'x = -1/10 − 4/10 = -5/10 = -1/2.',
  after: 'x = -1/10 − 2/5 = -1/10 − 4/10 = -5/10 = -1/2.',
});
export function updateRationalMultiplication(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (lesson.id !== rationalLesson.id) return lesson;
    return {
      ...lesson,
      blocks: lesson.blocks.map((block) => {
        let next = block;
        for (const patch of rationalMultiplicationUpdates) {
          if (
            patch.id === block.id &&
            patch.field === 'text' &&
            next.text === patch.before
          )
            next = { ...next, text: patch.after };
        }
        return next;
      }),
      exercises: lesson.exercises.map((exercise) => {
        let next = exercise;
        for (const patch of rationalMultiplicationUpdates) {
          if (patch.id !== exercise.id) continue;
          if (patch.field === 'hint' && next.hint === patch.before)
            next = { ...next, hint: patch.after };
          if (patch.field === 'solution' && next.solution === patch.before)
            next = { ...next, solution: patch.after };
        }
        return next;
      }),
    };
  });
}

// Invoked once for existing libraries; later deletion remains respected.
export function addBuiltInIntegerLesson(lessons: MathLessonData[]) {
  if (
    lessons.some((lesson) => lesson.id === integerLesson.id) ||
    lessons.length >= 100
  )
    return lessons;
  return [...lessons, structuredClone(integerLesson)];
}

export function addIntegerBracketRules(lessons: MathLessonData[]) {
  const rule = integerLesson.blocks.find((block) => block.id === 'i-brackets')!;
  const example = integerLesson.blocks.find((block) => block.id === 'i-step3')!;
  return lessons.map((lesson) => {
    if (lesson.id !== integerLesson.id) return lesson;
    const blocks = lesson.blocks.map((block) =>
      block.id === example.id &&
      block.title === '3. Đổi phép trừ thành phép cộng' &&
      block.text === '(-7) − (-12) = (-7) + 12 = 12 − 7 = 5.'
        ? { ...block, title: example.title, text: example.text }
        : block
    );
    if (!blocks.some((block) => block.id === rule.id) && blocks.length < 50) {
      const index = blocks.findIndex((block) => block.id === 'i-subtract');
      blocks.splice(
        index < 0 ? blocks.length : index + 1,
        0,
        structuredClone(rule)
      );
    }
    return { ...lesson, blocks };
  });
}

// Refresh only unchanged sample fields, preserving teacher edits.
export function updateIntegerComparisonWording(lessons: MathLessonData[]) {
  const original =
    'Trên trục số nằm ngang, chiều từ trái sang phải là chiều tăng. Số nằm bên trái nhỏ hơn số nằm bên phải. Ví dụ: -5 < -2 < 0 < 3.\nHai số đối nhau nằm ở hai phía của 0 và cách 0 một khoảng bằng nhau. Số đối của -5 là 5; số đối của 0 là 0.';
  const replacement = integerLesson.blocks.find(
    (block) => block.id === 'i-line'
  )!;
  return lessons.map((lesson) => {
    if (lesson.id !== integerLesson.id) return lesson;
    return {
      ...lesson,
      blocks: lesson.blocks.map((block) =>
        block.id === replacement.id && block.text === original
          ? { ...block, text: replacement.text }
          : block
      ),
      exercises: lesson.exercises.map((exercise) => {
        if (exercise.id !== 'i-extra-3') return exercise;
        return {
          ...exercise,
          hint:
            exercise.hint ===
            'Trên trục số, số nằm bên trái nhỏ hơn số nằm bên phải.'
              ? 'So sánh hai phần số tự nhiên: 9 và 4.'
              : exercise.hint,
          solution:
            exercise.solution === '-9 nằm bên trái -4 nên -9 < -4.'
              ? 'Vì 9 > 4 nên -9 < -4.'
              : exercise.solution,
        };
      }),
    };
  });
}

export function addSetContent(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    const content =
      lesson.id === integerLesson.id
        ? { blocks: integerSetBlocks, exercises: integerSetExercises }
        : lesson.id === rationalLesson.id
          ? { blocks: rationalSetBlocks, exercises: rationalSetExercises }
          : null;
    if (!content) return lesson;
    const blocks = content.blocks.filter(
      (block) => !lesson.blocks.some((existing) => existing.id === block.id)
    );
    const exercises = content.exercises.filter(
      (exercise) =>
        !lesson.exercises.some((existing) => existing.id === exercise.id)
    );
    if (
      lesson.blocks.length + blocks.length > 50 ||
      lesson.exercises.length + exercises.length > 100
    )
      return lesson;
    return {
      ...lesson,
      blocks: [...structuredClone(blocks), ...lesson.blocks],
      exercises: [...lesson.exercises, ...structuredClone(exercises)],
    };
  });
}

export function addBuiltInNaturalLesson(lessons: MathLessonData[]) {
  if (
    lessons.some((lesson) => lesson.id === naturalLesson.id) ||
    lessons.length >= 100
  )
    return lessons;
  return [...lessons, structuredClone(naturalLesson)];
}

// One-time additive upgrade; existing block and exercise edits take precedence.
export function addNaturalCommonFactors(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (lesson.id !== naturalLesson.id) return lesson;
    const blocks = commonFactorBlocks.filter(b => !lesson.blocks.some(old => old.id === b.id));
    const exercises = commonFactorExercises.filter(e => !lesson.exercises.some(old => old.id === e.id));
    if (lesson.blocks.length + blocks.length > 50 || lesson.exercises.length + exercises.length > 100) return lesson;
    return {
      ...lesson,
      goal: lesson.goal === 'Hiểu tập hợp số tự nhiên, giá trị chữ số, thứ tự thực hiện phép tính và các dấu hiệu chia hết cơ bản.' ? naturalLesson.goal : lesson.goal,
      teacherNotes: lesson.teacherNotes === 'Bài tổng quan, có thể chia thành nhiều buổi: tập hợp và ghi số; phép tính và lũy thừa; chia hết và vận dụng. Chưa đi sâu phân tích thừa số nguyên tố, ƯCLN và BCNN.' ? naturalLesson.teacherNotes : lesson.teacherNotes,
      blocks: [...lesson.blocks, ...structuredClone(blocks)],
      exercises: [...lesson.exercises, ...structuredClone(exercises)],
    };
  });
}


// Move stored content rather than replacing it with defaults, preserving teacher edits.
export function splitNaturalDivisibility(lessons: MathLessonData[]) {
  const source = lessons.find(l => l.id === naturalLesson.id);
  const target = lessons.find(l => l.id === divisibilityLesson.id);
  if (!source) return lessons;
  if (!target && lessons.length >= 100) return lessons;
  const blocks = source.blocks.filter(isDivisibilityBlock);
  const exercises = source.exercises.filter(isDivisibilityExercise);
  const destination = target ?? {
    ...structuredClone(divisibilityLesson),
    blocks: blocks.length || exercises.length ? divisibilityLesson.blocks.filter(b => !isDivisibilityBlock(b)) : structuredClone(divisibilityLesson.blocks),
    exercises: blocks.length || exercises.length ? divisibilityLesson.exercises.filter(e => !isDivisibilityExercise(e)) : structuredClone(divisibilityLesson.exercises),
  };
  // Keep both copies when an existing target has conflicting edits.
  const canMove = <T extends { id: string }>(item: T, existing: T[]) =>
    !existing.some(old => old.id === item.id && JSON.stringify(old) !== JSON.stringify(item));
  const movedBlocks = blocks.filter(b => canMove(b, destination.blocks));
  const movedExercises = exercises.filter(e => canMove(e, destination.exercises));
  const newBlocks = movedBlocks.filter(b => !destination.blocks.some(old => old.id === b.id));
  const newExercises = movedExercises.filter(e => !destination.exercises.some(old => old.id === e.id));
  if (destination.blocks.length + newBlocks.length > 50 || destination.exercises.length + newExercises.length > 100) return lessons;
  const updatedTarget = {...destination, blocks: [...destination.blocks, ...structuredClone(newBlocks)], exercises: [...destination.exercises, ...structuredClone(newExercises)]};
  const updated = lessons.map(l => {
    if (l.id === destination.id) return updatedTarget;
    if (l.id !== source.id) return l;
    return {
      ...l,
      title: l.title === combinedNaturalLesson.title ? naturalLesson.title : l.title,
      goal: l.goal === combinedNaturalLesson.goal ? naturalLesson.goal : l.goal,
      teacherNotes: l.teacherNotes === combinedNaturalLesson.teacherNotes ? naturalLesson.teacherNotes : l.teacherNotes,
      blocks: l.blocks.filter(b => !movedBlocks.includes(b)),
      exercises: l.exercises.filter(e => !movedExercises.includes(e)),
    };
  });
  return target ? updated : [...updated, updatedTarget];
}


// These lessons precede integers: update terminology without replacing edited content.
export function updateNaturalTerminology(lessons: MathLessonData[]) {
  const wording = (text: string) => text
    .replaceAll('ước dương', 'ước')
    .replaceAll('số mũ nguyên dương', 'số mũ tự nhiên khác 0')
    .replaceAll('Với các số nguyên dương, phân tích ra thừa số nguyên tố.', 'Với các số tự nhiên lớn hơn 1, phân tích mỗi số ra thừa số nguyên tố.')
    .replaceAll('Số nguyên tố lớn hơn 1 và có đúng hai ước.', 'Số nguyên tố là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó.')
    .replaceAll('Hợp số lớn hơn 1', 'Hợp số là số tự nhiên lớn hơn 1');
  return lessons.map(lesson => {
    if (![naturalLesson.id, divisibilityLesson.id].includes(lesson.id)) return lesson;
    return {
      ...lesson,
      ...(lesson.knowledgeSummary !== undefined ? {knowledgeSummary: wording(lesson.knowledgeSummary)} : {}),
      blocks: lesson.blocks.map(block => ({...block, text: wording(block.text)})),
      exercises: lesson.exercises.map(exercise => ({...exercise, prompt: wording(exercise.prompt), hint: wording(exercise.hint), solution: wording(exercise.solution)})),
    };
  });
}
