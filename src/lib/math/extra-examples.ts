import { MathExercise } from './lessons';
const q = (
  index: number,
  group: NonNullable<MathExercise['group']>,
  skill: string,
  kind: MathExercise['kind'],
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  extra: Partial<MathExercise> = {}
): MathExercise => ({
  id: `fraction-extra-${index}`,
  section: 'extra',
  group,
  skill,
  kind,
  prompt,
  answer,
  hint,
  solution,
  options: [],
  unit: '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
  workspace:
    group === 'application' || group === 'challenge' ? 'large' : 'small',
  difficulty:
    group === 'challenge'
      ? 'hard'
      : group === 'application'
        ? 'medium'
        : 'easy',
  ...extra,
});
export const fractionExtraExercises: MathExercise[] = [
  q(
    1,
    'foundation',
    'Phân số bằng nhau',
    'choice',
    'Phân số nào bằng 2/3?',
    '4/6',
    'Nhân cả tử và mẫu với cùng một số.',
    '2/3 = (2 × 2)/(3 × 2) = 4/6.',
    { options: ['3/4', '4/6', '2/6', '4/3'] }
  ),
  q(
    2,
    'foundation',
    'Mẫu số chung',
    'number',
    'Tìm mẫu số chung nhỏ nhất của 1/4 và 1/6.',
    '12',
    'Liệt kê các bội của 4 và 6.',
    'Các bội dương của 4: 4, 8, 12,…; của 6: 6, 12,… Mẫu số chung nhỏ nhất là 12.'
  ),
  q(
    3,
    'foundation',
    'Quy đồng',
    'number',
    'Điền số vào ô trống: 3/5 = □/20.',
    '12',
    '5 nhân với số nào để được 20?',
    '5 × 4 = 20 nên tử số cũng nhân với 4: 3 × 4 = 12.'
  ),
  q(
    4,
    'foundation',
    'Nhận biết lỗi',
    'choice',
    'Bạn An tính 1/2 + 1/3 = 2/5. An sai ở đâu?',
    'Cộng cả tử và mẫu',
    'Hai phân số đã cùng mẫu số chưa?',
    'Phải quy đồng: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Không cộng hai mẫu số.',
    {
      options: [
        'Cộng cả tử và mẫu',
        'Quên đổi dấu cộng',
        'Chọn mẫu chung là 6',
        'Rút gọn quá sớm',
      ],
    }
  ),
  q(
    5,
    'skills',
    'Cộng cùng mẫu',
    'fraction',
    'Tính 2/7 + 3/7.',
    '5/7',
    'Cộng tử số, giữ mẫu 7.',
    '2/7 + 3/7 = (2 + 3)/7 = 5/7.'
  ),
  q(
    6,
    'skills',
    'Mẫu số là bội của nhau',
    'fraction',
    'Tính 1/4 + 3/8.',
    '5/8',
    'Đổi 1/4 về mẫu 8.',
    '1/4 + 3/8 = 2/8 + 3/8 = 5/8.'
  ),
  q(
    7,
    'skills',
    'Mẫu số nguyên tố cùng nhau',
    'fraction',
    'Tính 2/3 + 1/5.',
    '13/15',
    'Chọn mẫu chung là 15.',
    '2/3 + 1/5 = 10/15 + 3/15 = 13/15.'
  ),
  q(
    8,
    'skills',
    'Mẫu số có ước chung',
    'fraction',
    'Tính 1/6 + 1/4.',
    '5/12',
    'Chọn mẫu chung là 12.',
    '1/6 + 1/4 = 2/12 + 3/12 = 5/12.'
  ),
  q(
    9,
    'skills',
    'Rút gọn kết quả',
    'fraction',
    'Tính 1/6 + 1/3 và viết kết quả tối giản.',
    '1/2',
    'Cộng theo mẫu 6 rồi rút gọn.',
    '1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2.',
    { simplified: true }
  ),
  q(
    10,
    'skills',
    'Tổng lớn hơn 1',
    'fraction',
    'Tính 3/4 + 2/3. Viết kết quả dưới dạng phân số.',
    '17/12',
    'Chọn mẫu chung là 12. Tử số có thể lớn hơn mẫu số.',
    '3/4 + 2/3 = 9/12 + 8/12 = 17/12.'
  ),
  q(
    11,
    'skills',
    'Rút gọn kết quả',
    'fraction',
    'Tính 5/12 + 1/4 và viết kết quả tối giản.',
    '2/3',
    'Đổi 1/4 về mẫu 12.',
    '5/12 + 1/4 = 5/12 + 3/12 = 8/12 = 2/3.',
    { simplified: true }
  ),
  q(
    12,
    'skills',
    'Cộng ba phân số',
    'fraction',
    'Tính 1/2 + 1/3 + 1/6. Viết kết quả dưới dạng phân số.',
    '1/1',
    'Đổi cả ba về mẫu 6.',
    '1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1/1.'
  ),
  q(
    13,
    'application',
    'Tìm số còn thiếu',
    'fraction',
    'Điền phân số còn thiếu: □ + 1/4 = 5/6.',
    '7/12',
    'Đổi 5/6 và 1/4 về mẫu 12, rồi tìm phần còn thiếu.',
    '5/6 = 10/12 và 1/4 = 3/12. Phần còn thiếu là 7/12 vì 7/12 + 3/12 = 10/12.'
  ),
  q(
    14,
    'application',
    'So sánh tổng',
    'choice',
    'So sánh 1/3 + 1/4 với 1/2.',
    'Lớn hơn',
    'Đổi về mẫu 12.',
    '1/3 + 1/4 = 7/12; 1/2 = 6/12. Vì 7/12 > 6/12 nên tổng lớn hơn 1/2.',
    { options: ['Nhỏ hơn', 'Bằng nhau', 'Lớn hơn'] }
  ),
  q(
    15,
    'application',
    'Đo độ dài',
    'fraction',
    'Lan nối một đoạn dây dài 2/5 m với một đoạn dài 1/4 m (không chồng lên nhau). Tổng chiều dài là bao nhiêu mét?',
    '13/20',
    'Chọn mẫu chung là 20.',
    '2/5 + 1/4 = 8/20 + 5/20 = 13/20 (m).',
    { unit: 'm' }
  ),
  q(
    16,
    'application',
    'Bài toán thực tế',
    'fraction',
    'Buổi sáng Mai đọc 1/3 quyển sách, buổi chiều đọc thêm 1/6 quyển sách. Mai đã đọc bao nhiêu phần quyển sách?',
    '1/2',
    'Cộng hai phần đã đọc.',
    '1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2 quyển sách.'
  ),
  q(
    17,
    'application',
    'Đo dung tích',
    'fraction',
    'Bình có 3/8 lít nước. Rót thêm 1/4 lít. Trong bình có bao nhiêu lít nước?',
    '5/8',
    'Đổi 1/4 thành 2/8.',
    '3/8 + 1/4 = 3/8 + 2/8 = 5/8 (lít).',
    { unit: 'lít' }
  ),
  q(
    18,
    'application',
    'Đo thời gian',
    'fraction',
    'Nam học Toán 1/2 giờ và đọc sách 1/3 giờ. Tổng thời gian là bao nhiêu giờ?',
    '5/6',
    'Chọn mẫu chung là 6.',
    '1/2 + 1/3 = 3/6 + 2/6 = 5/6 (giờ).',
    { unit: 'giờ' }
  ),
  q(
    19,
    'challenge',
    'Giải thích sai lầm',
    'written',
    'Một bạn nói: “1/2 + 1/3 = 2/5 vì cộng tử với tử, mẫu với mẫu”. Hãy giải thích vì sao sai và trình bày cách làm đúng.',
    'Lời giải mẫu',
    'Mẫu số cho biết kích thước của mỗi phần.',
    'Một phần hai và một phần ba có kích thước khác nhau nên không cộng trực tiếp số phần. Quy đồng về phần sáu: 1/2 = 3/6, 1/3 = 2/6. Vậy tổng là 5/6, không phải 2/5.',
    {
      criteria: [
        'Nêu được hai phân số đang biểu diễn các phần có kích thước khác nhau.',
        'Quy đồng đúng về mẫu 6.',
        'Kết luận tổng là 5/6 và không cộng mẫu số.',
      ],
    }
  ),
  q(
    20,
    'challenge',
    'So sánh cách giải',
    'written',
    'Để tính 1/6 + 1/4, Bình chọn mẫu chung 24, còn Hà chọn mẫu chung 12. Cả hai cách có đúng không? Hãy giải bằng cả hai cách và giải thích cách nào gọn hơn.',
    'Lời giải mẫu',
    '12 và 24 có chia hết cho cả 6 và 4 không?',
    'Cả hai cách đều đúng. Theo Bình: 1/6 + 1/4 = 4/24 + 6/24 = 10/24 = 5/12. Theo Hà: 1/6 + 1/4 = 2/12 + 3/12 = 5/12. Chọn 12 gọn hơn vì đây là mẫu chung nhỏ nhất và không cần rút gọn kết quả.',
    {
      criteria: [
        'Khẳng định cả hai mẫu chung đều hợp lệ.',
        'Tính đúng bằng cả mẫu 24 và mẫu 12.',
        'Giải thích chọn mẫu 12 giúp số nhỏ hơn và ít bước hơn.',
      ],
    }
  ),
];
