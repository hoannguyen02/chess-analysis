import type { MathExercise } from './lessons';

// Each tier adds a new reasoning demand, rather than just changing numbers.
const practice = (
  id: string,
  difficulty: 'easy' | 'medium' | 'hard',
  skill: string,
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  options: string[] = []
): MathExercise => ({
  id: `angle-more-${id}`,
  section: 'extra',
  kind: options.length ? 'choice' : 'number',
  prompt,
  answer,
  hint,
  solution,
  ...(difficulty === 'easy' ? { solutionStyle: 'explanation' as const } : {}),
  options,
  unit: id === 'b3' ? '°' : '',
  simplified: false,
  tolerance: 0,
  mistakes: [],
  group:
    difficulty === 'easy'
      ? 'foundation'
      : difficulty === 'medium'
        ? 'skills'
        : 'challenge',
  task:
    difficulty === 'easy'
      ? 'Nhận biết và đọc góc'
      : difficulty === 'medium'
        ? 'Vận dụng tính chất góc'
        : 'Kết hợp nhiều bước',
  skill,
  difficulty,
  workspace: difficulty === 'hard' ? 'large' : 'medium',
});

export const anglePractice: MathExercise[] = [
  practice(
    'b1',
    'easy',
    'Đỉnh và cạnh',
    'Hai cạnh của góc xOy là các tia nào?',
    'Ox và Oy',
    'Hai tia đều bắt đầu từ đỉnh O.',
    'Đỉnh O là gốc chung. Hai cạnh của góc xOy là các tia Ox và Oy.',
    ['Ox và Oy', 'Ox và xy', 'xO và yO']
  ),
  practice(
    'b2',
    'easy',
    'Phân loại góc',
    'Góc có số đo 38° thuộc loại nào?',
    'Góc nhọn',
    'So sánh số đo với 0° và 90°.',
    '0° < 38° < 90° nên đây là góc nhọn.',
    ['Góc nhọn', 'Góc vuông', 'Góc tù']
  ),
  practice(
    'b3',
    'easy',
    'Góc bẹt',
    'Ox và Oy là hai tia đối nhau. Góc xOy bằng bao nhiêu độ?',
    '180',
    'Hai tia đối nhau tạo thành góc bẹt.',
    'Góc xOy là góc bẹt nên bằng 180°.'
  ),
  practice(
    'b5',
    'easy',
    'Góc kề và kề bù',
    'Oz nằm trong góc xOy = 100°. Hai góc xOz và zOy có phải là hai góc kề bù không?',
    'Không',
    'Tổng hai góc là bao nhiêu? Kề bù cần tổng 180°.',
    'Hai góc này kề nhau nhưng tổng chỉ bằng 100°, không bằng 180°, nên không kề bù.',
    ['Có', 'Không']
  ),
  practice(
    'b6',
    'easy',
    'Phân biệt bù và kề bù',
    'Hai góc có số đo 70° và 110°, nhưng chưa biết vị trí các cạnh. Có đủ dữ kiện kết luận hai góc kề bù không?',
    'Chưa đủ',
    'Ngoài tổng 180°, cần điều kiện về các cạnh.',
    '70° + 110° = 180° nên hai góc bù nhau. Muốn kết luận kề bù, còn cần một cạnh chung và hai cạnh còn lại là hai tia đối nhau.',
    ['Đủ', 'Chưa đủ']
  ),
  practice(
    'm1',
    'medium',
    'Cộng góc',
    'Oz nằm trong góc xOy. Biết xOz = 28°, zOy = 46°. Tính số đo góc xOy.',
    '74',
    'Cộng hai góc nhỏ.',
    'Vì tia Oz nằm trong góc xOy nên:\nxOy = xOz + zOy\nxOy = 28° + 46°\nxOy = 74°.\nVậy góc xOy bằng 74°.'
  ),
  practice(
    'm2',
    'medium',
    'Góc còn lại',
    'Oz nằm trong góc xOy = 137°. Góc xOz = 59°. Tính góc zOy (độ).',
    '78',
    'Lấy số đo cả góc trừ phần đã biết.',
    'Góc zOy = góc xOy − góc xOz\nGóc zOy = 137° − 59°\nGóc zOy = 78°.'
  ),
  practice(
    'm3',
    'medium',
    'Kiểm tra tia phân giác',
    'Oz nằm trong góc xOy = 92°. Góc xOz = 46°. Oz có phải tia phân giác không?',
    'Có',
    'Tính góc zOy rồi kiểm tra cả hai điều kiện.',
    'Góc zOy = 92° − 46° = 46°. Oz nằm trong góc và góc xOz = góc zOy, nên Oz là tia phân giác.',
    ['Có', 'Không']
  ),
  practice(
    'm4',
    'medium',
    'Góc kề bù theo tỉ lệ',
    'Hai góc kề bù có số đo góc lớn gấp 3 lần góc nhỏ. Tính số đo góc nhỏ (độ).',
    '45',
    'Tổng 180° gồm 1 + 3 phần bằng nhau.',
    'Gọi số đo góc nhỏ là x độ.\nx + 3x = 180\n4x = 180\nx = 45.\nGóc nhỏ bằng 45°, góc lớn bằng 135°. Kiểm tra: 45° + 135° = 180°.'
  ),
  practice(
    'h1',
    'hard',
    'Kề bù và phân giác',
    'Ox và Oy là hai tia đối nhau. Oz nằm trong góc bẹt xOy, góc xOz = 64°. Ot là tia phân giác của góc zOy. Tính góc zOt (độ).',
    '58',
    'Tính góc zOy trước, rồi chia đôi.',
    'Góc zOy = 180° − 64° = 116° (hai góc kề bù).\nOt là tia phân giác nên góc zOt = 116° : 2 = 58°.'
  ),
  practice(
    'h2',
    'hard',
    'Hai tia phân giác của hai góc kề bù',
    'Ox và Oy là hai tia đối nhau, Oz nằm trong góc bẹt xOy. Om và On lần lượt là tia phân giác của góc xOz và góc zOy. Tính góc mOn (độ).',
    '90',
    'Góc mOn là tổng một nửa của mỗi góc kề bù.',
    'Oz nằm giữa Om và On.\nGóc mOn = góc mOz + góc zOn\nGóc mOn = (góc xOz + góc zOy) : 2\nGóc mOn = 180° : 2 = 90°.\nVậy hai tia phân giác vuông góc với nhau.'
  ),
  practice(
    'h3',
    'hard',
    'Hai tia phân giác trong một góc',
    'Oz nằm trong góc xOy = 132°. Om và On lần lượt là tia phân giác của góc xOz và góc zOy. Tính góc mOn (độ).',
    '66',
    'Cộng hai nửa của các góc nhỏ.',
    'Oz nằm giữa Om và On.\nGóc mOn = góc mOz + góc zOn\nGóc mOn = (góc xOz + góc zOy) : 2\nGóc mOn = 132° : 2 = 66°.'
  ),
  practice(
    'h4',
    'hard',
    'Phân giác liên tiếp',
    'Oz là tia phân giác của góc xOy = 144°. Ot là tia phân giác của góc xOz. Tính góc tOy (độ).',
    '108',
    'Tính góc tOz và góc zOy rồi cộng.',
    'Góc xOz = góc zOy = 144° : 2 = 72°.\nGóc tOz = 72° : 2 = 36°.\nGóc tOy = góc tOz + góc zOy\nGóc tOy = 36° + 72° = 108°.'
  ),
  practice(
    'h5',
    'hard',
    'Tỉ lệ và phân giác',
    'Oz nằm trong góc xOy = 150°. Góc xOz gấp 2 lần góc zOy. Ot là tia phân giác của góc xOz. Tính góc tOy (độ).',
    '100',
    'Chia góc lớn thành 3 phần để tìm hai góc nhỏ trước.',
    'Góc zOy = 150° : 3 = 50°.\nGóc xOz = 2 × 50° = 100°.\nGóc tOz = 100° : 2 = 50°.\nGóc tOy = góc tOz + góc zOy = 50° + 50° = 100°.'
  ),
  practice(
    'h6',
    'hard',
    'Phát hiện lập luận sai',
    'Hai đường thẳng xx′ và yy′ cắt nhau tại O, góc xOy = 54°. Bạn An viết: “Góc x′Oy = 54° vì đối đỉnh với góc xOy”. Tính số đo đúng của góc x′Oy (độ).',
    '126',
    'Hai góc có cạnh chung Oy. Kiểm tra hai cạnh còn lại.',
    'Góc x′Oy và góc xOy có cạnh chung Oy, Ox′ và Ox là hai tia đối nhau. Đây là hai góc kề bù, không phải đối đỉnh.\nGóc x′Oy = 180° − 54° = 126°.'
  ),
];
