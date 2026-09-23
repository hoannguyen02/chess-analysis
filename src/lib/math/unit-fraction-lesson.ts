import type { MathLessonData } from './lessons';

export const unitFractionLesson: MathLessonData = {
  id: 'math-unit-fractions-3',
  title: 'Một phần mấy',
  grade: 3,
  semester: '1',
  topic: 'Số học',
  goal: 'Nhận biết, đọc, viết một phần hai đến một phần chín; chia hình và nhóm đồ vật thành các phần bằng nhau.',
  textbook:
    'Bài tự biên soạn, tham khảo Toán 3 Kết nối tri thức, Bài 14: Một phần mấy (tập 1).',
  teacherNotes:
    'Tham khảo tài liệu giáo viên: https://api.iseebooks.vn/upload/Tap%20huan/Bo%20ket%20noi/Lop%203/Toan/TLGV.pdf. Dùng hình ảnh chia đều, nhận biết 1/2 đến 1/9 của hình và 1/2 đến 1/5 của nhóm đồ vật. Chưa yêu cầu tính toán giữa các phân số.',
  knowledgeSummary:
    'Chia một hình thành các phần bằng nhau và lấy 1 phần để nhận biết một phần mấy của hình.\nĐọc, viết: 1/2 một phần hai; 1/3 một phần ba; 1/4 một phần tư; 1/5 một phần năm; 1/6 một phần sáu; 1/7 một phần bảy; 1/8 một phần tám; 1/9 một phần chín.\nVí dụ: Chia băng giấy thành 4 phần bằng nhau, tô 1 phần thì được 1/4 băng giấy. Chia 12 chấm tròn thành 3 nhóm bằng nhau, mỗi nhóm có 4 chấm và là 1/3 số chấm tròn.\nLưu ý: Các phần phải bằng nhau; đếm số phần của cả hình, không chỉ đếm phần được tô.',
  blocks: [
    {
      id: 'unit-3-b1',
      section: 'foundation',
      title: 'Chia đều và lấy một phần',
      text: 'Khi chia một hình hoặc một nhóm đồ vật thành các phần bằng nhau, ta có thể lấy một phần trong các phần đó. Các phần phải bằng nhau.',
      visual: 'none',
      values: [],
    },
    {
      id: 'unit-3-b2',
      section: 'explore',
      title: 'Một phần hai',
      text: 'Chia băng giấy thành 2 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần hai băng giấy, viết là 1/2.',
      visual: 'unit-fraction',
      values: [2, 0],
    },
    {
      id: 'unit-3-b3',
      section: 'explore',
      title: 'Một phần ba',
      text: 'Chia băng giấy thành 3 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần ba băng giấy, viết là 1/3.',
      visual: 'unit-fraction',
      values: [3, 0],
    },
    {
      id: 'unit-3-b4',
      section: 'explore',
      title: 'Một phần tư',
      text: 'Chia băng giấy thành 4 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần tư băng giấy, viết là 1/4.',
      visual: 'unit-fraction',
      values: [4, 0],
    },
    {
      id: 'unit-3-b5',
      section: 'explore',
      title: 'Một phần năm',
      text: 'Chia băng giấy thành 5 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần năm băng giấy, viết là 1/5.',
      visual: 'unit-fraction',
      values: [5, 0],
    },
    {
      id: 'unit-3-b6',
      section: 'explore',
      title: 'Một phần sáu',
      text: 'Chia băng giấy thành 6 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần sáu băng giấy, viết là 1/6.',
      visual: 'unit-fraction',
      values: [6, 0],
    },
    {
      id: 'unit-3-b7',
      section: 'explore',
      title: 'Một phần bảy',
      text: 'Chia băng giấy thành 7 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần bảy băng giấy, viết là 1/7.',
      visual: 'unit-fraction',
      values: [7, 0],
    },
    {
      id: 'unit-3-b8',
      section: 'explore',
      title: 'Một phần tám',
      text: 'Chia băng giấy thành 8 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần tám băng giấy, viết là 1/8.',
      visual: 'unit-fraction',
      values: [8, 0],
    },
    {
      id: 'unit-3-b9',
      section: 'explore',
      title: 'Một phần chín',
      text: 'Chia băng giấy thành 9 phần bằng nhau, tô màu 1 phần. Phần tô màu là một phần chín băng giấy, viết là 1/9.',
      visual: 'unit-fraction',
      values: [9, 0],
    },
    {
      id: 'unit-3-b10',
      section: 'explore',
      title: 'Một phần của một nhóm đồ vật',
      text: '12 chấm tròn được chia đều thành 3 nhóm, mỗi nhóm có 4 chấm. Nhóm được tô màu là 1/3 số chấm tròn.',
      visual: 'unit-fraction',
      values: [3, 4],
    },
    {
      id: 'unit-3-b11',
      section: 'example',
      title: '1. Nhận biết phần tô màu',
      text: 'Băng giấy có 4 phần bằng nhau, 1 phần được tô màu.\nPhần tô màu là 1/4 băng giấy. Đọc là: một phần tư.',
      visual: 'unit-fraction',
      values: [4, 0],
    },
    {
      id: 'unit-3-b12',
      section: 'example',
      title: '2. Chia đều một nhóm đồ vật',
      text: 'Có 10 chấm tròn, chia đều thành 2 nhóm.\nMỗi nhóm có: 10 : 2 = 5 (chấm tròn).\nMột nhóm là 1/2 số chấm tròn.',
      visual: 'unit-fraction',
      values: [2, 5],
    },
    {
      id: 'unit-3-b13',
      section: 'example',
      title: '3. Vì sao phải chia bằng nhau?',
      text: 'Một chiếc bánh được cắt thành 3 miếng to nhỏ khác nhau. Lấy 1 miếng chưa thể gọi là lấy 1/3 chiếc bánh. Muốn mỗi miếng là 1/3 chiếc bánh, phải chia bánh thành 3 phần bằng nhau.',
      visual: 'none',
      values: [],
    },
    {
      id: 'unit-3-b14',
      section: 'guided',
      title: 'Em thử làm',
      text: 'Có 15 chấm tròn chia đều thành 5 nhóm. Hãy đếm số chấm ở một nhóm. Nhóm đó là một phần mấy của cả 15 chấm tròn?',
      visual: 'unit-fraction',
      values: [5, 3],
    },
  ],
  exercises: [
    {
      id: 'unit-3-e1',
      section: 'foundation',
      kind: 'choice',
      prompt:
        'Muốn mỗi miếng bánh là 1/4 chiếc bánh, phải chia bánh như thế nào?',
      answer: 'Chia thành 4 phần bằng nhau',
      hint: 'Chú ý số phần và kích thước mỗi phần.',
      solution:
        'Chia bánh thành 4 phần bằng nhau thì mỗi phần là 1/4 chiếc bánh.',
      options: [
        'Chia thành 4 phần bằng nhau',
        'Chia thành 4 phần bất kì',
        'Chia thành 2 phần bằng nhau',
      ],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'unit-3-e2',
      section: 'guided',
      kind: 'number',
      prompt:
        'Có 15 chấm tròn chia đều thành 5 nhóm. Một nhóm có bao nhiêu chấm tròn?',
      answer: '3',
      hint: 'Tính 15 : 5.',
      solution:
        'Số chấm tròn mỗi nhóm là:\n15 : 5 = 3 (chấm tròn).\nĐáp số: 3 chấm tròn.',
      options: [],
      unit: 'chấm tròn',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'unit-3-e3',
      section: 'practice',
      kind: 'fraction',
      prompt:
        'Một hình chia thành 8 phần bằng nhau, tô màu 1 phần. Viết số chỉ phần đã tô màu.',
      answer: '1/8',
      hint: 'Đếm số phần bằng nhau của cả hình.',
      solution: 'Một trong 8 phần bằng nhau là 1/8 hình.',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'unit-3-e4',
      section: 'practice',
      kind: 'choice',
      prompt:
        'Chia một tờ giấy thành 3 phần không bằng nhau rồi tô màu 1 phần. Có thể kết luận phần tô màu là 1/3 tờ giấy không?',
      answer: 'Không',
      hint: 'Các phần có bằng nhau không?',
      solution:
        'Không. Muốn mỗi phần là 1/3 tờ giấy, phải chia thành 3 phần bằng nhau.',
      options: ['Có', 'Không'],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'unit-3-e5',
      section: 'extra',
      kind: 'fraction',
      prompt: 'Viết số: một phần hai.',
      answer: '1/2',
      hint: 'Viết 1 ở trên, số phần bằng nhau ở dưới.',
      solution: 'Một phần hai viết là 1/2.',
      solutionStyle: 'answer-only',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e6',
      section: 'extra',
      kind: 'fraction',
      prompt: 'Viết số: một phần ba.',
      answer: '1/3',
      hint: 'Viết 1 ở trên, số phần bằng nhau ở dưới.',
      solution: 'Một phần ba viết là 1/3.',
      solutionStyle: 'answer-only',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e7',
      section: 'extra',
      kind: 'fraction',
      prompt: 'Viết số: một phần tư.',
      answer: '1/4',
      hint: 'Viết 1 ở trên, số phần bằng nhau ở dưới.',
      solution: 'Một phần tư viết là 1/4.',
      solutionStyle: 'answer-only',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e8',
      section: 'extra',
      kind: 'fraction',
      prompt: 'Viết số: một phần năm.',
      answer: '1/5',
      hint: 'Viết 1 ở trên, số phần bằng nhau ở dưới.',
      solution: 'Một phần năm viết là 1/5.',
      solutionStyle: 'answer-only',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e9',
      section: 'extra',
      kind: 'fraction',
      prompt:
        'Một chiếc bánh được chia thành 6 miếng bằng nhau. Mai lấy 1 miếng. Mai lấy một phần mấy chiếc bánh?',
      answer: '1/6',
      hint: 'Chiếc bánh được chia thành mấy miếng bằng nhau? Mai lấy mấy miếng?',
      solution: 'Mai lấy 1 trong 6 miếng bằng nhau, nên lấy 1/6 chiếc bánh.',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e10',
      section: 'extra',
      kind: 'fraction',
      prompt:
        'Một sợi dây được cắt thành 7 đoạn dài bằng nhau. Một đoạn dài bằng một phần mấy sợi dây ban đầu?',
      answer: '1/7',
      hint: 'So sánh một đoạn với cả sợi dây gồm 7 đoạn bằng nhau.',
      solution:
        'Sợi dây được chia thành 7 đoạn dài bằng nhau. Một đoạn là 1 trong 7 phần bằng nhau nên dài bằng 1/7 sợi dây ban đầu.',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e11',
      section: 'extra',
      kind: 'fraction',
      prompt:
        'Một chiếc pizza được chia thành 8 miếng bằng nhau. Nam ăn 1 miếng. Nam đã ăn một phần mấy chiếc pizza?',
      answer: '1/8',
      hint: 'Nam ăn một trong tám miếng bằng nhau.',
      solution:
        'Chiếc pizza được chia thành 8 miếng bằng nhau. Nam ăn 1 miếng nên đã ăn 1/8 chiếc pizza.',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e12',
      section: 'extra',
      kind: 'fraction',
      prompt:
        'Một thanh sô-cô-la gồm 9 ô bằng nhau. Lan bẻ lấy 1 ô. Phần Lan lấy bằng một phần mấy thanh sô-cô-la?',
      answer: '1/9',
      hint: 'Cả thanh gồm 9 ô bằng nhau; Lan lấy 1 ô.',
      solution:
        'Thanh sô-cô-la có 9 ô bằng nhau. Lan lấy 1 ô nên phần Lan lấy bằng 1/9 thanh sô-cô-la.',
      options: [],
      unit: '',
      simplified: true,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e13',
      section: 'extra',
      kind: 'choice',
      prompt: '1/4 đọc là gì?',
      answer: 'Một phần tư',
      hint: 'Số 4 trong cách đọc này là “tư”.',
      solution: '1/4 đọc là một phần tư.',
      solutionStyle: 'answer-only',
      options: ['Một phần ba', 'Một phần tư', 'Một phần năm'],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e14',
      section: 'extra',
      kind: 'number',
      prompt:
        'Để lấy 1/7 một băng giấy, cần chia băng giấy thành mấy phần bằng nhau?',
      answer: '7',
      hint: 'Số ở dưới cho biết số phần bằng nhau.',
      solution: 'Chia thành 7 phần bằng nhau rồi lấy 1 phần.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e15',
      section: 'extra',
      kind: 'choice',
      prompt:
        'Một chiếc bánh chia thành 6 miếng to nhỏ khác nhau. Một miếng bất kì có chắc bằng 1/6 chiếc bánh không?',
      answer: 'Không',
      hint: 'Kiểm tra điều kiện các phần bằng nhau.',
      solution:
        'Không. Các miếng không bằng nhau nên không thể kết luận một miếng bất kì là 1/6 chiếc bánh.',
      options: ['Có', 'Không'],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e16',
      section: 'extra',
      kind: 'number',
      prompt:
        'Một băng giấy chia thành 8 phần bằng nhau. Cần tô mấy phần để được 1/8 băng giấy?',
      answer: '1',
      hint: 'Một phần tám nghĩa là lấy một trong tám phần bằng nhau.',
      solution: 'Tô 1 phần trong 8 phần bằng nhau.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e17',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 12 quả cam chia đều thành 2 nhóm. Một nhóm là một phần hai số quả cam. Mỗi nhóm có bao nhiêu quả cam?',
      answer: '6',
      hint: 'Tính 12 : 2.',
      solution:
        'Số quả cam mỗi nhóm là:\n12 : 2 = 6 (quả cam).\nĐáp số: 6 quả cam.',
      options: [],
      unit: 'quả cam',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e18',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 12 chiếc bút chia đều thành 3 nhóm. Một nhóm là một phần ba số chiếc bút. Mỗi nhóm có bao nhiêu chiếc bút?',
      answer: '4',
      hint: 'Tính 12 : 3.',
      solution:
        'Số chiếc bút mỗi nhóm là:\n12 : 3 = 4 (chiếc bút).\nĐáp số: 4 chiếc bút.',
      options: [],
      unit: 'chiếc bút',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e19',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 16 viên bi chia đều thành 4 nhóm. Một nhóm là một phần tư số viên bi. Mỗi nhóm có bao nhiêu viên bi?',
      answer: '4',
      hint: 'Tính 16 : 4.',
      solution:
        'Số viên bi mỗi nhóm là:\n16 : 4 = 4 (viên bi).\nĐáp số: 4 viên bi.',
      options: [],
      unit: 'viên bi',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e20',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 20 nhãn vở chia đều thành 5 nhóm. Một nhóm là một phần năm số nhãn vở. Mỗi nhóm có bao nhiêu nhãn vở?',
      answer: '4',
      hint: 'Tính 20 : 5.',
      solution:
        'Số nhãn vở mỗi nhóm là:\n20 : 5 = 4 (nhãn vở).\nĐáp số: 4 nhãn vở.',
      options: [],
      unit: 'nhãn vở',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e21',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 18 bông hoa chia đều thành 3 nhóm. Một nhóm là một phần ba số bông hoa. Mỗi nhóm có bao nhiêu bông hoa?',
      answer: '6',
      hint: 'Tính 18 : 3.',
      solution:
        'Số bông hoa mỗi nhóm là:\n18 : 3 = 6 (bông hoa).\nĐáp số: 6 bông hoa.',
      options: [],
      unit: 'bông hoa',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'unit-3-e22',
      section: 'extra',
      kind: 'number',
      prompt:
        'Có 24 quyển vở chia đều thành 4 nhóm. Một nhóm là một phần tư số quyển vở. Mỗi nhóm có bao nhiêu quyển vở?',
      answer: '6',
      hint: 'Tính 24 : 4.',
      solution:
        'Số quyển vở mỗi nhóm là:\n24 : 4 = 6 (quyển vở).\nĐáp số: 6 quyển vở.',
      options: [],
      unit: 'quyển vở',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Nhận biết một phần mấy',
      difficulty: 'medium',
      workspace: 'medium',
    },
  ],
};

