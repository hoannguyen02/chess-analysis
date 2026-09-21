import { primaryFractionLessons } from './primary-fraction-lessons';
import { fractionLessons } from './fraction-lessons';
import { naturalLesson, divisibilityLesson } from './natural-example';
import { integerLesson } from './integer-example';
import { rationalLesson } from './rational-example';
import { fractionExtraExercises } from './extra-examples';
import { MathBlock, MathExercise, MathLessonData } from './lessons';
const b = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string,
  visual: MathBlock['visual'] = 'none',
  values: number[] = []
): MathBlock => ({ id, section, title, text, visual, values });
const e = (
  id: string,
  section: MathExercise['section'],
  kind: MathExercise['kind'],
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  extra: Partial<MathExercise> = {}
): MathExercise => ({
  id,
  section,
  kind,
  prompt,
  answer,
  hint,
  solution,
  unit: '',
  options: [],
  simplified: false,
  tolerance: 0,
  mistakes: [],
  ...extra,
});
const textbook =
  'Bài mẫu tự biên soạn. Chưa đối chiếu số bài, trang và ấn bản; cần giáo viên thẩm định trước khi dùng chính thức.';
export const exampleLessons: MathLessonData[] = [
  {
    id: 'math-fractions-6',
    title: 'Cộng hai phân số khác mẫu số',
    grade: 6,
    topic: 'Phân số mở rộng',
    goal: 'Ôn phép cộng phân số đã học ở tiểu học; luyện quy đồng các mẫu bất kì ở lớp 6.',
    textbook,
    teacherNotes:
      'Cho học sinh giải thích ý nghĩa của mẫu số bằng hình trước khi học quy tắc.',
    blocks: [
      b(
        'f-pre',
        'foundation',
        'Em cần biết gì trước?',
        'Biết tìm bội chung và tạo phân số bằng nhau bằng cách nhân cả tử và mẫu với cùng một số nguyên khác 0.'
      ),
      b(
        'f-discover',
        'explore',
        'Vì sao cần cùng mẫu số?',
        'Hai thanh biểu diễn hai đơn vị cùng độ dài. Một nửa và một phần ba có kích thước khác nhau. Hãy chia thành các phần bằng nhau để cộng.',
        'fractions',
        [1, 2, 1, 3]
      ),
      b(
        'f-example-1',
        'example',
        '1. Chọn mẫu số chung',
        'Tính 1/2 + 1/3. Số 6 chia hết cho cả 2 và 3, nên chọn mẫu số chung là 6.'
      ),
      b(
        'f-example-2',
        'example',
        '2. Quy đồng',
        '1/2 = (1 × 3)/(2 × 3) = 3/6.\n1/3 = (1 × 2)/(3 × 2) = 2/6.'
      ),
      b(
        'f-example-3',
        'example',
        '3. Cộng tử số, giữ mẫu số',
        '3/6 + 2/6 = (3 + 2)/6 = 5/6. Phân số đã tối giản.\nKhông cộng mẫu số vì ta đang đếm các phần sáu.'
      ),
      b(
        'f-guided',
        'guided',
        'Hoàn thành bước cuối',
        '1/4 + 1/6 = 3/12 + 2/12. Hãy cộng các tử số và giữ mẫu số chung.'
      ),
    ],
    exercises: [
      e(
        'f-check',
        'foundation',
        'choice',
        'Phân số nào bằng 1/2?',
        '3/6',
        'Nhân cả tử và mẫu với 3.',
        '1/2 = 3/6.',
        { options: ['2/3', '3/6', '1/6'] }
      ),
      e(
        'f-common',
        'foundation',
        'number',
        'Số tự nhiên nhỏ nhất khác 0 chia hết cho cả 2 và 3 là?',
        '6',
        'Liệt kê bội của 2 và bội của 3.',
        '6 : 2 = 3 và 6 : 3 = 2.'
      ),
      e(
        'f-try',
        'guided',
        'fraction',
        'Tính 1/4 + 1/6.',
        '5/12',
        'Cộng 3 và 2, giữ mẫu số 12.',
        '3/12 + 2/12 = 5/12.',
        {
          mistakes: [
            {
              answer: '5/24',
              feedback:
                'Em đã cộng cả mẫu số. Chỉ cộng tử số, giữ nguyên mẫu số chung 12.',
            },
          ],
        }
      ),
      e(
        'f-q1',
        'practice',
        'fraction',
        'Tính 1/3 + 1/6.',
        '1/2',
        'Chọn mẫu số chung là 6.',
        '1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2.'
      ),
      e(
        'f-q2',
        'practice',
        'fraction',
        'Tính 2/5 + 1/2.',
        '9/10',
        'Chọn mẫu số chung là 10.',
        '2/5 + 1/2 = 4/10 + 5/10 = 9/10.'
      ),
      e(
        'f-q3',
        'practice',
        'fraction',
        'Tính 3/4 + 1/6.',
        '11/12',
        'Chọn mẫu số chung là 12.',
        '3/4 + 1/6 = 9/12 + 2/12 = 11/12.'
      ),
      ...fractionExtraExercises,
    ],
  },
  {
    id: 'math-arithmetic-3',
    title: 'Nhân số có hai chữ số với số có một chữ số',
    grade: 3,
    topic: 'Số học',
    goal: 'Tách chục và đơn vị để hiểu phép nhân có nhớ.',
    textbook,
    teacherNotes:
      'Cho học sinh thử giải thích vì sao 18 đơn vị bằng 1 chục và 8 đơn vị.',
    blocks: [
      b(
        'a-pre',
        'foundation',
        'Ôn bảng nhân',
        'Em cần nhớ bảng nhân 3 và cách tách số thành chục, đơn vị.'
      ),
      b(
        'a-discover',
        'explore',
        'Tách số để tính dễ hơn',
        'Có 3 hộp bút, mỗi hộp 26 chiếc. Tổng số bút là 26 × 3.\n26 gồm 2 chục và 6 đơn vị.'
      ),
      b(
        'a-step1',
        'example',
        '1. Nhân phần đơn vị',
        '6 × 3 = 18. Ta được 18 đơn vị.'
      ),
      b(
        'a-step2',
        'example',
        '2. Nhân phần chục',
        '20 × 3 = 60. Ta được 6 chục.'
      ),
      b(
        'a-step3',
        'example',
        '3. Gộp lại',
        '26 × 3 = 60 + 18 = 78.\nĐáp số: 78 chiếc bút.'
      ),
      b(
        'a-guide',
        'guided',
        'Cùng tính 24 × 3',
        '20 × 3 = 60 và 4 × 3 = 12. Hãy cộng hai kết quả.'
      ),
    ],
    exercises: [
      e(
        'a-check',
        'foundation',
        'number',
        '6 × 3 bằng bao nhiêu?',
        '18',
        '6 + 6 + 6.',
        '6 × 3 = 18.'
      ),
      e(
        'a-try',
        'guided',
        'number',
        '24 × 3 = ?',
        '72',
        'Cộng 60 với 12.',
        '24 × 3 = 60 + 12 = 72.'
      ),
      e(
        'a-q1',
        'practice',
        'number',
        '32 × 2 = ?',
        '64',
        'Tách 32 thành 30 + 2.',
        '30 × 2 + 2 × 2 = 60 + 4 = 64.'
      ),
      e(
        'a-q2',
        'practice',
        'number',
        '18 × 4 = ?',
        '72',
        'Tách 18 thành 10 + 8.',
        '10 × 4 + 8 × 4 = 40 + 32 = 72.'
      ),
    ],
  },
  {
    id: 'math-rectangle-4',
    title: 'Chu vi và diện tích hình chữ nhật',
    grade: 4,
    topic: 'Hình học',
    goal: 'Phân biệt độ dài đường bao và phần mặt phẳng bên trong; dùng đúng đơn vị.',
    textbook,
    teacherNotes: 'Nhấn mạnh cm đo độ dài, cm² đo diện tích.',
    blocks: [
      b(
        'g-pre',
        'foundation',
        'Hai đại lượng khác nhau',
        'Chu vi là độ dài đường bao. Diện tích là độ lớn phần mặt phẳng bên trong.'
      ),
      b(
        'g-discover',
        'explore',
        'Quan sát hình chữ nhật',
        'Hình chữ nhật có chiều dài 8 cm, chiều rộng 5 cm. Hai cặp cạnh đối diện bằng nhau.',
        'rectangle',
        [8, 5]
      ),
      b(
        'g-step1',
        'example',
        '1. Tính chu vi',
        'Chu vi = (chiều dài + chiều rộng) × 2.\n(8 + 5) × 2 = 26 (cm).'
      ),
      b(
        'g-step2',
        'example',
        '2. Tính diện tích',
        'Diện tích = chiều dài × chiều rộng.\n8 × 5 = 40 (cm²).'
      ),
      b(
        'g-guide',
        'guided',
        'Đổi kích thước',
        'Một hình chữ nhật khác dài 6 cm, rộng 4 cm. Để tính chu vi, cộng hai kích thước rồi nhân 2.'
      ),
    ],
    exercises: [
      e(
        'g-check',
        'foundation',
        'choice',
        'Đơn vị nào dùng để đo diện tích?',
        'cm²',
        'Diện tích đếm các ô vuông đơn vị.',
        'cm² là xăng-ti-mét vuông.',
        { options: ['cm', 'cm²', 'kg'] }
      ),
      e(
        'g-try',
        'guided',
        'number',
        'Hình chữ nhật dài 6 cm, rộng 4 cm. Tính chu vi.',
        '20',
        '(6 + 4) × 2.',
        '(6 + 4) × 2 = 20 (cm).',
        { unit: 'cm' }
      ),
      e(
        'g-q1',
        'practice',
        'number',
        'Hình chữ nhật dài 9 cm, rộng 3 cm. Tính diện tích.',
        '27',
        'Nhân chiều dài với chiều rộng.',
        '9 × 3 = 27 (cm²).',
        { unit: 'cm²' }
      ),
      e(
        'g-q2',
        'practice',
        'number',
        'Hình chữ nhật dài 9 cm, rộng 3 cm. Tính chu vi.',
        '24',
        'Cộng chiều dài với chiều rộng rồi nhân 2.',
        '(9 + 3) × 2 = 24 (cm).',
        { unit: 'cm' }
      ),
    ],
  },
  {
    id: 'math-equation-8',
    title: 'Giải phương trình bậc nhất một ẩn',
    grade: 8,
    topic: 'Đại số',
    goal: 'Biến đổi hai vế để tìm nghiệm và thử lại nghiệm.',
    textbook,
    teacherNotes: '',
    blocks: [
      b(
        'e-pre',
        'foundation',
        'Giữ hai vế bằng nhau',
        'Khi cộng hoặc trừ cùng một số vào hai vế, ta được phương trình tương đương.'
      ),
      b(
        'e-discover',
        'explore',
        'Tìm số chưa biết',
        '3x + 5 = 20 nghĩa là ba lần một số, cộng 5, được 20.'
      ),
      b(
        'e-step1',
        'example',
        '1. Trừ 5 ở hai vế',
        '3x + 5 − 5 = 20 − 5\n3x = 15.'
      ),
      b('e-step2', 'example', '2. Chia hai vế cho 3', 'x = 15 : 3 = 5.'),
      b(
        'e-step3',
        'example',
        '3. Thử lại',
        'Thay x = 5: 3 × 5 + 5 = 20. Vậy nghiệm là x = 5.'
      ),
      b(
        'e-guide',
        'guided',
        'Hoàn thành lời giải',
        '2x + 4 = 18 → 2x = 14. Em hãy tìm x.'
      ),
    ],
    exercises: [
      e(
        'e-check',
        'foundation',
        'choice',
        'Để bỏ +5 trong 3x + 5 = 20, ta làm gì?',
        'Trừ 5 ở cả hai vế',
        'Hai vế phải được biến đổi như nhau.',
        'Trừ 5 ở hai vế được 3x = 15.',
        {
          options: [
            'Trừ 5 ở cả hai vế',
            'Chỉ trừ 5 ở vế trái',
            'Cộng 5 ở vế phải',
          ],
        }
      ),
      e(
        'e-try',
        'guided',
        'number',
        'Tìm x: 2x + 4 = 18.',
        '7',
        'Chia hai vế của 2x = 14 cho 2.',
        '2x = 14 → x = 7.'
      ),
      e(
        'e-q1',
        'practice',
        'number',
        'Tìm x: 4x − 3 = 17.',
        '5',
        'Cộng 3 ở hai vế rồi chia cho 4.',
        '4x = 20 → x = 5.'
      ),
      e(
        'e-q2',
        'practice',
        'number',
        'Tìm x: 5x + 2 = 12.',
        '2',
        'Trừ 2 ở hai vế rồi chia cho 5.',
        '5x = 10 → x = 2.'
      ),
    ],
  },
  rationalLesson,
  integerLesson,
  naturalLesson,
  divisibilityLesson,
  ...fractionLessons,
  ...primaryFractionLessons,
];
