import type { MathLessonData } from './lessons';

const range = (prefix: string, first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, i) => `${prefix}${first + i}`);
type Task = [title: string, ids: string[]];
const task = (title: string, prefix: string, first: number, last: number): Task =>
  [title, range(prefix, first, last)];
const fractionTasks = (prefix: string, tasks: [string, number, number][]): Task[] =>
  tasks.map(([title, first, last]) => task(title, `${prefix}-q`, first, last));

// Reviewed authoring metadata, not a classifier for arbitrary teacher content.
// IDs and sequence are unchanged; each subquestion still has its own answer.
const tasks: Record<string, Task[]> = {
  'math-fractions-6': [
    task('Ôn phân số bằng nhau và quy đồng', 'fraction-extra-', 1, 4),
    task('Tính tổng các phân số', 'fraction-extra-', 5, 12),
    task('Giải bài toán', 'fraction-extra-', 15, 18),
    task('Giải thích cách làm', 'fraction-extra-', 19, 20),
    ...fractionTasks('math-fraction-basics-6', [
      ['Nhận biết phân số', 5, 8], ['Rút gọn phân số', 9, 16], ['Tìm x', 17, 19],
    ]),
    ...fractionTasks('math-fraction-compare-6', [
      ['Tìm mẫu chung nhỏ nhất', 5, 8], ['So sánh các phân số', 9, 16], ['Quy đồng mẫu số', 17, 20],
    ]),
    ...fractionTasks('math-fraction-subtract-6', [
      ['Tính hiệu các phân số', 5, 16], ['Tìm x', 17, 20], ['Giải bài toán', 21, 22],
    ]),
  ],
  'math-add-subtract-components-3': [
    task('Tìm số thích hợp điền vào ô trống', 'components-3-e', 5, 16),
    ['Điền số vào bảng', ['components-3-table-addition', 'components-3-table-subtraction']],
    task('Giải bài toán', 'components-3-e', 17, 22),
  ],
  'math-multiply-divide-components-3': [
    task('Tìm số thích hợp điền vào ô trống', 'muldiv-3-e', 5, 16),
    task('Điền số vào bảng', 'muldiv-3-e', 17, 18),
    task('Giải bài toán', 'muldiv-3-e', 19, 24),
  ],
  'math-unit-fractions-3': [
    task('Viết số', 'unit-3-e', 5, 8),
    task('Nhận biết một phần mấy', 'unit-3-e', 9, 12),
    task('Đọc và nhận biết các phần bằng nhau', 'unit-3-e', 13, 16),
    task('Giải bài toán chia đều', 'unit-3-e', 17, 22),
  ],
  'math-measurement-units-3': [
    task('Điền số thích hợp', 'measure-direct-e', 5, 12),
    task('Tính với số đo độ dài', 'measure-direct-e', 13, 16),
    task('Tính với số đo khối lượng', 'measure-direct-e', 17, 20),
    task('Tính với số đo dung tích', 'measure-direct-e', 21, 24),
    task('Chọn số đo phù hợp', 'measure-direct-e', 25, 32),
    task('Giải bài toán', 'measure-word-e', 1, 6),
  ],
  'math-midpoint-3': [
    task('Nhận biết điểm ở giữa và ba điểm thẳng hàng', 'midpoint-e', 5, 7),
    task('Nhận biết trung điểm', 'midpoint-e', 8, 12),
    task('Tính độ dài đoạn thẳng', 'midpoint-e', 13, 16),
    task('Giải bài toán', 'midpoint-e', 17, 22),
    task('Kiểm tra điều kiện để một điểm là trung điểm', 'midpoint-e', 23, 24),
  ],
  'math-rational-7': [
    task('Nhận biết số hữu tỉ', 'r-ex-', 7, 10),
    task('Tính', 'r-ex-', 13, 18),
    task('Tìm x', 'r-ex-', 19, 20),
    task('Giải bài toán', 'r-ex-', 21, 24),
    task('Tập hợp số hữu tỉ', 'r-sets-extra', 1, 4),
  ],
  'math-integers-6': [
    task('Nhận biết và so sánh số nguyên', 'i-extra-', 1, 4),
    task('Tính tổng và hiệu', 'i-extra-', 5, 10),
    task('Tính tích và thương', 'i-extra-', 11, 12),
    task('Giải bài toán', 'i-extra-', 13, 15),
    task('Tìm x', 'i-extra-', 16, 17),
    task('Tập hợp số nguyên', 'i-sets-extra', 1, 4),
  ],
  'math-natural-6': [
    task('Nhận biết số tự nhiên', 'n-extra-', 1, 5),
    task('Tính', 'n-extra-', 6, 10),
    task('Giải bài toán', 'n-extra-', 15, 17),
  ],
  'math-divisibility-6': [
    task('Phép chia và dấu hiệu chia hết', 'n-extra-', 11, 13),
    task('Nhận biết ước chung và bội chung nhỏ nhất', 'n-common-extra-', 1, 2),
    task('Tìm ƯCLN và BCNN', 'n-common-extra-', 3, 8),
    task('Giải bài toán', 'n-common-extra-', 9, 10),
    task('Tìm số tự nhiên thỏa mãn điều kiện', 'n-common-extra-', 11, 12),
  ],
  'math-fraction-multiply-6': fractionTasks('math-fraction-multiply-6', [
    ['Tính tích và thương của các phân số', 5, 18], ['Giải bài toán', 19, 22],
  ]),
  'math-fraction-applications-6': fractionTasks('math-fraction-applications-6', [
    ['Tìm phân số của một số', 5, 10], ['Tìm một số khi biết giá trị phân số của số đó', 11, 16],
    ['Giải bài toán', 17, 22], ['Giải bài toán nhiều bước', 23, 24],
  ]),
  'math-fraction-intro-4': fractionTasks('math-fraction-intro-4', [
    ['Viết phân số chỉ phần đã tô màu', 5, 8], ['Nhận biết tử số và mẫu số', 9, 12],
    ['Rút gọn phân số', 13, 16], ['Điền số vào ô trống', 17, 20],
    ['Nhận biết phân số qua tình huống', 21, 22],
  ]),
  'math-fraction-compare-4': fractionTasks('math-fraction-compare-4', [
    ['Quy đồng mẫu số', 5, 12], ['So sánh các phân số', 13, 20], ['Sắp xếp các số', 23, 24],
  ]),
  'math-fraction-add-subtract-4': fractionTasks('math-fraction-add-subtract-4', [
    ['Tính với các phân số cùng mẫu số', 5, 8], ['Tính với các phân số khác mẫu số', 9, 20],
    ['Tính với số 0 và số 1', 21, 24],
  ]),
  'math-fraction-multiply-divide-4': fractionTasks('math-fraction-multiply-divide-4', [
    ['Tính tích và thương của các phân số', 5, 14], ['Tính — luyện tập thêm', 15, 24],
  ]),
  'math-fraction-of-number-4': fractionTasks('math-fraction-of-number-4', [
    ['Tìm phân số của một số', 5, 16], ['Giải bài toán', 17, 20], ['Tìm số lượng còn lại', 21, 24],
  ]),
  'math-fraction-order-6': fractionTasks('math-fraction-order-6', [
    ['Điền dấu thích hợp', 5, 14], ['Sắp xếp các số', 15, 22], ['Chọn số nhỏ nhất', 23, 24],
  ]),
  'math-number-line-7': fractionTasks('math-number-line-7', [
    ['Ôn cách đọc trục số', 5, 8], ['Xác định vị trí và số được biểu diễn', 9, 12],
    ['Viết số dưới dạng phân số', 13, 14], ['Xác định hai số nguyên liên tiếp', 15, 16],
    ['Di chuyển trên trục số', 17, 18], ['Nhận biết vị trí các số trên trục số', 19, 22],
  ]),
};

export function groupExampleExercises(lessons: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => {
    const groups = tasks[lesson.id];
    if (!groups) return lesson;
    const titles = new Map(groups.flatMap(([title, ids]) => ids.map(id => [id, title] as const)));
    return { ...lesson, exercises: lesson.exercises.map(e => {
      const title = titles.get(e.id);
      return e.section === 'extra' && e.task === undefined && title ? { ...e, task: title } : e;
    }) };
  });
}

// Only upgrade known, unchanged questions. Custom groups and authored questions win.
export function upgradeExampleExerciseGroups(lessons: MathLessonData[], originals: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => {
    const source = originals.find(item => item.id === lesson.id);
    if (!source) return lesson;
    return { ...lesson, exercises: lesson.exercises.map(e => {
      const original = source.exercises.find(item => item.id === e.id);
      return e.section === 'extra' && e.task === undefined && original?.task &&
        e.prompt === original.prompt && e.kind === original.kind && e.answer === original.answer
        ? { ...e, task: original.task } : e;
    }) };
  });
}