export function addUnitFractionLesson(
  lessons: MathLessonData[]
): MathLessonData[] {
  if (
    lessons.length >= 100 ||
    lessons.some((l) => l.id === unitFractionLesson.id)
  )
    return lessons;
  const next = [...lessons];
  const index = next.findIndex(
    (l) => l.id === 'math-multiply-divide-components-3'
  );
  next.splice(
    index < 0 ? next.length : index + 1,
    0,
    structuredClone(unitFractionLesson)
  );
  return next;
}

// Exact historical sample records only. Never replace teacher-edited working.
export function upgradeUnitFractionSolutions(
  lessons: MathLessonData[]
): MathLessonData[] {
  const previous: Record<string, string> = {
    'unit-3-e10': 'Một đoạn dài bằng 1/7 sợi dây ban đầu.',
    'unit-3-e11': 'Nam đã ăn 1/8 chiếc pizza.',
    'unit-3-e12': 'Phần Lan lấy bằng 1/9 thanh sô-cô-la.',
  };
  return lessons.map((lesson) =>
    lesson.id !== unitFractionLesson.id
      ? lesson
      : {
          ...lesson,
          exercises: lesson.exercises.map((exercise) => {
            const source = unitFractionLesson.exercises.find(
              (e) => e.id === exercise.id
            );
            if (
              !source ||
              exercise.kind !== source.kind ||
              exercise.prompt !== source.prompt ||
              exercise.answer !== source.answer ||
              exercise.solutionStyle !== undefined ||
              JSON.stringify(exercise.options) !==
                JSON.stringify(source.options)
            )
              return exercise;
            if (exercise.solution === previous[exercise.id])
              return { ...exercise, solution: source.solution };
            if (source.solutionStyle && exercise.solution === source.solution)
              return { ...exercise, solutionStyle: source.solutionStyle };
            return exercise;
          }),
        }
  );
}

