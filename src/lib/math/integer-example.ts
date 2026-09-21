import { integerSetBlocks, integerSetExercises } from './set-content';
import { MathBlock, MathExercise, MathLessonData } from './lessons';
import { builtInExercisePrompts, ExercisePrompt } from './exercise-content';

const block = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string
): MathBlock => ({
  id,
  section,
  title,
  text,
  visual: 'none',
  values: [],
});
const exercise = (
  id: string,
  section: MathExercise['section'],
  prompt: string | ExercisePrompt,
  answer: string,
  hint: string,
  solution: string,
  options: string[] = [],
  group?: MathExercise['group']
): MathExercise => ({
  id,
  section,
  ...(typeof prompt === 'string' ? { prompt } : prompt),
  answer,
  hint,
  solution,
  options,
  kind: options.length ? 'choice' : 'number',
  unit: '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
  ...(group
    ? ({
        group,
        difficulty:
          group === 'challenge'
            ? 'hard'
            : group === 'foundation'
              ? 'easy'
              : 'medium',
        workspace: 'medium',
      } as const)
    : {}),
});

type PracticeRow = [string | ExercisePrompt, string, string, string, string[]?];
const extra: PracticeRow[] = [
  [
    'Số nào là số nguyên âm?',
    '-7',
    'Số nguyên âm nhỏ hơn 0.',
    '-7 là số nguyên âm; 0 không âm cũng không dương.',
    ['-7', '0', '7', '0,5'],
  ],
  [
    'Tìm số đối của -12.',
    '12',
    'Hai số đối nhau có tổng bằng 0.',
    '(-12) + 12 = 0. Số đối của -12 là 12.',
  ],
  [
    'So sánh -9 và -4.',
    '-9 < -4',
    'So sánh hai phần số tự nhiên: 9 và 4.',
    'Vì 9 > 4 nên -9 < -4.',
    ['-9 < -4', '-9 > -4', '-9 = -4'],
  ],
  [
    'Trên trục số, từ -2 đi sang phải 5 đơn vị. Em đến số nào?',
    '3',
    'Đi sang phải tương ứng với cộng.',
    '(-2) + 5 = 5 − 2 = 3.',
  ],
  [
    'Tính (-7) + (-5).',
    '-12',
    'Cộng hai phần số tự nhiên rồi đặt dấu trừ trước kết quả.',
    '(-7) + (-5) = -(7 + 5) = -12.',
  ],
  [
    'Tính (-13) + 8.',
    '-5',
    'Lấy 13 trừ 8 rồi giữ dấu của -13.',
    '(-13) + 8 = -(13 − 8) = -5.',
  ],
  [
    'Tính 17 + (-9).',
    '8',
    'Lấy 17 trừ 9 rồi giữ dấu của 17.',
    '17 + (-9) = 17 − 9 = 8.',
  ],
  [
    'Tính (-24) + 24.',
    '0',
    'Hai số đối nhau có tổng bằng 0.',
    '(-24) + 24 = 0.',
  ],
  [
    'Tính 6 − (-8).',
    '14',
    'Trừ một số là cộng với số đối của số đó.',
    '6 − (-8) = 6 + 8 = 14.',
  ],
  [
    'Tính (-5) − 7.',
    '-12',
    'Thay phép trừ 7 bằng phép cộng -7.',
    '(-5) − 7 = (-5) + (-7) = -(5 + 7) = -12.',
  ],
  [
    'Tính (-6) × (-4).',
    '24',
    'Hai thừa số âm cho tích dương.',
    '(-6) × (-4) = 6 × 4 = 24.',
  ],
  [
    'Tính 35 : (-7).',
    '-5',
    'Hai số khác dấu cho thương âm.',
    '35 : (-7) = -(35 : 7) = -5.',
  ],
  [
    builtInExercisePrompts.integerTemperature,
    '5',
    'Nhiệt độ tăng nên thực hiện phép cộng.',
    '(-4) + 9 = 9 − 4 = 5 (°C).',
  ],
  [
    builtInExercisePrompts.integerDiver,
    '-19',
    'Lặn xuống thêm nghĩa là độ cao giảm.',
    '(-12) − 7 = (-12) + (-7) = -19 (m).',
  ],
  [
    builtInExercisePrompts.integerGame,
    '14',
    'Cộng điểm từ câu đúng và điểm từ câu sai.',
    '4 × 5 + 3 × (-2) = 20 + (-6) = 14 (điểm).',
  ],
  [
    'Tìm x: x + 7 = -3.',
    '-10',
    'Trừ 7 ở cả hai vế.',
    'x = -3 − 7 = (-3) + (-7) = -10.',
  ],
  [
    'Tìm x: x − (-4) = -9.',
    '-13',
    'Viết x − (-4) thành x + 4.',
    'x + 4 = -9 → x = -9 − 4 = -13.',
  ],
  [
    builtInExercisePrompts.integerPenalty,
    '-12',
    'Mỗi lần thay đổi -3 điểm.',
    '4 × (-3) = -12 (điểm).',
  ],
  [
    'Tính hợp lí: (-37) + 18 + 37 + (-8).',
    '10',
    'Nhóm hai số đối nhau trước.',
    '(-37) + 18 + 37 + (-8) = [(-37) + 37] + [18 + (-8)] = 0 + 10 = 10.',
  ],
  [
    'Tính 18 − [(-3) × 4 + 6].',
    '24',
    'Nhân trước, tính trong ngoặc rồi thực hiện phép trừ.',
    '18 − [(-3) × 4 + 6] = 18 − [(-12) + 6] = 18 − (-6) = 18 + 6 = 24.',
  ],
];

