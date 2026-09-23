import type { MathExercise, MathLessonData } from './lessons';

export const componentTableExercises: MathExercise[] = [
  {
    "id": "components-3-table-addition",
    "section": "extra",
    "kind": "written",
    "group": "skills",
    "skill": "Tìm thành phần trong phép cộng, phép trừ",
    "difficulty": "medium",
    "workspace": "small",
    "prompt": "Điền số thích hợp vào các ô có dấu ? trong bảng phép cộng.",
    "answer": "125; 160; 500; 108; 174",
    "hint": "Mỗi cột là một phép tính. Gọi tên thành phần chưa biết trước khi tính.",
    "solution": "Các số cần điền theo thứ tự cột từ trái sang phải: 125; 160; 500; 108; 174.",
    "criteria": [
      "Điền đúng các số còn thiếu và thử lại từng phép tính."
    ],
    "options": [],
    "unit": "",
    "simplified": false,
    "tolerance": 0,
    "mistakes": [],
    "table": {
      "rows": [
        [
          "Số hạng",
          "?",
          "240",
          "315",
          "?",
          "426"
        ],
        [
          "Số hạng",
          "75",
          "?",
          "185",
          "292",
          "?"
        ],
        [
          "Tổng",
          "200",
          "400",
          "?",
          "400",
          "600"
        ]
      ],
      "solution": [
        [
          "Số hạng",
          "125",
          "240",
          "315",
          "108",
          "426"
        ],
        [
          "Số hạng",
          "75",
          "160",
          "185",
          "292",
          "174"
        ],
        [
          "Tổng",
          "200",
          "400",
          "500",
          "400",
          "600"
        ]
      ]
    }
  },
  {
    "id": "components-3-table-subtraction",
    "section": "extra",
    "kind": "written",
    "group": "skills",
    "skill": "Tìm thành phần trong phép cộng, phép trừ",
    "difficulty": "medium",
    "workspace": "small",
    "prompt": "Điền số thích hợp vào các ô có dấu ? trong bảng phép trừ.",
    "answer": "350; 245; 438; 470; 456",
    "hint": "Mỗi cột là một phép tính. Gọi tên thành phần chưa biết trước khi tính.",
    "solution": "Các số cần điền theo thứ tự cột từ trái sang phải: 350; 245; 438; 470; 456.",
    "criteria": [
      "Điền đúng các số còn thiếu và thử lại từng phép tính."
    ],
    "options": [],
    "unit": "",
    "simplified": false,
    "tolerance": 0,
    "mistakes": [],
    "table": {
      "rows": [
        [
          "Số bị trừ",
          "?",
          "620",
          "805",
          "?",
          "900"
        ],
        [
          "Số trừ",
          "125",
          "?",
          "367",
          "180",
          "?"
        ],
        [
          "Hiệu",
          "225",
          "375",
          "?",
          "290",
          "444"
        ]
      ],
      "solution": [
        [
          "Số bị trừ",
          "350",
          "620",
          "805",
          "470",
          "900"
        ],
        [
          "Số trừ",
          "125",
          "245",
          "367",
          "180",
          "456"
        ],
        [
          "Hiệu",
          "225",
          "375",
          "438",
          "290",
          "444"
        ]
      ]
    }
  }
];

