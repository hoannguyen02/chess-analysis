import { MathBlock, MathExercise } from './lessons';

const block = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string
): MathBlock => ({ id, section, title, text, visual: 'none', values: [] });
const choice = (
  id: string,
  section: MathExercise['section'],
  prompt: string,
  options: string[],
  answer: string,
  hint: string,
  solution: string,
  group?: MathExercise['group']
): MathExercise => ({
  id,
  section,
  kind: 'choice',
  prompt,
  options,
  answer,
  hint,
  solution,
  unit: '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
  ...(group
    ? {
        group,
        skill: 'Tập hợp',
        difficulty: 'medium' as const,
        workspace: 'medium' as const,
      }
    : {}),
});
const written = (
  id: string,
  prompt: string,
  solution: string,
  criteria: string[]
): MathExercise => ({
  id,
  section: 'extra',
  kind: 'written',
  prompt,
  solution,
  criteria,
  answer: solution,
  options: [],
  hint: 'Xác định tập số đang xét, kiểm tra điều kiện rồi viết bằng hai cách.',
  unit: '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
  group: 'challenge',
  skill: 'Tập hợp',
  difficulty: 'hard',
  workspace: 'large',
});
const notation =
  'Tập hợp thường được đặt tên bằng chữ cái in hoa. Dùng dấu ngoặc nhọn { } và dấu chấm phẩy để ngăn cách các phần tử là số. Mỗi phần tử chỉ liệt kê một lần; thứ tự liệt kê không làm thay đổi tập hợp.\nx ∈ A đọc là “x thuộc A”; x ∉ A đọc là “x không thuộc A”. Kí hiệu ∅ chỉ tập hợp không có phần tử nào; {0} có một phần tử là 0 nên khác ∅.';