export const integerLesson: MathLessonData = {
  id: 'math-integers-6',
  title: 'Số nguyên: nhận biết, so sánh và tính toán',
  grade: 6,
  topic: 'Số nguyên',
  goal: 'Nhận biết số nguyên, số đối; so sánh trên trục số và thực hiện các phép tính với số nguyên.',
  textbook:
    'Bài tự biên soạn theo chủ đề Số nguyên lớp 6; chưa gắn với trang hoặc ấn bản sách cụ thể.',
  teacherNotes:
    'Có thể chia thành hai buổi: nhận biết, so sánh, cộng và trừ; nhân, chia và vận dụng. Các phép chia trong bài đều là phép chia hết. Không chia cho 0.',
  blocks: [
    ...integerSetBlocks,
    block(
      'i-pre',
      'foundation',
      'Ôn lại số tự nhiên',
      'Em cần biết so sánh số tự nhiên, thực hiện bốn phép tính và thứ tự thực hiện phép tính. Với biểu thức có ngoặc, tính trong ngoặc trước; nhân, chia trước; cộng, trừ sau.'
    ),
    block(
      'i-discover',
      'explore',
      'Số nguyên xuất hiện ở đâu?',
      'Nhiệt độ 5 °C dưới 0 °C được viết là -5 °C. Độ cao 12 m dưới mực nước biển được viết là -12 m. Các số ..., -3, -2, -1, 0, 1, 2, 3, ... tạo thành tập hợp số nguyên, kí hiệu là ℤ. Số 0 không phải số nguyên âm cũng không phải số nguyên dương.'
    ),
    block(
      'i-line',
      'explore',
      'Trục số, số đối và so sánh',
      'Trên trục số nằm ngang, chiều từ trái sang phải là chiều tăng. Số nằm bên trái nhỏ hơn số nằm bên phải. Ví dụ: -5 < -2 < 0 < 3.\nTrong hai số nguyên âm, số nào có phần số tự nhiên lớn hơn thì số đó nhỏ hơn. Ví dụ: vì 9 > 4 nên -9 < -4.\nHai số đối nhau nằm ở hai phía của 0 và cách 0 một khoảng bằng nhau. Số đối của -5 là 5; số đối của 0 là 0.'
    ),
    block(
      'i-add',
      'explore',
      'Cộng hai số nguyên',
      'Cùng dấu: cộng hai phần số tự nhiên rồi đặt trước kết quả dấu chung. Ví dụ: (-3) + (-4) = -(3 + 4) = -7.\nKhác dấu (không đối nhau): tìm hiệu của hai phần số tự nhiên của chúng (số lớn trừ số nhỏ) rồi đặt trước hiệu tìm được dấu của số có phần số tự nhiên lớn hơn.\nHai số đối nhau có tổng bằng 0. Cộng một số với 0 được chính số đó.'
    ),
    block(
      'i-subtract',
      'explore',
      'Trừ hai số nguyên',
      'Muốn trừ số nguyên a cho số nguyên b, ta cộng a với số đối của b: a − b = a + (-b).\nVí dụ: 5 − (-3) = 5 + 3 = 8; (-5) − 3 = (-5) + (-3) = -8.'
    ),
    block(
      'i-brackets',
      'explore',
      'Quy tắc mở dấu ngoặc',
      'Khi bỏ dấu ngoặc có dấu cộng đứng trước, ta giữ nguyên dấu của các số hạng trong ngoặc.\nVí dụ: 6 + (-3 + 2) = 6 − 3 + 2 = 5.\nKhi bỏ dấu ngoặc có dấu trừ đứng trước, ta đổi dấu tất cả các số hạng trong ngoặc: dấu cộng thành dấu trừ, dấu trừ thành dấu cộng.\nVí dụ: 6 − (-3 + 2) = 6 + 3 − 2 = 7.\nChú ý đổi dấu từng số hạng, không chỉ số hạng đầu tiên.'
    ),
    block(
      'i-multiply',
      'explore',
      'Nhân và chia hết hai số nguyên',
      'Nhân hai số nguyên khác 0: nhân hai phần số tự nhiên, rồi đặt dấu âm nếu khác dấu, dấu dương nếu cùng dấu. Nhân với 0 được 0.\nChia hết hai số nguyên khác 0 cũng áp dụng quy tắc dấu như phép nhân. Ví dụ: (-20) : 5 = -4; (-20) : (-5) = 4. Số 0 chia cho số nguyên khác 0 được 0. Không chia cho 0.'
    ),
    block(
      'i-step1',
      'example',
      '1. Xét dấu và phần số tự nhiên',
      'Tính (-15) + 9. Hai số khác dấu, có phần số tự nhiên là 15 và 9; 15 > 9.'
    ),
    block(
      'i-step2',
      'example',
      '2. Lấy hiệu và đặt dấu',
      '(-15) + 9 = -(15 − 9) = -6.'
    ),
    block(
      'i-step3',
      'example',
      '3. Áp dụng quy tắc mở dấu ngoặc',
      '(-7) − (-12) = -7 + 12 = 12 − 7 = 5.\nDấu trừ đứng trước ngoặc nên khi bỏ ngoặc, -12 đổi thành +12.'
    ),
    block(
      'i-step4',
      'example',
      '4. Thực hiện đúng thứ tự',
      '8 + (-3) × 5 = 8 + (-15) = -(15 − 8) = -7.'
    ),
    block(
      'i-guided',
      'guided',
      'Em thử làm',
      'Với (-11) + 6, hãy so sánh 11 và 6, tính hiệu rồi đặt dấu phù hợp. Với 4 − (-9), hãy đổi phép trừ thành phép cộng số đối trước khi tính.'
    ),
  ],
  exercises: [
    exercise(
      'i-check1',
      'foundation',
      'Tính 15 − 9.',
      '6',
      'Lấy 15 bớt 9.',
      '15 − 9 = 6.'
    ),
    exercise(
      'i-check2',
      'foundation',
      'Tính 3 + 2 × 4.',
      '11',
      'Thực hiện phép nhân trước.',
      '3 + 2 × 4 = 3 + 8 = 11.'
    ),
    exercise(
      'i-guide1',
      'guided',
      'Tính (-11) + 6.',
      '-5',
      'Lấy 11 trừ 6 rồi đặt dấu âm.',
      '(-11) + 6 = -(11 − 6) = -5.'
    ),
    exercise(
      'i-guide2',
      'guided',
      'Tính 4 − (-9).',
      '13',
      'Số đối của -9 là 9.',
      '4 − (-9) = 4 + 9 = 13.'
    ),
    exercise(
      'i-test1',
      'practice',
      'Số nào nhỏ nhất?',
      '-8',
      'Số nguyên âm nhỏ hơn 0; so sánh hai số âm trên trục số.',
      '-8 < -3 < 0 < 2 nên -8 nhỏ nhất.',
      ['-3', '-8', '0', '2']
    ),
    exercise(
      'i-test2',
      'practice',
      'Tính (-4) × 6.',
      '-24',
      'Hai thừa số khác dấu cho tích âm.',
      '(-4) × 6 = -(4 × 6) = -24.'
    ),
    exercise(
      'i-test3',
      'practice',
      'Tính (-30) : (-5).',
      '6',
      'Hai số cùng dấu cho thương dương.',
      '(-30) : (-5) = 30 : 5 = 6.'
    ),
    exercise(
      'i-test4',
      'practice',
      'Tính 7 + (-2) × 5.',
      '-3',
      'Nhân trước, cộng sau.',
      '7 + (-2) × 5 = 7 + (-10) = -(10 − 7) = -3.'
    ),
    ...extra.map(([prompt, answer, hint, solution, options], i) =>
      exercise(
        `i-extra-${i + 1}`,
        'extra',
        prompt,
        answer,
        hint,
        solution,
        options,
        i < 4
          ? 'foundation'
          : i < 12
            ? 'skills'
            : i < 18
              ? 'application'
              : 'challenge'
      )
    ),
    ...integerSetExercises,
  ],
};