export const additionSubtractionLesson: MathLessonData = {
  id: 'math-add-subtract-components-3',
  title: 'Tìm thành phần trong phép cộng, phép trừ',
  grade: 3,
  semester: '1',
  topic: 'Số học',
  goal: 'Tìm số hạng, số bị trừ, số trừ và vận dụng vào bài toán có lời văn.',
  textbook:
    'Bài tự biên soạn theo chủ đề Toán 3: tìm thành phần trong phép cộng, phép trừ.',
  teacherNotes:
    'Tham khảo tài liệu tập huấn Toán 3 Kết nối tri thức: https://api.iseebooks.vn/upload/Tap%20huan/Bo%20ket%20noi/Lop%203/Toan/SGV3.pdf. Dùng ô trống, gọi tên thành phần trước khi tính và thử lại. Các phép tính trong phạm vi 1 000.',
  knowledgeSummary:
    'Số hạng + Số hạng = Tổng.\nSố bị trừ − Số trừ = Hiệu.\nTìm số hạng: lấy tổng trừ số hạng đã biết.\nTìm số bị trừ: lấy hiệu cộng số trừ.\nTìm số trừ: lấy số bị trừ trừ hiệu.\nVí dụ: □ + 25 = 60 → □ = 35; □ − 25 = 60 → □ = 85; 60 − □ = 25 → □ = 35.\nLưu ý: Xác định đúng tên thành phần chưa biết; thay kết quả vào ô trống để thử lại.',
  blocks: [
    {
      id: 'components-3-b1',
      section: 'foundation',
      title: 'Tên gọi các thành phần',
      text: 'Trong phép cộng 24 + 15 = 39: 24 và 15 là các số hạng, 39 là tổng.\nTrong phép trừ 39 − 15 = 24: 39 là số bị trừ, 15 là số trừ, 24 là hiệu.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b2',
      section: 'explore',
      title: 'Tìm số hạng',
      text: 'Số hạng chưa biết = Tổng − Số hạng đã biết.\nÔ trống có thể đứng trước hoặc sau dấu cộng: □ + 15 = 39 hoặc 15 + □ = 39 đều có số cần tìm là 39 − 15 = 24.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b3',
      section: 'explore',
      title: 'Tìm số bị trừ',
      text: 'Số bị trừ = Hiệu + Số trừ.\nVới □ − 15 = 24, lấy 24 + 15 = 39.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b4',
      section: 'explore',
      title: 'Tìm số trừ',
      text: 'Số trừ = Số bị trừ − Hiệu.\nVới 39 − □ = 24, lấy 39 − 24 = 15.\nTrước khi tính, hãy xác định ô trống là số bị trừ hay số trừ.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b5',
      section: 'example',
      title: '1. Tìm số hạng',
      text: '□ + 126 = 350.\nÔ trống là số hạng chưa biết.\nSố cần tìm là: 350 − 126 = 224.\nThử lại: 224 + 126 = 350.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b6',
      section: 'example',
      title: '2. Tìm số bị trừ',
      text: '□ − 145 = 230.\nÔ trống là số bị trừ.\nSố cần tìm là: 230 + 145 = 375.\nThử lại: 375 − 145 = 230.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b7',
      section: 'example',
      title: '3. Tìm số trừ',
      text: '462 − □ = 218.\nÔ trống là số trừ.\nSố cần tìm là: 462 − 218 = 244.\nThử lại: 462 − 244 = 218.',
      visual: 'none',
      values: [],
    },
    {
      id: 'components-3-b8',
      section: 'guided',
      title: 'Em thử làm',
      text: 'Với 175 + □ = 400, hãy gọi tên thành phần chưa biết, chọn phép tính rồi thử lại bằng cách thay kết quả vào ô trống.',
      visual: 'none',
      values: [],
    },
  ],
  exercises: [
    {
      id: 'components-3-e1',
      section: 'foundation',
      kind: 'number',
      prompt: 'Trong phép trừ 58 − 23 = 35, số bị trừ là số nào?',
      answer: '58',
      hint: 'Số bị trừ đứng trước dấu trừ.',
      solution: '58 là số bị trừ; 23 là số trừ; 35 là hiệu.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'components-3-e2',
      section: 'guided',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 175 + □ = 400.',
      answer: '225',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 400 − 175 = 225.\nThử lại: 175 + 225 = 400.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'components-3-e3',
      section: 'practice',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ − 128 = 245.',
      answer: '373',
      hint: 'Số bị trừ = Hiệu + Số trừ.',
      solution:
        'Số bị trừ = Hiệu + Số trừ.\nSố cần tìm là: 245 + 128 = 373.\nThử lại: 373 − 128 = 245.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'components-3-e4',
      section: 'practice',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 500 − □ = 235.',
      answer: '265',
      hint: 'Số trừ = Số bị trừ − Hiệu.',
      solution:
        'Số trừ = Số bị trừ − Hiệu.\nSố cần tìm là: 500 − 235 = 265.\nThử lại: 500 − 265 = 235.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
    },
    {
      id: 'components-3-e5',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ + 18 = 45.',
      answer: '27',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 45 − 18 = 27.\nThử lại: 27 + 18 = 45.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e6',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 32 + □ = 70.',
      answer: '38',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 70 − 32 = 38.\nThử lại: 32 + 38 = 70.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e7',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ − 24 = 36.',
      answer: '60',
      hint: 'Số bị trừ = Hiệu + Số trừ.',
      solution:
        'Số bị trừ = Hiệu + Số trừ.\nSố cần tìm là: 36 + 24 = 60.\nThử lại: 60 − 24 = 36.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e8',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 85 − □ = 47.',
      answer: '38',
      hint: 'Số trừ = Số bị trừ − Hiệu.',
      solution:
        'Số trừ = Số bị trừ − Hiệu.\nSố cần tìm là: 85 − 47 = 38.\nThử lại: 85 − 38 = 47.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'foundation',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e9',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ + 137 = 325.',
      answer: '188',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 325 − 137 = 188.\nThử lại: 188 + 137 = 325.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e10',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 246 + □ = 600.',
      answer: '354',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 600 − 246 = 354.\nThử lại: 246 + 354 = 600.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e11',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ − 159 = 278.',
      answer: '437',
      hint: 'Số bị trừ = Hiệu + Số trừ.',
      solution:
        'Số bị trừ = Hiệu + Số trừ.\nSố cần tìm là: 278 + 159 = 437.\nThử lại: 437 − 159 = 278.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e12',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 704 − □ = 286.',
      answer: '418',
      hint: 'Số trừ = Số bị trừ − Hiệu.',
      solution:
        'Số trừ = Số bị trừ − Hiệu.\nSố cần tìm là: 704 − 286 = 418.\nThử lại: 704 − 418 = 286.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e13',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ + 308 = 700.',
      answer: '392',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 700 − 308 = 392.\nThử lại: 392 + 308 = 700.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e14',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 425 + □ = 425.',
      answer: '0',
      hint: 'Số hạng chưa biết = Tổng − Số hạng đã biết.',
      solution:
        'Số hạng chưa biết = Tổng − Số hạng đã biết.\nSố cần tìm là: 425 − 425 = 0.\nThử lại: 425 + 0 = 425.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e15',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: □ − 267 = 333.',
      answer: '600',
      hint: 'Số bị trừ = Hiệu + Số trừ.',
      solution:
        'Số bị trừ = Hiệu + Số trừ.\nSố cần tìm là: 333 + 267 = 600.\nThử lại: 600 − 267 = 333.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    {
      id: 'components-3-e16',
      section: 'extra',
      kind: 'number',
      prompt: 'Tìm số thích hợp điền vào ô trống: 900 − □ = 456.',
      answer: '444',
      hint: 'Số trừ = Số bị trừ − Hiệu.',
      solution:
        'Số trừ = Số bị trừ − Hiệu.\nSố cần tìm là: 900 − 456 = 444.\nThử lại: 900 − 444 = 456.',
      options: [],
      unit: '',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'skills',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'easy',
      workspace: 'medium',
    },
    ...componentTableExercises,
    {
      id: 'components-3-e17',
      section: 'extra',
      kind: 'number',
      prompt:
        'Lan có 125 nhãn vở. Lan được tặng thêm một số nhãn vở và có tất cả 200 nhãn vở. Lan được tặng thêm bao nhiêu nhãn vở?',
      answer: '75',
      hint: 'Tìm số hạng chưa biết.',
      solution:
        'Số nhãn vở Lan được tặng thêm là:\n200 − 125 = 75 (nhãn vở).\nĐáp số: 75 nhãn vở.',
      options: [],
      unit: 'nhãn vở',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'components-3-e18',
      section: 'extra',
      kind: 'number',
      prompt:
        'Một thư viện có một số quyển sách. Sau khi nhận thêm 145 quyển, thư viện có 520 quyển sách. Ban đầu thư viện có bao nhiêu quyển sách?',
      answer: '375',
      hint: 'Lấy số sách sau khi nhận trừ số sách nhận thêm.',
      solution:
        'Số quyển sách ban đầu là:\n520 − 145 = 375 (quyển).\nĐáp số: 375 quyển sách.',
      options: [],
      unit: 'quyển',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'components-3-e19',
      section: 'extra',
      kind: 'number',
      prompt:
        'Một cửa hàng bán 128 kg gạo thì còn 245 kg gạo. Lúc đầu cửa hàng có bao nhiêu ki-lô-gam gạo?',
      answer: '373',
      hint: 'Tìm số bị trừ.',
      solution:
        'Số gạo lúc đầu là:\n245 + 128 = 373 (kg).\nĐáp số: 373 kg gạo.',
      options: [],
      unit: 'kg',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'components-3-e20',
      section: 'extra',
      kind: 'number',
      prompt:
        'Một hộp có một số chiếc bút. Lấy ra 36 chiếc thì còn 64 chiếc. Lúc đầu hộp có bao nhiêu chiếc bút?',
      answer: '100',
      hint: 'Số ban đầu bằng số còn lại cộng số lấy ra.',
      solution:
        'Số bút lúc đầu là:\n64 + 36 = 100 (chiếc).\nĐáp số: 100 chiếc bút.',
      options: [],
      unit: 'chiếc',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'components-3-e21',
      section: 'extra',
      kind: 'number',
      prompt:
        'Bình có 350 viên bi. Sau khi cho bạn một số viên, Bình còn 215 viên. Bình đã cho bạn bao nhiêu viên bi?',
      answer: '135',
      hint: 'Tìm số trừ.',
      solution:
        'Số viên bi Bình đã cho bạn là:\n350 − 215 = 135 (viên).\nĐáp số: 135 viên bi.',
      options: [],
      unit: 'viên',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },
    {
      id: 'components-3-e22',
      section: 'extra',
      kind: 'number',
      prompt:
        'Một bể có 600 lít nước. Sau khi dùng một số lít nước, bể còn 275 lít. Đã dùng bao nhiêu lít nước?',
      answer: '325',
      hint: 'Lấy số nước ban đầu trừ số nước còn lại.',
      solution:
        'Số lít nước đã dùng là:\n600 − 275 = 325 (lít).\nĐáp số: 325 lít nước.',
      options: [],
      unit: 'lít',
      simplified: false,
      tolerance: 0,
      mistakes: [],
      group: 'application',
      skill: 'Tìm thành phần trong phép cộng, phép trừ',
      difficulty: 'medium',
      workspace: 'medium',
    },

  ],
};

