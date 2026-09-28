import type { MathExercise, MathLessonData } from './lessons';

type Item = [equation: string, domain: string, answer: string, hint: string, solution: string];
const sections: { title: string; difficulty: MathExercise['difficulty']; items: Item[] }[] = [
  { title: 'Ôn kiến thức cơ bản', difficulty: 'easy', items: [
    ['x = 2^0', 'x ∈ ℚ', '1', 'Cơ số khác 0 có lũy thừa bậc 0 bằng 1.', '2^0 = 1 nên x = 1.'],
    ['x = (-3/5)^0', 'x ∈ ℚ', '1', 'Quy tắc số mũ 0 cũng áp dụng với cơ số âm khác 0.', '(-3/5)^0 = 1 nên x = 1.'],
    ['x^1 = -2/3', 'x ∈ ℚ', '-2/3', 'Lũy thừa bậc 1 bằng chính cơ số.', 'x^1 = x nên x = -2/3.'],
    ['2^x = 1', 'x ∈ ℕ', '0', 'Nhớ giá trị của 2^0.', '1 = 2^0. Từ 2^x = 2^0, suy ra x = 0.'],
    ['2^x = 16', 'x ∈ ℕ', '4', 'Viết 16 thành tích các thừa số 2.', '16 = 2 × 2 × 2 × 2 = 2^4. Từ 2^x = 2^4, suy ra x = 4.'],
    ['2^x = 2', 'x ∈ ℕ', '1', 'Viết vế phải thành lũy thừa có cơ số 2.', '2 = 2^1. Từ 2^x = 2^1, suy ra x = 1.'],
    ['3^x = 3^2', 'x ∈ ℕ', '2', 'Hai lũy thừa có cùng cơ số 3.', 'Từ 3^x = 3^2, so sánh số mũ được x = 2.'],
  ] },
  { title: 'Nhân và chia lũy thừa cùng cơ số', difficulty: 'medium', items: [
    ['2^x × 2^3 = 2^7', 'x ∈ ℕ', '4', 'Giữ cơ số 2, cộng các số mũ.', '2^(x + 3) = 2^7 nên x + 3 = 7. Vậy x = 4.'],
    ['3^2 × 3^x = 3^5', 'x ∈ ℕ', '3', 'Tổng hai số mũ phải bằng 5.', '3^(2 + x) = 3^5 nên 2 + x = 5. Vậy x = 3.'],
    ['5^x : 5^2 = 5^3', 'x ∈ ℕ, x ≥ 2', '5', 'Khi chia cùng cơ số, trừ các số mũ.', '5^(x - 2) = 5^3 nên x - 2 = 3. Vậy x = 5, thỏa mãn x ≥ 2.'],
    ['7^6 : 7^x = 7^2', 'x ∈ ℕ, x ≤ 6', '4', 'Số mũ của thương là 6 - x.', '7^(6 - x) = 7^2 nên 6 - x = 2. Vậy x = 4, thỏa mãn x ≤ 6.'],
    ['(1/2)^x × (1/2)^2 = (1/2)^5', 'x ∈ ℕ', '3', 'Cơ số là phân số nhưng quy tắc nhân không đổi.', '(1/2)^(x + 2) = (1/2)^5 nên x + 2 = 5. Vậy x = 3.'],
    ['(-2)^x × (-2)^3 = (-2)^7', 'x ∈ ℕ', '4', 'Giữ nguyên cả dấu âm trong cơ số (-2).', '(-2)^(x + 3) = (-2)^7. So sánh độ lớn được 2^(x + 3) = 2^7, nên x = 4. Thử lại: (-2)^4 × (-2)^3 = (-2)^7.'],
  ] },
  { title: 'Lũy thừa của lũy thừa', difficulty: 'medium', items: [
    ['(2^x)^3 = 2^12', 'x ∈ ℕ', '4', 'Nhân hai số mũ x và 3.', '2^(3 × x) = 2^12 nên 3 × x = 12. Vậy x = 4.'],
    ['(3^2)^x = 3^6', 'x ∈ ℕ', '3', 'Số mũ sau khi gộp là 2 × x.', '3^(2 × x) = 3^6 nên 2 × x = 6. Vậy x = 3.'],
    ['[(-1/2)^2]^x = (-1/2)^8', 'x ∈ ℕ', '4', 'Gộp thành lũy thừa có số mũ 2 × x.', '(-1/2)^(2 × x) = (-1/2)^8. Hai số mũ đều chẵn, nên (1/2)^(2 × x) = (1/2)^8. Suy ra 2 × x = 8, vậy x = 4.'],
    ['(5^x)^2 : 5^2 = 5^4', 'x ∈ ℕ, x ≥ 1', '3', 'Gộp lũy thừa rồi dùng quy tắc chia.', '5^(2 × x - 2) = 5^4 nên 2 × x - 2 = 4. Suy ra 2 × x = 6, vậy x = 3.'],
  ] },
  { title: 'Cơ số phân số và số thập phân', difficulty: 'medium', items: [
    ['(2/3)^x = 8/27', 'x ∈ ℕ', '3', 'Viết 8 và 27 dưới dạng lũy thừa bậc ba.', '8/27 = (2/3)^3. Từ (2/3)^x = (2/3)^3, suy ra x = 3.'],
    ['(-1/2)^x = 1/16', 'x ∈ ℕ', '4', 'Kết quả dương nên số mũ chẵn.', '1/16 = (-1/2)^4. So sánh độ lớn và kiểm tra dấu, được x = 4.'],
    ['0,5^x = 0,125', 'x ∈ ℕ', '3', 'Có thể đổi 0,5 thành 1/2 và 0,125 thành 1/8.', '0,5 = 1/2; 0,125 = 1/8 = (1/2)^3. Vậy x = 3.'],
    ['(-1/2)^x = (-1/2)^3', 'x ∈ ℕ', '3', 'So sánh độ lớn của hai lũy thừa rồi kiểm tra dấu.', 'So sánh độ lớn được (1/2)^x = (1/2)^3, nên x = 3. Thử lại hai vế cùng bằng (-1/2)^3.'],
  ] },
  { title: 'Phối hợp các phép tính', difficulty: 'medium', items: [
    ['x + 2^3 = 11', 'x ∈ ℚ', '3', 'Tính lũy thừa trước rồi tìm số hạng chưa biết.', '2^3 = 8. Ta có x + 8 = 11, nên x = 11 - 8 = 3.'],
    ['x - (-2)^3 = 5', 'x ∈ ℚ', '-3', '(-2)^3 là số âm. Chú ý dấu trừ trước số âm.', '(-2)^3 = -8. Ta có x - (-8) = 5, tức x + 8 = 5. Vậy x = 5 - 8 = -3.'],
    ['(1/2)^2 × x = 3/8', 'x ∈ ℚ', '3/2', 'Tìm thừa số chưa biết bằng tích chia thừa số đã biết.', '(1/2)^2 = 1/4. Ta có (1/4) × x = 3/8, nên x = (3/8) : (1/4) = 3/2.'],
    ['x : (-2)^3 = 1/4', 'x ∈ ℚ', '-2', 'Tìm số bị chia bằng thương nhân số chia.', '(-2)^3 = -8. Ta có x : (-8) = 1/4, nên x = (1/4) × (-8) = -2.'],
    ['2^(x + 1) = 32', 'x ∈ ℕ', '4', 'Viết 32 thành lũy thừa của 2.', '32 = 2^5 nên x + 1 = 5. Vậy x = 4.'],
    ['4^x = 2^6', 'x ∈ ℕ', '3', 'Đổi 4 thành 2^2 trước khi so sánh số mũ.', '(2^2)^x = 2^6 nên 2^(2 × x) = 2^6. Suy ra 2 × x = 6, vậy x = 3.'],
  ] },
  { title: 'Biểu thức ở cơ số hoặc số mũ', difficulty: 'medium', items: [
    ['(x + 1)^2 = 2^2', 'x ∈ ℕ', '1', 'Vì x là số tự nhiên nên x + 1 là số dương. So sánh hai cơ số.', 'Vì x ∈ ℕ nên x + 1 > 0. Hai cơ số đều dương và có bình phương bằng nhau, nên x + 1 = 2. Vậy x = 1.'],
    ['(x - 2)^3 = 3^3', 'x ∈ ℕ, x ≥ 2', '5', 'Hai cơ số đều không âm và có cùng số mũ 3.', 'Vì x ≥ 2, hai cơ số đều không âm. Từ (x - 2)^3 = 3^3, suy ra x - 2 = 3. Vậy x = 5.'],
    ['(2 × x)^2 = 4^2', 'x ∈ ℕ', '2', 'Với x là số tự nhiên, cơ số 2 × x không âm.', 'Hai cơ số đều không âm và có bình phương bằng nhau, nên 2 × x = 4. Vậy x = 2.'],
    ['2^(2 × x) = 2', 'x ∈ ℚ, 2 × x ∈ ℕ', '1/2', 'Viết 2 = 2^1. Toàn bộ 2 × x là số mũ.', '2^(2 × x) = 2^1 nên 2 × x = 1. Vậy x = 1/2. Thử lại: số mũ 2 × (1/2) = 1 là số tự nhiên, hai vế đều bằng 2.'],
    ['3^(x + 2) = 3^5', 'x ∈ ℕ', '3', 'So sánh số mũ x + 2 và 5.', 'Hai lũy thừa có cùng cơ số 3, nên x + 2 = 5. Vậy x = 3.'],
    ['(1/2)^(3 × x) = (1/2)^2', 'x ∈ ℚ, 3 × x ∈ ℕ', '2/3', 'Toàn bộ 3 × x là số mũ; so sánh với số mũ 2.', 'Hai lũy thừa có cùng cơ số 1/2, nên 3 × x = 2. Vậy x = 2/3. Thử lại: số mũ 3 × (2/3) = 2 là số tự nhiên.'],
  ] },
];

