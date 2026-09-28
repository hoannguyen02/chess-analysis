import { equalityExamples } from './equality-examples';
import { rationalExponentEquations } from './rational-exponent-equations';
import type { MathBlock, MathExercise, MathLessonData } from './lessons';

const solutionSteps: Record<string, string> = {
  'eq-g1': 'x + 6 = 10\nx + 6 - 6 = 10 - 6\nx = 10 - 6',
  'eq-g2': 'x - 5 = -2\nx = -2 + 5\nx = 3\nThử lại: 3 - 5 = -2.',
  'eq-g3':
    'x + 1/3 = 5/6\nx = 5/6 - 1/3\nx = 5/6 - 2/6\nx = 3/6\nx = 1/2\nThử lại: 1/2 + 1/3 = 5/6.',
  'eq-g4': '4x = 20\nx = 20 : 4\nx = 5',
  'eq-p1': 'x + 7 = -4\nx = -4 - 7\nx = -11\nThử lại: -11 + 7 = -4.',
  'eq-p2':
    'x - 3/5 = 1/10\nx = 1/10 + 3/5\nx = 1/10 + 6/10\nx = 7/10\nThử lại: 7/10 - 6/10 = 1/10.',
  'eq-p3': '5 = x + 8\nx + 8 = 5\nx = 5 - 8\nx = -3\nThử lại: -3 + 8 = 5.',
  'eq-p4':
    '2x - 3 = 9\n2x = 9 + 3\n2x = 12\nx = 12 : 2\nx = 6\nThử lại: 2 × 6 - 3 = 9.',
  'eq-e1': 'x + 9 = 2\nx = 2 - 9\nx = -7',
  'eq-e2': 'x - 4 = 6\nx = 6 + 4\nx = 10',
  'eq-e3': 'x + 3/4 = -1/2\nx = -1/2 - 3/4\nx = -2/4 - 3/4\nx = -5/4',
  'eq-e4': 'x - 5/6 = -1/3\nx = -1/3 + 5/6\nx = -2/6 + 5/6\nx = 3/6\nx = 1/2',
  'eq-e7': '3x + 1/2 = 2\n3x = 2 - 1/2\n3x = 3/2\nx = 3/2 : 3\nx = 1/2',
  'eq-e8': '5 - x = 8\n-x = 8 - 5\n-x = 3\nx = -3\nThử lại: 5 - (-3) = 8.',
};

const block = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string
): MathBlock => ({
  id: `eq-${id}`,
  section,
  title,
  text,
  visual: 'none',
  values: [],
});
function exercise(
  id: string,
  section: MathExercise['section'],
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  options: string[] = [],
  group?: MathExercise['group']
): MathExercise {
  return {
    id: `eq-${id}`,
    section,
    prompt,
    answer,
    hint,
    solution: solutionSteps[`eq-${id}`] ?? solution,
    options,
    kind: options.length
      ? 'choice'
      : answer.includes('/')
        ? 'fraction'
        : 'number',
    unit: '',
    simplified: answer.includes('/'),
    tolerance: 0,
    mistakes: [],
    ...(group
      ? {
          task: group === 'application' ? 'Vận dụng đẳng thức' : 'Tìm x',
          group,
          skill: 'Đẳng thức và quy tắc chuyển vế',
          difficulty:
            group === 'challenge' ? ('hard' as const) : ('medium' as const),
          workspace: 'medium' as const,
        }
      : {}),
  };
}