export function replaceGradeThreeLesson(
  lessons: MathLessonData[]
): MathLessonData[] {
  const oldIndex = lessons.findIndex(
    (lesson) => lesson.id === 'math-arithmetic-3'
  );
  const hasNew = lessons.some(
    (lesson) => lesson.id === additionSubtractionLesson.id
  );
  if (oldIndex < 0) {
    return hasNew || lessons.length >= 100
      ? lessons
      : [...lessons, structuredClone(additionSubtractionLesson)];
  }
  return lessons.flatMap((lesson) =>
    lesson.id !== 'math-arithmetic-3'
      ? [lesson]
      : hasNew
        ? []
        : [structuredClone(additionSubtractionLesson)]
  );
}

// Upgrade only this built-in lesson; preserve all unrelated content and edits.
export function addComponentTables(lessons: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => {
    if (lesson.id !== additionSubtractionLesson.id) return lesson;
    const exercises = lesson.exercises.filter(e => !['components-3-e23', 'components-3-e24'].includes(e.id));
    const additions = componentTableExercises.filter(e => !exercises.some(old => old.id === e.id));
    const beforeWords = exercises.findIndex(e => e.id === 'components-3-e17');
    exercises.splice(beforeWords < 0 ? exercises.length : beforeWords, 0, ...structuredClone(additions));
    return { ...lesson, exercises };
  });
}

export function assignComponentSemester(lessons: MathLessonData[]): MathLessonData[] {
  return lessons.map(lesson => lesson.id === additionSubtractionLesson.id
    ? { ...lesson, semester: '1' } : lesson);
}