const originalEquations: MathExercise[] = sections.flatMap((section, groupIndex) =>
  section.items.map(([equation, domain, answer, hint, solution], index) => ({
    id: `re-find-x-${groupIndex + 1}-${index + 1}`,
    section: 'extra',
    task: `Tìm x, biết… — ${section.title}`,
    group: groupIndex === 0 ? 'foundation' : 'skills',
    skill: section.title,
    difficulty: section.difficulty,
    kind: answer.includes('/') ? 'fraction' : 'number',
    prompt: `Tìm x, biết: ${equation} (${domain}).`,
    answer, hint, solution, options: [], unit: '',
    simplified: answer.includes('/'), tolerance: 0, mistakes: [],
  }))
);

// Compact integer coefficients of x, but never the exponent in a product
// such as (1/2)^2 × x, which must retain its multiplication sign.
const compactCoefficient = (text: string) => text.replace(/(?<![\w/^])([23]) × x\b/gu, '$1x');
const simplifyDomain = (text: string) => text.replace(/, [23]x ∈ ℕ(?=\))/gu, '');
// Authored equation steps, not prose-to-algebra replacements. Keep the legacy
// solutions above so saved, unedited examples can be upgraded safely.
const equationSteps: string[][] = [
  [
    'x = 2^0\nx = 1',
    'x = (-3/5)^0\nx = 1',
    'x^1 = -2/3\nx^1 = (-2/3)^1\nx = -2/3',
    '2^x = 1\n2^x = 2^0\nx = 0',
    '2^x = 16\n2^x = 2^4\nx = 4',
    '2^x = 2\n2^x = 2^1\nx = 1',
    '3^x = 3^2\nx = 2',
  ],
  [
    '2^x × 2^3 = 2^7\n2^(x + 3) = 2^7\nx + 3 = 7\nx = 7 - 3\nx = 4',
    '3^2 × 3^x = 3^5\n3^(2 + x) = 3^5\n2 + x = 5\nx = 5 - 2\nx = 3',
    '5^x : 5^2 = 5^3\n5^(x - 2) = 5^3\nx - 2 = 3\nx = 3 + 2\nx = 5',
    '7^6 : 7^x = 7^2\n7^(6 - x) = 7^2\n6 - x = 2\nx = 6 - 2\nx = 4',
    '(1/2)^x × (1/2)^2 = (1/2)^5\n(1/2)^(x + 2) = (1/2)^5\nx + 2 = 5\nx = 5 - 2\nx = 3',
    '(-2)^x × (-2)^3 = (-2)^7\n(-2)^(x + 3) = (-2)^7\nx + 3 = 7\nx = 7 - 3\nx = 4',
  ],
  [
    '(2^x)^3 = 2^12\n2^(3x) = 2^12\n3x = 12\nx = 12 : 3\nx = 4',
    '(3^2)^x = 3^6\n3^(2x) = 3^6\n2x = 6\nx = 6 : 2\nx = 3',
    '[(-1/2)^2]^x = (-1/2)^8\n(-1/2)^(2x) = (-1/2)^8\n2x = 8\nx = 8 : 2\nx = 4',
    '(5^x)^2 : 5^2 = 5^4\n5^(2x - 2) = 5^4\n2x - 2 = 4\n2x = 4 + 2\n2x = 6\nx = 6 : 2\nx = 3',
  ],
  [
    '(2/3)^x = 8/27\n(2/3)^x = (2/3)^3\nx = 3',
    '(-1/2)^x = 1/16\n(-1/2)^x = (-1/2)^4\nx = 4',
    '0,5^x = 0,125\n(1/2)^x = 1/8\n(1/2)^x = (1/2)^3\nx = 3',
    '(-1/2)^x = (-1/2)^3\nx = 3',
  ],
  [
    'x + 2^3 = 11\nx + 8 = 11\nx = 11 - 8\nx = 3',
    'x - (-2)^3 = 5\nx - (-8) = 5\nx + 8 = 5\nx = 5 - 8\nx = -3',
    '(1/2)^2 × x = 3/8\n(1/4) × x = 3/8\nx = (3/8) : (1/4)\nx = 3/2',
    'x : (-2)^3 = 1/4\nx : (-8) = 1/4\nx = (1/4) × (-8)\nx = -2',
    '2^(x + 1) = 32\n2^(x + 1) = 2^5\nx + 1 = 5\nx = 5 - 1\nx = 4',
    '4^x = 2^6\n(2^2)^x = 2^6\n2^(2x) = 2^6\n2x = 6\nx = 6 : 2\nx = 3',
  ],
  [
    '(x + 1)^2 = 2^2\nx + 1 = 2\nx = 2 - 1\nx = 1',
    '(x - 2)^3 = 3^3\nx - 2 = 3\nx = 3 + 2\nx = 5',
    '(2x)^2 = 4^2\n2x = 4\nx = 4 : 2\nx = 2',
    '2^(2x) = 2\n2^(2x) = 2^1\n2x = 1\nx = 1 : 2\nx = 1/2',
    '3^(x + 2) = 3^5\nx + 2 = 5\nx = 5 - 2\nx = 3',
    '(1/2)^(3x) = (1/2)^2\n3x = 2\nx = 2 : 3\nx = 2/3',
  ],
];
const previousPrefaces: Record<string, string> = {
  're-find-x-6-1': 'Vì x ∈ ℕ nên x + 1 > 0.\n',
  're-find-x-6-3': 'Vì x ∈ ℕ nên 2x ≥ 0.\n',
};
const steppedSolutions = new Map<string, string>(sections.flatMap((section, group) =>
  section.items.map((_, index) => [`re-find-x-${group + 1}-${index + 1}`, equationSteps[group][index]] as const)
));
export const rationalExponentEquations: MathExercise[] = originalEquations.map(e => ({
  ...e, prompt: simplifyDomain(compactCoefficient(e.prompt)), hint: compactCoefficient(e.hint),
  solution: steppedSolutions.get(e.id)!,
}));

export function updateExponentCoefficientNotation(lessons: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => {
    if (lesson.id !== 'math-rational-exponents-7') return lesson;
    return { ...lesson, exercises: lesson.exercises.map(e => {
      const original = originalEquations.find(item => item.id === e.id);
      if (!original) return e;
      const updated = { ...e };
      for (const field of ['prompt', 'hint', 'solution'] as const)
        if (e[field] === original[field] || e[field] === compactCoefficient(original[field]))
          updated[field] = field === 'prompt'
            ? simplifyDomain(compactCoefficient(e[field])) : compactCoefficient(e[field]);
      if (e.answer === original.answer &&
          [original.prompt, compactCoefficient(original.prompt), simplifyDomain(compactCoefficient(original.prompt))].includes(e.prompt) &&
          (e.solution === original.solution || e.solution === compactCoefficient(original.solution) ||
           (previousPrefaces[e.id] !== undefined && e.solution === previousPrefaces[e.id] + steppedSolutions.get(e.id))))
        updated.solution = steppedSolutions.get(e.id)!;
      return updated;
    }) };
  });
}