export const equalityLesson: MathLessonData = {
  id: 'math-equality-transposition-7',
  title: 'Đẳng thức và quy tắc chuyển vế',
  grade: 7,
  semester: '1',
  topic: 'Số hữu tỉ',
  interactiveLab: 'equality',
  goal: 'Nhận biết hai vế của đẳng thức; giữ đẳng thức đúng khi cộng hoặc trừ cùng một số ở hai vế; chuyển vế để tìm x và kiểm tra lại.',
  textbook:
    'Bài tự biên soạn theo chủ đề số hữu tỉ, Toán 7 học kỳ 1; không sao chép bài tập sách giáo khoa.',
  teacherNotes:
    'Bắt đầu bằng cân số có giá trị không âm. Cho học sinh thử thay đổi một vế rồi sửa bằng cách thay đổi vế còn lại. Với số âm và phân số, dùng đẳng thức ký hiệu thay vì khối lượng âm. Giải thích chuyển vế là cách viết gọn của cộng/trừ cùng một số ở hai vế. Tham khảo phạm vi: kế hoạch Toán 7 CTST của Hội đồng bộ môn TP Bà Rịa; cách tiếp cận cân bằng: Khan Academy, Same thing to both sides of equations.',
  knowledgeSummary:
    '1. Giữ hai vế bằng nhau\nĐẳng thức đúng khi hai vế có cùng giá trị. Nếu a = b thì b = a. Cộng hoặc trừ cùng một số ở hai vế vẫn được đẳng thức đúng. Nhân hoặc chia cả hai vế cho cùng một số khác 0 giúp tìm x mà giữ nguyên nghiệm.\n2. Phép cộng và phép trừ: chuyển số hạng, đổi dấu\nx + a = b → x = b - a; x - a = b → x = b + a.\nVí dụ: x + 5 = 12 → x = 12 - 5 = 7. Với a - x = b: x = a - b. Ví dụ: 5 - x = 8 → x = 5 - 8 = -3.\n3. Phép nhân và phép chia: dùng phép tính ngược\na × x = b → x = b : a (a ≠ 0). Ví dụ: 3x = 12 → x = 12 : 3 = 4.\nx : a = b → x = b × a (a ≠ 0). Ví dụ: x : 4 = -2 → x = -2 × 4 = -8.\na : x = b → x = a : b (x ≠ 0, b ≠ 0). Ví dụ: 12 : x = 3 → x = 12 : 3 = 4.\n4. Phân số: quy đồng khi cộng, trừ; đảo phân số khi chia\nx - 2/3 = -1/4 → x = -1/4 + 2/3 = -3/12 + 8/12 = 5/12.\n(1/2) × x = 3/4 → x = (3/4) : (1/2) = (3/4) × 2 = 3/2.\n5. Lũy thừa: xác định x nằm ở đâu\nNếu lũy thừa là số đã biết, tính trước: x + 2^3 = 11 → x + 8 = 11 → x = 3.\nNếu x ở số mũ, đưa về cùng cơ số phù hợp rồi so sánh số mũ. Ví dụ với x ∈ ℕ: 2^(x + 1) = 32 → 2^(x + 1) = 2^5 → x + 1 = 5 → x = 4.\nNếu x ở cơ số, tìm các giá trị phù hợp với số mũ và điều kiện đề bài. Ví dụ: x^2 = 9 có x = 3 hoặc x = -3; nếu x ∈ ℕ thì chỉ nhận x = 3.\nLưu ý: “Chuyển vế, đổi dấu” dùng cho số hạng trong phép cộng, trừ. Với nhân, chia và lũy thừa, dùng cách biến đổi tương ứng ở trên. Không chia cho 0. Cuối cùng, thay x vào đẳng thức ban đầu để kiểm tra.',
  blocks: [
    block(
      'foundation',
      'foundation',
      'Dấu bằng nói điều gì?',
      'Dấu = cho biết hai vế có cùng giá trị. Vế trái là biểu thức bên trái dấu =; vế phải là biểu thức bên phải. Ví dụ: 5 + 3 = 6 + 2 vì cả hai vế đều bằng 8.'
    ),
    block(
      'balance',
      'explore',
      'Giữ hai vế bằng nhau',
      'Từ 8 = 8, trừ 3 ở CẢ HAI vế: 8 - 3 = 8 - 3, tức 5 = 5. Nếu chỉ trừ 3 ở vế trái thì 5 ≠ 8. Cộng hoặc trừ cùng một số ở hai vế giữ được đẳng thức đúng.'
    ),
    block(
      'rule',
      'explore',
      'Vì sao chuyển vế phải đổi dấu?',
      'x + 5 = 12. Trừ 5 ở cả hai vế: x + 5 - 5 = 12 - 5. Thu gọn được x = 12 - 5. Số hạng +5 ở vế trái trở thành -5 ở vế phải. Đây là cách viết gọn của cùng một phép biến đổi ở hai vế.'
    ),
    block(
      'example-plus',
      'example',
      'Ví dụ 1: chuyển số hạng dương',
      'Tìm x: x + 4 = -3.\nBước 1: Trừ 4 ở cả hai vế: x + 4 - 4 = -3 - 4.\nBước 2: Thu gọn: x = -7.\nThử lại: -7 + 4 = -3. Vậy x = -7.'
    ),
    block(
      'example-minus',
      'example',
      'Ví dụ 2: chuyển số hạng âm',
      'Tìm x: x - 3 = -8.\nBước 1: Cộng 3 ở cả hai vế: x - 3 + 3 = -8 + 3.\nBước 2: Thu gọn: x = -5.\nThử lại: -5 - 3 = -8. Số hạng -3 khi sang vế phải trở thành +3.'
    ),
    block(
      'example-fraction',
      'example',
      'Ví dụ 3: quy đồng sau khi chuyển vế',
      'Tìm x: x + 1/2 = 5/6.\nBước 1: Chuyển +1/2 sang vế phải: x = 5/6 - 1/2.\nBước 2: Quy đồng mẫu 6: x = 5/6 - 3/6 = 2/6 = 1/3.\nThử lại: 1/3 + 1/2 = 2/6 + 3/6 = 5/6.'
    ),
    block(
      'example-factor',
      'example',
      'Ví dụ 4: phân biệt số hạng và thừa số',
      'Tìm x: 3x + 2 = 14.\nChuyển số hạng +2: 3x = 14 - 2 = 12.\nSố 3 đang NHÂN với x, nên chia cả hai vế cho 3: x = 12 : 3 = 4.\nKhông viết x = 12 - 3. Thử lại: 3 × 4 + 2 = 14.'
    ),
    block(
      'example-power',
      'example',
      equalityExamples[4].title,
      equalityExamples[4].rows.map((row) => row.equation).join('\n') +
        '\nThử lại: ' +
        equalityExamples[4].check
    ),
    block(
      'guided',
      'guided',
      'Em tự chọn phép biến đổi',
      'Xác định số hạng cần chuyển. Viết dấu mới, tính với số hữu tỉ rồi thay kết quả vào đẳng thức ban đầu. Nếu x có hệ số, chia hai vế cho hệ số khác 0.'
    ),
  ],
  exercises: [
    exercise(
      'f1',
      'foundation',
      'Đẳng thức nào đúng?',
      '4 + 3 = 7',
      'Tính riêng giá trị ở mỗi vế.',
      '4 + 3 có giá trị 7, bằng vế phải.',
      ['4 + 3 = 7', '4 + 3 = 8', '4 + 3 = 4']
    ),
    exercise(
      'f2',
      'foundation',
      'Số đối của -3/4 là số nào?',
      '3/4',
      'Hai số đối nhau có tổng bằng 0.',
      '-3/4 + 3/4 = 0.',
      ['-3/4', '3/4', '4/3']
    ),
    exercise(
      'g1',
      'guided',
      'Từ x + 6 = 10, bước nào đúng?',
      'x = 10 - 6',
      'Trừ 6 ở cả hai vế.',
      'x + 6 - 6 = 10 - 6 nên x = 10 - 6.',
      ['x = 10 + 6', 'x = 10 - 6', 'x = 6 - 10']
    ),
    exercise(
      'g2',
      'guided',
      'Tìm x: x - 5 = -2.',
      '3',
      'Chuyển -5 sang vế phải thành +5.',
      'x = -2 + 5 = 3. Thử lại: 3 - 5 = -2.'
    ),
    exercise(
      'g3',
      'guided',
      'Tìm x: x + 1/3 = 5/6.',
      '1/2',
      'Chuyển +1/3, rồi quy đồng mẫu 6.',
      'x = 5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2. Thử lại: 1/2 + 1/3 = 5/6.'
    ),
    exercise(
      'g4',
      'guided',
      'Từ 4x = 20, bước nào đúng?',
      'x = 20 : 4',
      '4 là thừa số của x, không phải số hạng cộng vào x.',
      'Chia hai vế cho 4: x = 20 : 4 = 5.',
      ['x = 20 - 4', 'x = 20 : 4', 'x = 20 + 4']
    ),
    exercise(
      'p1',
      'practice',
      'Tìm x: x + 7 = -4.',
      '-11',
      'Trừ 7 ở cả hai vế.',
      'x = -4 - 7 = -11. Thử lại: -11 + 7 = -4.'
    ),
    exercise(
      'p2',
      'practice',
      'Tìm x: x - 3/5 = 1/10.',
      '7/10',
      'Cộng 3/5 ở hai vế; dùng mẫu 10.',
      'x = 1/10 + 3/5 = 1/10 + 6/10 = 7/10. Thử lại: 7/10 - 6/10 = 1/10.'
    ),
    exercise(
      'p3',
      'practice',
      'Tìm x: 5 = x + 8.',
      '-3',
      'Trừ 8 ở cả hai vế, rồi đổi thứ tự hai vế.',
      '5 - 8 = x nên x = -3. Thử lại: -3 + 8 = 5.'
    ),
    exercise(
      'p4',
      'practice',
      'Tìm x: 2x - 3 = 9.',
      '6',
      'Cộng 3 ở hai vế, rồi chia hai vế cho 2.',
      '2x = 9 + 3 = 12; x = 6. Thử lại: 2 × 6 - 3 = 9.'
    ),
    exercise(
      'e1',
      'extra',
      'Tìm x: x + 9 = 2.',
      '-7',
      'Chuyển +9.',
      'x = 2 - 9 = -7.',
      [],
      'foundation'
    ),
    exercise(
      'e2',
      'extra',
      'Tìm x: x - 4 = 6.',
      '10',
      'Chuyển -4.',
      'x = 6 + 4 = 10.',
      [],
      'foundation'
    ),
    exercise(
      'e3',
      'extra',
      'Tìm x: x + 3/4 = -1/2.',
      '-5/4',
      'Dùng mẫu chung 4.',
      'x = -1/2 - 3/4 = -2/4 - 3/4 = -5/4.',
      [],
      'skills'
    ),
    exercise(
      'e4',
      'extra',
      'Tìm x: x - 5/6 = -1/3.',
      '1/2',
      'Chuyển -5/6 thành +5/6.',
      'x = -1/3 + 5/6 = -2/6 + 5/6 = 3/6 = 1/2.',
      [],
      'skills'
    ),
    exercise(
      'e7',
      'extra',
      'Tìm x: 3x + 1/2 = 2.',
      '1/2',
      'Trừ 1/2 ở hai vế, rồi chia cho 3.',
      '3x = 2 - 1/2 = 3/2; x = 3/2 : 3 = 1/2.',
      [],
      'challenge'
    ),
    exercise(
      'e8',
      'extra',
      'Tìm x: 5 - x = 8.',
      '-3',
      'Trừ 5 ở cả hai vế, rồi nhân hai vế với -1.',
      '-x = 8 - 5 = 3 nên x = -3. Thử lại: 5 - (-3) = 8.',
      [],
      'challenge'
    ),
    ...rationalExponentEquations,
  ],
};

