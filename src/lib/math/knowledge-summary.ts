import type { MathLessonData } from './lessons';

// Authored review notes, never extracted from exercise answers or private notes.
// Exact metadata matching gives existing samples a default without altering saves.
const defaults: {
  grade: number;
  topic: string;
  title: string;
  lines: string[];
}[] = [
  {
    grade: 6,
    topic: 'Phân số',
    title: 'Cộng hai phân số khác mẫu số',
    lines: [
      '- Mẫu số phải khác 0. Nhân cả tử và mẫu với cùng một số nguyên khác 0 được phân số bằng phân số đã cho.',
      '- Cộng hai phân số khác mẫu: chọn mẫu chung, quy đồng, cộng tử số và giữ mẫu chung.',
      '- Rút gọn kết quả bằng cách chia tử và mẫu cho ước chung lớn nhất của chúng.',
      'Ví dụ: 2/7 + 1/3 = 6/21 + 7/21 = 13/21.',
      'Lưu ý: Không cộng hai mẫu số. Khi quy đồng, phải nhân cả tử và mẫu.',
    ],
  },
  {
    grade: 6,
    topic: 'Số nguyên',
    title: 'Số nguyên: nhận biết, so sánh và tính toán',
    lines: [
      '- Số nguyên gồm số nguyên âm, số 0 và số nguyên dương. Trên trục số, số bên trái nhỏ hơn số bên phải.',
      '- Cộng cùng dấu: cộng hai phần số tự nhiên, giữ dấu chung. Khác dấu: lấy phần lớn trừ phần nhỏ, giữ dấu của số có phần lớn hơn. Hai số đối nhau có tổng bằng 0.',
      '- Trừ một số là cộng với số đối: a - b = a + (-b). Bỏ ngoặc có dấu trừ phía trước phải đổi dấu từng số hạng.',
      '- Nhân hoặc chia hết hai số khác 0: cùng dấu được số dương, khác dấu được số âm. Không chia cho 0.',
      'Ví dụ: (-17) + 8 = -(17 - 8) = -9.',
      'Lưu ý: Tính trong ngoặc trước; nhân, chia trước; cộng, trừ sau. Số 0 không âm, không dương.',
    ],
  },
  {
    grade: 7,
    topic: 'Số hữu tỉ',
    title: 'Số hữu tỉ: nhận biết, so sánh và tính toán',
    lines: [
      '- Số hữu tỉ viết được dưới dạng phân số có tử và mẫu là số nguyên, mẫu khác 0. Mỗi số nguyên đều là số hữu tỉ.',
      '- So sánh: quy đồng về cùng mẫu dương rồi so sánh tử số. Trên trục số, số bên trái nhỏ hơn số bên phải.',
      '- Cộng, trừ: quy đồng mẫu, cộng hoặc trừ tử số, giữ mẫu chung. Trừ một số là cộng với số đối của nó.',
      '- Nhân: rút gọn thừa số chung rồi nhân tử với tử, mẫu với mẫu. Chia cho số khác 0: nhân với số nghịch đảo của số chia.',
      'Ví dụ: -3/7 + 1/2 = -6/14 + 7/14 = 1/14.',
      'Lưu ý: Không cộng mẫu số; không chia cho 0. Kiểm tra dấu và rút gọn kết quả.',
    ],
  },
  {
    grade: 6,
    topic: 'Số tự nhiên',
    title: 'Số tự nhiên: tập hợp và phép tính',
    lines: [
      '- Tập hợp số tự nhiên gồm 0, 1, 2, 3, ...; mỗi số có một số liền sau. Khi liệt kê tập hợp, mỗi phần tử chỉ viết một lần.',
      '- Lũy thừa với số mũ tự nhiên khác 0 là tích các thừa số bằng nhau. Ví dụ: 3³ = 3 × 3 × 3 = 27.',
      '- Thứ tự tính: trong ngoặc; lũy thừa; nhân, chia; cộng, trừ. Các phép cùng mức ưu tiên tính từ trái sang phải.',
      'Ví dụ: 7 + 4 × (9 - 6) = 7 + 12 = 19.',
      'Lưu ý: Không nhầm lũy thừa với phép nhân cơ số và số mũ; không chia cho 0.',
    ],
  },
  {
    grade: 6,
    topic: 'Tính chia hết',
    title: 'Tính chia hết, số nguyên tố, ƯCLN và BCNN',
    lines: [
      '- Chia hết cho 2: chữ số tận cùng chẵn; cho 5: tận cùng 0 hoặc 5; cho 3 hoặc 9: tổng các chữ số chia hết cho 3 hoặc 9.',
      '- Số nguyên tố là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó. Hợp số là số tự nhiên lớn hơn 1 và có nhiều hơn hai ước. Số 0 và 1 không thuộc hai loại này.',
      '- Với các số tự nhiên lớn hơn 1, phân tích mỗi số ra thừa số nguyên tố. ƯCLN: lấy các thừa số chung với số mũ nhỏ nhất; BCNN: lấy tất cả thừa số xuất hiện với số mũ lớn nhất.',
      '- Ước chung là ước của ƯCLN; bội chung là bội của BCNN. Hai số nguyên tố cùng nhau có ƯCLN bằng 1.',
      'Ví dụ: 14 = 2 × 7; 21 = 3 × 7. ƯCLN(14, 21) = 7; BCNN(14, 21) = 42.',
      'Lưu ý: BCNN là bội chung nhỏ nhất khác 0; không nhầm ước với bội.',
    ],
  },
  {
    grade: 3,
    topic: 'Số học',
    title: 'Nhân số có hai chữ số với số có một chữ số',
    lines: [
      '- Đặt tính sao cho các chữ số cùng hàng thẳng cột.',
      '- Nhân từ hàng đơn vị đến hàng chục. Nếu tích ở hàng đơn vị có hai chữ số, viết hàng đơn vị và nhớ hàng chục.',
      '- Cộng số nhớ vào tích ở hàng chục.',
      'Ví dụ: 27 × 3 = (20 × 3) + (7 × 3) = 60 + 21 = 81.',
      'Lưu ý: Không quên số nhớ. Có thể tách chục và đơn vị để kiểm tra kết quả.',
    ],
  },
  {
    grade: 4,
    topic: 'Hình học',
    title: 'Chu vi và diện tích hình chữ nhật',
    lines: [
      '- Hình chữ nhật có bốn góc vuông; hai cạnh đối diện bằng nhau.',
      '- Chu vi = (chiều dài + chiều rộng) × 2.',
      '- Diện tích = chiều dài × chiều rộng. Các kích thước phải cùng đơn vị trước khi tính.',
      'Ví dụ: Dài 9 cm, rộng 4 cm thì chu vi là (9 + 4) × 2 = 26 (cm), diện tích là 9 × 4 = 36 (cm²).',
      'Lưu ý: Chu vi dùng đơn vị độ dài; diện tích dùng đơn vị vuông. Không nhầm hai công thức.',
    ],
  },
  {
    grade: 8,
    topic: 'Đại số',
    title: 'Giải phương trình bậc nhất một ẩn',
    lines: [
      '- Phương trình bậc nhất một ẩn có dạng ax + b = 0, với a khác 0.',
      '- Có thể cộng hoặc trừ cùng một số ở cả hai vế; nhân hoặc chia cả hai vế với cùng một số khác 0.',
      '- Chuyển hạng tử sang vế kia phải đổi dấu. Thu gọn, tìm x rồi thay lại vào phương trình ban đầu để kiểm tra.',
      'Ví dụ: 6x + 5 = 47 → 6x = 42 → x = 7. Thử lại: 6 × 7 + 5 = 47.',
      'Lưu ý: Không chỉ biến đổi một vế; không quên đổi dấu khi chuyển vế.',
    ],
  },
];

export function getKnowledgeSummary(
  lesson: Pick<MathLessonData, 'grade' | 'title' | 'topic' | 'knowledgeSummary'>
): string {
  // An explicitly empty summary stays empty; it never restores a default.
  if (lesson.knowledgeSummary !== undefined) return lesson.knowledgeSummary;
  return (
    defaults
      .find(
        (item) =>
          item.grade === lesson.grade &&
          item.title === lesson.title &&
          (item.topic === lesson.topic || (lesson.grade === 6 && lesson.topic === 'Phân số mở rộng' && item.topic === 'Phân số'))
      )
      ?.lines.join('\n') || ''
  );
}

export function withKnowledgeSummary<T extends MathLessonData>(lesson: T): T {
  return { ...lesson, knowledgeSummary: getKnowledgeSummary(lesson) };
}
