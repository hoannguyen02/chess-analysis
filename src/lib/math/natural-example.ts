import { commonFactorBlocks, commonFactorExercises } from './gcd-lcm-content';
import { MathBlock, MathExercise, MathLessonData } from './lessons';

const block = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string
): MathBlock => ({ id, section, title, text, visual: 'none', values: [] });
const exercise = (
  id: string,
  section: MathExercise['section'],
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  options: string[] = [],
  group?: MathExercise['group']
): MathExercise => ({
  id,
  section,
  prompt,
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
        skill: 'Số tự nhiên',
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
type Row = [string, string, string, string, string[]?];
const extra: Row[] = [
  [
    'Khẳng định nào đúng?',
    '0 ∈ ℕ',
    'ℕ gồm 0, 1, 2, 3, ...',
    '0 là số tự nhiên; -1 và 1/2 không phải số tự nhiên.',
    ['0 ∈ ℕ', '-1 ∈ ℕ', '1/2 ∈ ℕ'],
  ],
  [
    'Cho A = {x ∈ ℕ | 2 ≤ x < 6}. Chọn cách liệt kê đúng.',
    '{2; 3; 4; 5}',
    'Có lấy 2, không lấy 6.',
    'A = {2; 3; 4; 5}.',
    ['{2; 3; 4; 5}', '{2; 3; 4; 5; 6}', '{3; 4; 5}'],
  ],
  [
    'Chữ số 7 trong số 47 205 có giá trị bằng bao nhiêu?',
    '7000',
    'Chữ số 7 ở hàng nghìn.',
    '7 × 1 000 = 7 000.',
  ],
  [
    'Số liền sau của 999 là số nào?',
    '1000',
    'Cộng thêm 1.',
    '999 + 1 = 1 000.',
  ],
  [
    'So sánh 5 098 và 5 108.',
    '5 098 < 5 108',
    'So sánh từ hàng cao nhất; hàng nghìn bằng nhau.',
    'Ở hàng trăm, 0 < 1 nên 5 098 < 5 108.',
    ['5 098 < 5 108', '5 098 > 5 108', '5 098 = 5 108'],
  ],
  [
    'Tính 125 + 375 + 48.',
    '548',
    'Nhóm 125 với 375.',
    '(125 + 375) + 48 = 500 + 48 = 548.',
  ],
  [
    'Tính 25 × 16.',
    '400',
    'Viết 16 = 4 × 4.',
    '25 × 16 = 25 × 4 × 4 = 100 × 4 = 400.',
  ],
  [
    'Tính 72 − 24 : 3.',
    '64',
    'Chia trước, trừ sau.',
    '72 − 24 : 3 = 72 − 8 = 64.',
  ],
  [
    'Tính (72 − 24) : 3.',
    '16',
    'Tính trong ngoặc trước.',
    '(72 − 24) : 3 = 48 : 3 = 16.',
  ],
  [
    'Tính 2³ + 3².',
    '17',
    'Tính các lũy thừa trước.',
    '2³ + 3² = 2 × 2 × 2 + 3 × 3 = 8 + 9 = 17.',
  ],
  [
    'Tìm số dư khi chia 47 cho 6.',
    '5',
    'Tìm bội lớn nhất của 6 không vượt quá 47.',
    '47 = 6 × 7 + 5; 0 ≤ 5 < 6. Số dư là 5.',
  ],
  [
    'Số nào chia hết cho cả 2 và 5?',
    '120',
    'Số chia hết cho cả 2 và 5 có chữ số tận cùng là 0.',
    '120 có chữ số tận cùng là 0.',
    ['120', '125', '132'],
  ],
  [
    'Số nào chia hết cho 9?',
    '234',
    'Tính tổng các chữ số.',
    '2 + 3 + 4 = 9 chia hết cho 9 nên 234 chia hết cho 9.',
    ['234', '235', '236'],
  ],
  [
    'Số nào là số nguyên tố?',
    '17',
    'Số nguyên tố lớn hơn 1 và chỉ có hai ước.',
    '17 chỉ có hai ước là 1 và 17. Số 1 không phải số nguyên tố; 21 = 3 × 7 là hợp số.',
    ['1', '17', '21'],
  ],
  [
    'Có 48 quyển vở, chia đều cho 6 bạn. Mỗi bạn nhận được bao nhiêu quyển vở?',
    '8',
    'Lấy tổng số vở chia cho số bạn.',
    'Số vở mỗi bạn nhận được là:\n48 : 6 = 8 (quyển).\nĐáp số: 8 quyển vở.',
  ],
  [
    'Mỗi hộp có 12 chiếc bút. Mua 5 hộp rồi phát 18 chiếc bút. Còn lại bao nhiêu chiếc bút?',
    '42',
    'Tính tổng số bút rồi trừ số đã phát.',
    'Tổng số bút là:\n12 × 5 = 60 (chiếc).\nSố bút còn lại là:\n60 − 18 = 42 (chiếc).\nĐáp số: 42 chiếc bút.',
  ],
  [
    'Có 53 học sinh, mỗi xe chở tối đa 8 học sinh. Cần ít nhất bao nhiêu xe?',
    '7',
    'Sau khi xếp đủ các xe, số học sinh còn lại cần thêm một xe.',
    '53 = 8 × 6 + 5. Sáu xe chở 48 học sinh, còn 5 học sinh cần thêm một xe.\nSố xe cần ít nhất là:\n6 + 1 = 7 (xe).\nĐáp số: 7 xe.',
  ],
  [
    'Tìm x ∈ ℕ: 3x + 5 = 26.',
    '7',
    'Trừ 5 ở hai vế rồi chia cho 3.',
    '3x = 26 − 5 = 21 → x = 21 : 3 = 7.',
  ],
  [
    'Tìm chữ số a để số 4a2 chia hết cho 9.',
    '3',
    'Tổng các chữ số là 4 + a + 2 = 6 + a.',
    'Vì 0 ≤ a ≤ 9 nên 6 ≤ 6 + a ≤ 15. Bội duy nhất của 9 trong khoảng này là 9.\n6 + a = 9 → a = 3.',
  ],
  [
    'Tính hợp lí: 1 + 2 + 3 + ... + 20.',
    '210',
    'Ghép số đầu với số cuối thành các cặp có tổng bằng nhau.',
    '(1 + 20) + (2 + 19) + ... + (10 + 11) = 21 × 10 = 210.',
  ],
];

export const combinedNaturalLesson: MathLessonData = {
  id: 'math-natural-6',
  title: 'Số tự nhiên: tập hợp, phép tính và tính chia hết',
  grade: 6,
  topic: 'Số tự nhiên',
  goal: 'Hiểu tập hợp số tự nhiên, giá trị chữ số, thứ tự thực hiện phép tính các dấu hiệu chia hết, ƯCLN và BCNN.',
  textbook:
    'Bài tự biên soạn theo chủ đề Số tự nhiên lớp 6; chưa gắn với trang hoặc ấn bản sách cụ thể.',
  teacherNotes:
    'Bài tổng quan, có thể chia thành nhiều buổi: tập hợp và ghi số; phép tính và lũy thừa; chia hết và vận dụng. Bổ sung phân tích thừa số nguyên tố, ƯCLN và BCNN trong buổi riêng.',
  blocks: [
    block(
      'n-pre',
      'foundation',
      'Ôn lại kiến thức đã học',
      'Em cần biết đọc, viết số, so sánh số và thực hiện cộng, trừ, nhân, chia với số tự nhiên. Chú ý phân biệt chữ số với số: số 205 được viết bằng ba chữ số 2, 0, 5.'
    ),
    block(
      'n-set',
      'explore',
      'Tập hợp số tự nhiên',
      'ℕ = {0; 1; 2; 3; ...}. Tập hợp các số tự nhiên khác 0 kí hiệu là ℕ* = {1; 2; 3; ...}.\nVí dụ: 0 ∈ ℕ nhưng 0 ∉ ℕ*. Số tự nhiên nhỏ nhất là 0; không có số tự nhiên lớn nhất. Số liền sau của n là n + 1. Số 0 không có số liền trước trong ℕ.'
    ),
    block(
      'n-set-methods',
      'explore',
      'Hai cách cho một tập hợp',
      'Liệt kê phần tử: A = {0; 1; 2; 3; 4}.\nNêu tính chất đặc trưng: A = {x ∈ ℕ | x < 5}.\nDấu | đọc là “sao cho”; x ∈ ℕ cho biết chỉ xét số tự nhiên. Viết các phần tử trong { }, ngăn cách bằng dấu chấm phẩy. Mỗi phần tử liệt kê một lần; thứ tự liệt kê không làm thay đổi tập hợp.'
    ),
    block(
      'n-digits',
      'explore',
      'Giá trị chữ số và so sánh',
      'Trong hệ thập phân, giá trị của một chữ số phụ thuộc vị trí của nó.\n4 305 = 4 × 1 000 + 3 × 100 + 0 × 10 + 5.\nKhi so sánh các số tự nhiên viết không có chữ số 0 ở đầu: số có nhiều chữ số hơn thì lớn hơn. Nếu cùng số chữ số, so sánh từng cặp chữ số từ trái sang phải. Ví dụ: 4 305 < 4 350 vì ở hàng chục, 0 < 5.'
    ),
    block(
      'n-properties',
      'explore',
      'Phép tính và tính chất',
      'Phép cộng và phép nhân có tính giao hoán, kết hợp. Phép nhân phân phối đối với phép cộng: a × (b + c) = a × b + a × c.\nVí dụ: 25 × 12 = 25 × (4 × 3) = (25 × 4) × 3 = 300.\nTrong ℕ, phép trừ a − b thực hiện được khi a ≥ b. Không chia cho 0. Nhân với 0 được 0; nhân với 1 được chính số đó.'
    ),
    block(
      'n-order',
      'explore',
      'Lũy thừa và thứ tự thực hiện phép tính',
      'Lũy thừa với số mũ tự nhiên khác 0 là tích của các thừa số bằng nhau: 2³ = 2 × 2 × 2 = 8. Số 2 là cơ số, số 3 là số mũ. Với a khác 0, a⁰ = 1.\nCó ngoặc: tính trong ngoặc trước, từ trong ra ngoài. Không có ngoặc: lũy thừa trước; nhân, chia tiếp theo; cộng, trừ sau cùng. Các phép tính cùng mức ưu tiên thực hiện từ trái sang phải.'
    ),
    block(
      'n-division',
      'explore',
      'Chia hết và chia có dư',
      'Với a, b ∈ ℕ và b khác 0, ta viết a = b × q + r, trong đó q là thương và 0 ≤ r < b.\nNếu r = 0 thì a chia hết cho b. Nếu r > 0 thì phép chia có dư.\nVí dụ: 29 = 5 × 5 + 4, nên 29 chia 5 được thương 5, dư 4.'
    ),
    block(
      'n-divisibility',
      'explore',
      'Dấu hiệu chia hết',
      'Chia hết cho 2: chữ số tận cùng là 0, 2, 4, 6 hoặc 8.\nChia hết cho 5: chữ số tận cùng là 0 hoặc 5.\nChia hết cho 3: tổng các chữ số chia hết cho 3.\nChia hết cho 9: tổng các chữ số chia hết cho 9.\nVí dụ: 234 chia hết cho 2 vì tận cùng là 4; chia hết cho 3 và 9 vì 2 + 3 + 4 = 9.'
    ),
    block(
      'n-primes',
      'explore',
      'Ước, bội, số nguyên tố và hợp số',
      'Với b khác 0, nếu a chia hết cho b thì a là bội của b và b là ước của a. Ví dụ: các ước của 6 là 1, 2, 3, 6; các bội tự nhiên của 6 là 0, 6, 12, 18, ...\nSố nguyên tố là số tự nhiên lớn hơn 1 chỉ có hai ước là 1 và chính nó. Hợp số là số tự nhiên lớn hơn 1 có nhiều hơn hai ước.\nVí dụ: 2, 3, 5 là số nguyên tố; 4, 6 là hợp số. Số 0 và số 1 không phải số nguyên tố cũng không phải hợp số.'
    ),
    block(
      'n-example-set',
      'example',
      '1. Viết tập hợp bằng hai cách',
      'Cho B gồm các số tự nhiên lớn hơn 1 và không lớn hơn 5.\nLiệt kê: B = {2; 3; 4; 5}.\nTính chất đặc trưng: B = {x ∈ ℕ | 1 < x ≤ 5}.\nCó lấy 5 vì điều kiện là x ≤ 5; không lấy 1 vì điều kiện là x > 1.'
    ),
    block(
      'n-example-order',
      'example',
      '2. Tính đúng thứ tự',
      'Tính 36 : (2 + 4) + 3² × 2.\n= 36 : 6 + 9 × 2\n= 6 + 18\n= 24.'
    ),
    block(
      'n-example-division',
      'example',
      '3. Tìm thương và số dư',
      'Chia 47 cho 6.\n6 × 7 = 42; 6 × 8 = 48 > 47.\n47 − 42 = 5. Vậy 47 = 6 × 7 + 5.\nThương là 7, số dư là 5; kiểm tra 0 ≤ 5 < 6.'
    ),
    ...commonFactorBlocks,
    block(
      'n-guided',
      'guided',
      'Em thử làm',
      'Với 50 − 6 × 7, hãy nhân trước rồi trừ.\nVới tập hợp C = {x ∈ ℕ | 1 < x ≤ 4}, hãy xác định có lấy 1 và 4 hay không, rồi liệt kê các phần tử.'
    ),
  ],
  exercises: [
    exercise(
      'n-check1',
      'foundation',
      'Tính 8 × 7.',
      '56',
      'Nhớ bảng nhân 7 hoặc 8.',
      '8 × 7 = 56.'
    ),
    exercise(
      'n-check2',
      'foundation',
      'Số nào lớn hơn?',
      '507',
      'So sánh chữ số hàng trăm.',
      '5 > 4 nên 507 > 495.',
      ['495', '507']
    ),
    exercise(
      'n-guided1',
      'guided',
      'Tính 50 − 6 × 7.',
      '8',
      'Nhân trước, trừ sau.',
      '50 − 6 × 7 = 50 − 42 = 8.'
    ),
    exercise(
      'n-guided2',
      'guided',
      'Liệt kê C = {x ∈ ℕ | 1 < x ≤ 4}.',
      '{2; 3; 4}',
      'Không lấy 1, có lấy 4.',
      'C = {2; 3; 4}.',
      ['{2; 3; 4}', '{1; 2; 3; 4}', '{2; 3}']
    ),
    exercise(
      'n-test1',
      'practice',
      'Tính 4² − 12 : 3.',
      '12',
      'Tính lũy thừa và phép chia trước.',
      '4² − 12 : 3 = 16 − 4 = 12.'
    ),
    exercise(
      'n-test2',
      'practice',
      'Tìm số dư khi chia 32 cho 5.',
      '2',
      'Viết 32 = 5 × q + r, với r < 5.',
      '32 = 5 × 6 + 2. Số dư là 2.'
    ),
    exercise(
      'n-test3',
      'practice',
      'Số nào chia hết cho 3?',
      '123',
      'Xét tổng các chữ số.',
      '1 + 2 + 3 = 6 chia hết cho 3 nên 123 chia hết cho 3.',
      ['121', '122', '123']
    ),
    exercise(
      'n-test4',
      'practice',
      'Số nào là số nguyên tố?',
      '13',
      'Xét các ước.',
      '13 chỉ có hai ước là 1 và 13.',
      ['1', '9', '13']
    ),
    ...extra.map(([prompt, answer, hint, solution, options], i) =>
      exercise(
        `n-extra-${i + 1}`,
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
    ...commonFactorExercises,
  ],
};


export const isDivisibilityBlock = (item: { id: string }) =>
  ['n-division', 'n-divisibility', 'n-primes', 'n-example-division'].includes(item.id) || item.id.startsWith('n-common-');
export const isDivisibilityExercise = (item: { id: string }) =>
  ['n-test2', 'n-test3', 'n-test4', 'n-extra-11', 'n-extra-12', 'n-extra-13', 'n-extra-14', 'n-extra-19'].includes(item.id) || item.id.startsWith('n-common-');

export const naturalLesson: MathLessonData = {
  ...combinedNaturalLesson,
  title: 'Số tự nhiên: tập hợp và phép tính',
  goal: 'Hiểu tập hợp số tự nhiên, giá trị chữ số, lũy thừa và thứ tự thực hiện phép tính.',
  teacherNotes: 'Bài tổng quan về tập hợp, ghi số, phép tính và lũy thừa. Học tiếp bài Tính chia hết, số nguyên tố, ƯCLN và BCNN.',
  blocks: combinedNaturalLesson.blocks.filter(b => !isDivisibilityBlock(b)),
  exercises: combinedNaturalLesson.exercises.filter(e => !isDivisibilityExercise(e)),
};

export const divisibilityLesson: MathLessonData = {
  id: 'math-divisibility-6',
  title: 'Tính chia hết, số nguyên tố, ƯCLN và BCNN',
  grade: 6,
  topic: 'Tính chia hết',
  goal: 'Nhận biết tính chia hết, vận dụng dấu hiệu chia hết, phân tích thừa số nguyên tố và tìm ƯC, ƯCLN, BC, BCNN.',
  textbook: combinedNaturalLesson.textbook,
  teacherNotes: 'Học sau bài Số tự nhiên: tập hợp và phép tính. Có thể chia thành hai buổi: chia hết và số nguyên tố; ƯCLN, BCNN và vận dụng.',
  blocks: [
    block('d-pre', 'foundation', 'Em cần biết gì trước?', 'Ôn bảng nhân, phép chia và lũy thừa. Ví dụ: 24 : 6 = 4; 2³ = 8. Biết liệt kê các phần tử của một tập hợp.'),
    ...combinedNaturalLesson.blocks.filter(isDivisibilityBlock).map(b => ({...b, title: b.section === 'example' ? b.title.replace(/^\d+\. /, '') : b.title})),
    block('d-guided', 'guided', 'Em thử làm', 'Tìm các ước chung bằng cách liệt kê hoặc phân tích thừa số nguyên tố. Khi tìm BCNN, chú ý chọn bội chung nhỏ nhất khác 0.'),
  ],
  exercises: [
    exercise('d-check', 'foundation', 'Tính 24 : 6.', '4', 'Tìm số nhân với 6 được 24.', '24 : 6 = 4.'),
    ...combinedNaturalLesson.exercises.filter(isDivisibilityExercise),
  ],
};