export function addEqualityLesson(lessons: MathLessonData[]) {
  if (lessons.length >= 100 || lessons.some((l) => l.id === equalityLesson.id))
    return lessons;
  return [...lessons, structuredClone(equalityLesson)];
}

// Update only the original wording, preserving any teacher-authored changes.
export function refreshEqualityExplanation(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (lesson.id !== equalityLesson.id) return lesson;
    return {
      ...lesson,
      blocks: lesson.blocks.map((item) =>
        item.id === 'eq-foundation' && item.text === OLD_EQUALITY_EXPLANATION
          ? { ...item, text: equalityLesson.blocks[0].text }
          : item
      ),
    };
  });
}

const OLD_EQUALITY_EXPLANATION =
  'Vế trái là biểu thức bên trái dấu =; vế phải là biểu thức bên phải. Ví dụ 5 + 3 = 8 là đẳng thức đúng vì hai vế đều có giá trị 8. Dấu = không có nghĩa là “tiếp theo hãy tính”.';

export function addEqualityPowerExample(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (
      lesson.id !== equalityLesson.id ||
      lesson.blocks.some((b) => b.id === 'eq-example-power') ||
      lesson.blocks.length >= 100
    )
      return lesson;
    const example = equalityLesson.blocks.find(
      (b) => b.id === 'eq-example-power'
    )!;
    const after = lesson.blocks.findIndex((b) => b.id === 'eq-example-factor');
    if (after < 0) return lesson;
    return {
      ...lesson,
      blocks: [
        ...lesson.blocks.slice(0, after + 1),
        structuredClone(example),
        ...lesson.blocks.slice(after + 1),
      ],
    };
  });
}

const PREVIOUS_EQUALITY_SUMMARY =
  'Đẳng thức là hai biểu thức nối với nhau bằng dấu =. Đẳng thức đúng khi hai vế có cùng giá trị.\nNếu a = b thì a + c = b + c và a - c = b - c. Nếu a = b thì b = a.\nChuyển một SỐ HẠNG sang vế kia phải đổi dấu: x + a = b thì x = b - a; x - a = b thì x = b + a.\nVí dụ: x + 5 = 12 → x = 12 - 5 = 7. Thử lại: 7 + 5 = 12.\nVới phân số: x - 2/3 = -1/4 → x = -1/4 + 2/3 = -3/12 + 8/12 = 5/12.\nLưu ý: Không áp dụng đổi dấu cho thừa số: 3x = 12 thì chia hai vế cho 3, được x = 4; không viết x = 12 - 3. Không chia cho 0.';

export function expandEqualitySummary(lessons: MathLessonData[]) {
  return lessons.map((lesson) =>
    lesson.id === equalityLesson.id &&
    lesson.knowledgeSummary === PREVIOUS_EQUALITY_SUMMARY
      ? { ...lesson, knowledgeSummary: equalityLesson.knowledgeSummary }
      : lesson
  );
}