// Refresh untouched sample wording without overwriting teacher-authored questions.
export function varyUnitFractionContexts(
  lessons: MathLessonData[]
): MathLessonData[] {
  return lessons.map((lesson) =>
    lesson.id !== unitFractionLesson.id
      ? lesson
      : {
          ...lesson,
          exercises: lesson.exercises.map((exercise) => {
            const n = Number(exercise.id.replace('unit-3-e', '')) - 3;
            if (
              n < 6 ||
              n > 9 ||
              exercise.prompt !==
                `Một băng giấy chia thành ${n} phần bằng nhau, tô màu 1 phần. Viết số chỉ phần đã tô màu.` ||
              exercise.solution !== `Phần tô màu là 1/${n} băng giấy.` ||
              exercise.answer !== `1/${n}` ||
              exercise.hint !== 'Lấy một phần trong các phần bằng nhau.'
            )
              return exercise;
            const source = unitFractionLesson.exercises.find(
              (e) => e.id === exercise.id
            )!;
            return {
              ...exercise,
              prompt: source.prompt,
              hint: source.hint,
              solution: source.solution,
            };
          }),
        }
  );
}

export function removeUnitFractionDrawingQuestions(lessons: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => lesson.id === unitFractionLesson.id ? {
    ...lesson, exercises: lesson.exercises.filter(e => !['unit-3-e23', 'unit-3-e24'].includes(e.id)),
  } : lesson);
}