export const integerSetBlocks: MathBlock[] = [
  block(
    'i-sets-notation',
    'explore',
    'Tập hợp và kí hiệu',
    notation + '\nℤ là tập hợp các số nguyên: ℤ = {...; -2; -1; 0; 1; 2; ...}.'
  ),
  block(
    'i-sets-methods',
    'explore',
    'Hai cách cho một tập hợp',
    'Cách 1: Liệt kê các phần tử. Ví dụ: A = {-2; -1; 0; 1; 2}.\nCách 2: Chỉ ra tính chất đặc trưng của các phần tử. Cùng tập hợp đó viết là A = {x ∈ ℤ | -2 ≤ x < 3}.\nĐọc: A gồm các số nguyên x lớn hơn hoặc bằng -2 và nhỏ hơn 3. Dấu | có nghĩa là “sao cho”; x ∈ ℤ cho biết chỉ xét số nguyên. Cả hai cách đều dùng kí hiệu toán học.'
  ),
  block(
    'i-sets-example1',
    'example',
    'Tập hợp: từ điều kiện đến liệt kê',
    'Cho B = {x ∈ ℤ | -3 < x ≤ 1}.\nBước 1: Chỉ xét số nguyên, không lấy -3, có lấy 1.\nBước 2: Liệt kê B = {-2; -1; 0; 1}.\nBước 3: Kiểm tra: -2 ∈ B; -3 ∉ B. B có 4 phần tử.'
  ),
  block(
    'i-sets-example2',
    'example',
    'Tập hợp: từ liệt kê đến điều kiện',
    'Cho C = {-3; -2; -1}.\nCác phần tử là những số nguyên từ -3 đến -1. Vì vậy C = {x ∈ ℤ | -3 ≤ x < 0}.\nCó thể viết điều kiện tương đương: C = {x ∈ ℤ | -4 < x ≤ -1}.'
  ),
];
export const rationalSetBlocks: MathBlock[] = [
  block(
    'r-sets-notation',
    'explore',
    'Tập hợp số hữu tỉ và kí hiệu',
    notation +
      '\nℚ là tập hợp số hữu tỉ; ℤ là tập hợp số nguyên. Ví dụ: -1/2 ∈ ℚ; -1/2 ∉ ℤ; -3 ∈ ℤ và -3 ∈ ℚ.'
  ),
  block(
    'r-sets-methods',
    'explore',
    'Hai cách cho tập hợp số hữu tỉ',
    'Liệt kê: A = {-1/2; 0; 1/2; 1}.\nNêu tính chất đặc trưng: A = {x ∈ ℚ | x = k/2, k ∈ ℤ, -1 ≤ k ≤ 2}.\nDấu | đọc là “sao cho”. Ở đây k lần lượt bằng -1, 0, 1, 2; thay vào x = k/2 được đúng bốn phần tử đã liệt kê.\nKhông viết A = {x ∈ ℚ | -1/2 ≤ x ≤ 1}: điều kiện này còn chứa nhiều số khác, chẳng hạn 1/4.'
  ),
  block(
    'r-sets-example1',
    'example',
    'Tập hợp: thay từng giá trị để liệt kê',
    'Cho B = {x ∈ ℚ | x = k/3, k ∈ ℤ, -1 ≤ k ≤ 2}.\nBước 1: k ∈ {-1; 0; 1; 2}.\nBước 2: Thay từng giá trị vào x = k/3.\nBước 3: B = {-1/3; 0; 1/3; 2/3}.'
  ),
  block(
    'r-sets-example2',
    'example',
    'Phần tử trùng nhau và tập vô hạn',
    'A = {1/2; 2/4; 0} = {1/2; 0}, vì 1/2 = 2/4. A có 2 phần tử khác nhau.\nC = {x ∈ ℚ | 0 < x < 1} có vô số phần tử, ví dụ 1/2; 1/3; 1/4; ... Không thể liệt kê đầy đủ C bằng một danh sách hữu hạn.'
  ),
];
export const integerSetExercises: MathExercise[] = [
  choice(
    'i-sets-guided',
    'guided',
    'Cho A = {x ∈ ℤ | -1 ≤ x < 2}. Chọn cách liệt kê đúng.',
    ['{-1; 0; 1}', '{-1; 0; 1; 2}', '{0; 1}'],
    '{-1; 0; 1}',
    'Có lấy -1, không lấy 2.',
    'A = {-1; 0; 1}.'
  ),
  choice(
    'i-sets-practice',
    'practice',
    'Cho B = {-4; -3; -2}. Chọn điều kiện mô tả đúng B.',
    [
      'B = {x ∈ ℤ | -4 ≤ x ≤ -2}',
      'B = {x ∈ ℤ | -4 < x < -2}',
      'B = {x ∈ ℤ | x < -2}',
    ],
    'B = {x ∈ ℤ | -4 ≤ x ≤ -2}',
    'Cần lấy cả -4, -3 và -2, không lấy số khác.',
    'B gồm tất cả số nguyên từ -4 đến -2, kể cả hai đầu mút.'
  ),
  choice(
    'i-sets-extra1',
    'extra',
    'Cho A = {-2; 0; 3}. Khẳng định nào đúng?',
    ['-2 ∈ A', '1 ∈ A', '0 ∉ A'],
    '-2 ∈ A',
    'Kiểm tra từng phần tử trong danh sách.',
    '-2 được liệt kê trong A nên -2 ∈ A.',
    'foundation'
  ),
  choice(
    'i-sets-extra2',
    'extra',
    'Liệt kê B = {x ∈ ℤ | -2 < x ≤ 2}.',
    ['{-1; 0; 1; 2}', '{-2; -1; 0; 1; 2}', '{-1; 0; 1}'],
    '{-1; 0; 1; 2}',
    'Không lấy -2, có lấy 2.',
    'Các số nguyên thỏa mãn là -1, 0, 1, 2.',
    'skills'
  ),
  choice(
    'i-sets-extra3',
    'extra',
    'Một cảm biến ghi nhận nhiệt độ nguyên từ -2 °C đến 1 °C, kể cả hai đầu mút. Tập hợp các giá trị nhiệt độ là gì?',
    ['{-2; -1; 0; 1}', '{-2; 1}', '{-1; 0}'],
    '{-2; -1; 0; 1}',
    'Liệt kê tất cả số nguyên trong khoảng đã cho.',
    'T = {x ∈ ℤ | -2 ≤ x ≤ 1} = {-2; -1; 0; 1}.',
    'application'
  ),
  written(
    'i-sets-extra4',
    'Viết tập hợp C gồm các số nguyên lớn hơn -4 và nhỏ hơn 0 bằng hai cách. Cho biết số phần tử của C.',
    'C = {-3; -2; -1} = {x ∈ ℤ | -4 < x < 0}. C có 3 phần tử.',
    [
      'Liệt kê đủ -3, -2, -1, không lặp phần tử.',
      'Nêu miền số nguyên và điều kiện đúng (hoặc tương đương).',
      'Kết luận có 3 phần tử.',
    ]
  ),
];
export const rationalSetExercises: MathExercise[] = [
  choice(
    'r-sets-guided',
    'guided',
    'Cho A = {-1/2; 0; 3/4}. Khẳng định nào đúng?',
    ['3/4 ∈ A', '1/2 ∈ A', '0 ∉ A'],
    '3/4 ∈ A',
    'Đối chiếu với danh sách phần tử.',
    '3/4 là một phần tử của A.'
  ),
  choice(
    'r-sets-practice',
    'practice',
    'Cho A = {x ∈ ℚ | x = k/2, k ∈ ℤ, 0 ≤ k ≤ 2}. Chọn cách liệt kê đúng.',
    ['{0; 1/2; 1}', '{0; 1/2; 2}', '{1/2; 1}'],
    '{0; 1/2; 1}',
    'Thay k = 0, 1, 2 vào x = k/2.',
    'A = {0; 1/2; 1}.'
  ),
  choice(
    'r-sets-extra1',
    'extra',
    'Khẳng định nào đúng?',
    ['-2/3 ∈ ℚ', '-2/3 ∈ ℤ', '0 ∉ ℚ'],
    '-2/3 ∈ ℚ',
    'Số hữu tỉ viết được dưới dạng phân số có tử và mẫu nguyên, mẫu khác 0.',
    '-2/3 là số hữu tỉ nhưng không phải số nguyên; 0 cũng là số hữu tỉ.',
    'foundation'
  ),
  choice(
    'r-sets-extra2',
    'extra',
    'Tập hợp A = {1/2; 2/4; 0} có bao nhiêu phần tử khác nhau?',
    ['2', '3', '1'],
    '2',
    'Rút gọn 2/4 trước khi đếm.',
    '1/2 = 2/4 nên A = {1/2; 0}, có 2 phần tử.',
    'skills'
  ),
  choice(
    'r-sets-extra3',
    'extra',
    'Một bình chỉ có các vạch 0; 1/4; 1/2; 3/4; 1 lít. Chọn điều kiện mô tả đúng tập giá trị tại các vạch.',
    [
      'V = {x ∈ ℚ | x = k/4, k ∈ ℤ, 0 ≤ k ≤ 4}',
      'V = {x ∈ ℚ | 0 ≤ x ≤ 1}',
      'V = {x ∈ ℤ | 0 ≤ x ≤ 4}',
    ],
    'V = {x ∈ ℚ | x = k/4, k ∈ ℤ, 0 ≤ k ≤ 4}',
    'Chỉ xét năm vạch, không xét mọi số hữu tỉ từ 0 đến 1.',
    'Thay k = 0, 1, 2, 3, 4 được V = {0; 1/4; 1/2; 3/4; 1}.',
    'application'
  ),
  written(
    'r-sets-extra4',
    'Cho B = {x ∈ ℚ | x = k/2, k ∈ ℤ, -2 ≤ k ≤ 1}. Liệt kê B rồi viết lại bằng cách nêu tính chất đặc trưng. Số -1/4 có thuộc B không?',
    'B = {-1; -1/2; 0; 1/2} = {x ∈ ℚ | x = k/2, k ∈ ℤ, -2 ≤ k ≤ 1}. Số -1/4 ∉ B.',
    [
      'Thay đúng k = -2, -1, 0, 1 và liệt kê đủ bốn phần tử.',
      'Viết điều kiện với k nguyên và đúng giới hạn (hoặc điều kiện tương đương).',
      'Kết luận -1/4 không thuộc B.',
    ]
  ),
];
