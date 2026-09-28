import { anglePractice } from './angle-practice';
import type { MathBlock, MathExercise, MathLessonData } from './lessons';
const block = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string
): MathBlock => ({
  id: `angle-${id}`,
  section,
  title,
  text,
  visual: 'none',
  values: [],
});
const question = (
  id: string,
  section: MathExercise['section'],
  prompt: string,
  answer: string,
  hint: string,
  solution: string,
  options: string[] = []
): MathExercise => ({
  id: `angle-${id}`,
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
  ...(section === 'extra'
    ? {
        group: 'skills' as const,
        task: 'Góc và tia phân giác',
        skill: 'Tính số đo góc',
        difficulty: 'medium' as const,
        workspace: 'medium' as const,
      }
    : {}),
});
export const angleLesson: MathLessonData = {
  id: 'math-angle-bisector-7',
  title: 'Góc và tia phân giác của góc',
  grade: 7,
  semester: '1',
  topic: 'Hình học',
  interactiveLab: 'angles',
  goal: 'Nhận biết góc đối đỉnh, góc kề bù; đọc số đo góc; xác định tia phân giác và tính số đo các góc liên quan.',
  textbook: 'Bài tự biên soạn cho Toán 7, học kỳ 1.',
  teacherNotes:
    'Nhắc học sinh kiểm tra tia nằm trong góc trước khi kết luận là tia phân giác. Các góc trong bài từ 0° đến 180°. Hoạt động kéo tia hỗ trợ thanh trượt và phím mũi tên.',
  knowledgeSummary:
    'Hai góc đối đỉnh có các cạnh tương ứng là các tia đối nhau và có số đo bằng nhau. Hai góc kề bù có một cạnh chung, hai cạnh còn lại là hai tia đối nhau; tổng số đo bằng 180°.\nGóc xOy có đỉnh O, hai cạnh là các tia Ox và Oy. Chữ chỉ đỉnh nằm giữa tên góc.\nGóc nhọn lớn hơn 0° và nhỏ hơn 90°; góc vuông bằng 90°; góc tù lớn hơn 90° và nhỏ hơn 180°; góc bẹt bằng 180°.\nNếu tia Oz nằm trong góc xOy thì số đo góc xOz + số đo góc zOy = số đo góc xOy.\nTia phân giác nằm trong góc và chia góc đó thành hai góc có số đo bằng nhau.\nVí dụ: Oz là tia phân giác của góc xOy = 120° thì góc xOz = góc zOy = 120° : 2 = 60°. Ngược lại, nếu một nửa bằng 25° thì cả góc bằng 25° × 2 = 50°.\nLưu ý: Hai góc phải bằng nhau và tia phải nằm trong góc. Khi đo, đặt tâm thước tại đỉnh và vạch 0° trùng một cạnh. Không kết luận chỉ dựa vào hình trông có vẻ cân đối.',
  blocks: [
    block(
      'pre',
      'foundation',
      'Đỉnh và cạnh của góc',
      'Góc xOy có đỉnh O và hai cạnh là các tia Ox, Oy. Hai tia chung gốc tạo thành góc. Khi gọi tên bằng ba chữ, chữ chỉ đỉnh đặt ở giữa.'
    ),
    block(
      'measure',
      'explore',
      'Đo và phân loại góc',
      'Đặt tâm thước đo góc tại O, vạch 0° theo tia Ox. Đọc thang bắt đầu từ 0° đó tại tia Oy. So sánh số đo với 90° và 180° để phân loại.'
    ),
    block(
      'bisect',
      'explore',
      'Hai điều kiện của tia phân giác',
      'Tia Oz là tia phân giác của góc xOy khi Oz nằm trong góc và góc xOz bằng góc zOy. Di chuyển Oz để hai góc nhỏ bằng nhau.'
    ),
    block(
      'opposite',
      'explore',
      'Góc đối đỉnh và góc kề bù',
      'Hai góc đối đỉnh có mỗi cạnh của góc này là tia đối của một cạnh của góc kia. Hai góc đối đỉnh bằng nhau.\nHai góc kề bù có một cạnh chung, hai cạnh còn lại là hai tia đối nhau. Tổng số đo hai góc kề bù bằng 180°.\nHai góc bằng nhau chưa chắc đối đỉnh; cần kiểm tra các cặp tia đối nhau.'
    ),
    block(
      'ex1',
      'example',
      'Ví dụ 1: tìm số đo mỗi nửa',
      'Oz là tia phân giác của góc xOy = 120°.\nGóc xOz = góc zOy = 120° : 2\nGóc xOz = góc zOy = 60°.\nKiểm tra: 60° + 60° = 120°.'
    ),
    block(
      'ex2',
      'example',
      'Ví dụ 2: tìm số đo cả góc',
      'Ot là tia phân giác của góc aOb. Biết góc aOt = 25°.\nGóc tOb = 25°\nGóc aOb = 25° + 25°\nGóc aOb = 50°.'
    ),
    block(
      'ex3',
      'example',
      'Ví dụ 3: kiểm tra một tia',
      'Oz nằm trong góc xOy = 110°; góc xOz = 40°.\nGóc zOy = 110° - 40° = 70°.\n40° khác 70° nên Oz không phải tia phân giác.'
    ),
    block(
      'cross-ex1',
      'example',
      'Ví dụ 4: hai đường thẳng cắt nhau',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 60°. Tính góc x'Oy' và góc x'Oy.\nGóc x'Oy' = góc xOy (hai góc đối đỉnh).\nGóc x'Oy' = 60°.\nGóc x'Oy + góc xOy = 180° (hai góc kề bù).\nGóc x'Oy = 180° − 60°\nGóc x'Oy = 120°.\nKiểm tra: 120° + 60° = 180°."
    ),
    block(
      'guide',
      'guided',
      'Chọn đúng phép tính',
      'Biết cả góc và tia phân giác: chia số đo cho 2. Biết một nửa: nhân với 2. Hai góc đối đỉnh: số đo bằng nhau. Hai góc kề bù: tổng bằng 180°. Với bài nhiều bước, tìm góc trung gian trước. Muốn kiểm tra một tia: tính góc còn lại rồi so sánh hai góc nhỏ.'
    ),
  ],
  exercises: [
    ...anglePractice,
    question(
      'cross-g1',
      'guided',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 72°. Tính góc x'Oy' (độ).",
      '72',
      'Xác định hai cặp tia đối nhau.',
      "Góc x'Oy' = góc xOy (hai góc đối đỉnh).\nGóc x'Oy' = 72°."
    ),
    question(
      'cross-g2',
      'guided',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 72°. Tính góc x'Oy (độ).",
      '108',
      'Hai góc kề bù có tổng bằng 180°.',
      "Góc x'Oy + góc xOy = 180°.\nGóc x'Oy = 180° − 72°\nGóc x'Oy = 108°."
    ),
    question(
      'cross-p1',
      'practice',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 118°. Tính góc x'Oy' (độ).",
      '118',
      'Hai góc đối đỉnh bằng nhau.',
      "Góc x'Oy' = góc xOy = 118° (hai góc đối đỉnh)."
    ),
    question(
      'cross-p2',
      'practice',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 118°. Tính góc x'Oy (độ).",
      '62',
      'Xác định hai góc kề bù.',
      "Góc x'Oy = 180° − 118° = 62° (hai góc kề bù)."
    ),
    question(
      'cross-e1',
      'extra',
      "Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 47°. Tính góc x'Oy (độ).",
      '133',
      'Tổng hai góc kề bù bằng 180°.',
      "Góc x'Oy = 180° − 47° = 133°."
    ),
    question(
      'cross-e2',
      'extra',
      'Hai góc có số đo bằng nhau có chắc chắn là hai góc đối đỉnh không?',
      'Không',
      'Cần kiểm tra cả vị trí của các cạnh.',
      'Không. Hai góc đối đỉnh phải có mỗi cạnh của góc này là tia đối của một cạnh của góc kia.',
      ['Có', 'Không']
    ),
    question(
      'f1',
      'foundation',
      'Góc aOb có đỉnh nào?',
      'O',
      'Chữ chỉ đỉnh nằm giữa.',
      'Góc aOb có đỉnh O.',
      ['a', 'O', 'b']
    ),
    question(
      'f2',
      'foundation',
      'Góc 90° là góc gì?',
      'Góc vuông',
      'So sánh với định nghĩa.',
      'Góc vuông có số đo 90°.',
      ['Góc nhọn', 'Góc vuông', 'Góc tù']
    ),
    question(
      'g1',
      'guided',
      'Oz là tia phân giác của góc xOy = 84°. Tính góc xOz (độ).',
      '42',
      'Chia số đo cả góc cho 2.',
      'Góc xOz = 84° : 2 = 42°.'
    ),
    question(
      'g2',
      'guided',
      'Ot là tia phân giác của góc aOb. Góc aOt = 32°. Tính góc aOb (độ).',
      '64',
      'Hai nửa bằng nhau.',
      'Góc aOb = 32° × 2 = 64°.'
    ),
    question(
      'p1',
      'practice',
      'Góc 135° là góc gì?',
      'Góc tù',
      'So sánh 135° với 90° và 180°.',
      '90° < 135° < 180° nên đây là góc tù.',
      ['Góc nhọn', 'Góc tù', 'Góc bẹt']
    ),
    question(
      'p2',
      'practice',
      'Oz là tia phân giác của góc xOy = 146°. Tính góc zOy (độ).',
      '73',
      'Chia cho 2.',
      'Góc zOy = 146° : 2 = 73°.'
    ),
    question(
      'p3',
      'practice',
      'Oz nằm trong góc xOy = 96°. Góc xOz = 43°. Oz có phải tia phân giác không?',
      'Không',
      'Tính góc zOy rồi so sánh.',
      'Góc zOy = 96° - 43° = 53°. Vì 43° khác 53° nên Oz không phải tia phân giác.',
      ['Có', 'Không']
    ),
    question(
      'e1',
      'extra',
      'Góc xOy = 160°. Oz là tia phân giác. Tính góc xOz (độ).',
      '80',
      'Lấy 160 chia 2.',
      'Góc xOz = 160° : 2 = 80°.'
    ),
    question(
      'e2',
      'extra',
      'Ot là tia phân giác của góc aOb. Góc tOb = 47°. Tính góc aOb (độ).',
      '94',
      'Nhân số đo một nửa với 2.',
      'Góc aOb = 47° × 2 = 94°.'
    ),
    question(
      'e3',
      'extra',
      'Oz nằm trong góc xOy = 125°. Góc xOz = 55°. Tính góc zOy (độ).',
      '70',
      'Lấy góc lớn trừ góc đã biết.',
      'Góc zOy = 125° - 55° = 70°.'
    ),
    question(
      'e4',
      'extra',
      'Oz nằm trong góc xOy. Góc xOz = góc zOy = 38°. Oz có phải tia phân giác không?',
      'Có',
      'Kiểm tra cả vị trí và số đo hai góc nhỏ.',
      'Oz nằm trong góc và chia góc thành hai góc bằng nhau nên là tia phân giác.',
      ['Có', 'Không']
    ),
    question(
      'e5',
      'extra',
      'Tia Ot chia góc bẹt aOb thành hai góc bằng nhau. Tính góc aOt (độ).',
      '90',
      'Góc bẹt bằng 180°.',
      'Góc aOt = 180° : 2 = 90°.'
    ),
    question(
      'e6',
      'extra',
      'Oz là tia phân giác của góc xOy = 75°. Tính góc xOz (độ).',
      '37.5',
      'Số đo góc có thể là số thập phân.',
      'Góc xOz = 75° : 2 = 37,5°.'
    ),
  ],
};
