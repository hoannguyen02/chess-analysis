import { MathLessonData } from './lessons';

export const fractionOrderLesson: MathLessonData = {
  "id": "math-fraction-order-6",
  "title": "So sánh và sắp xếp các số",
  "grade": 6,
  "topic": "Phân số mở rộng",
  "goal": "So sánh phân số, số nguyên, hỗn số và số thập phân; sắp xếp tăng dần, giảm dần.",
  "textbook": "Bài tổng hợp tự biên soạn theo kiến thức phân số, hỗn số dương và số thập phân lớp 6.",
  "teacherNotes": "Học sau khi đã làm quen số thập phân. Hỗn số dùng trong bài là hỗn số dương; phân số, số nguyên và số thập phân có cả số âm. Bài sắp xếp chọn dãy đúng để chấm tự động.",
  "knowledgeSummary": "Đổi hỗn số và số thập phân về phân số; quy đồng về mẫu lớn hơn 0 rồi so sánh tử.\nSố âm < 0 < số dương. Tăng dần: từ bé đến lớn; giảm dần: từ lớn đến bé.\nVí dụ: 1 1/4 = 5/4 = 25/20 < 26/20 = 1,3.\nLưu ý: Không làm tròn trước khi so sánh. 1,5 = 1 1/2; các cách viết khác nhau có thể chỉ cùng một số.",
  "blocks": [
    {
      "id": "math-fraction-order-6-pre",
      "section": "foundation",
      "title": "Em cần biết gì trước?",
      "text": "Nhớ cách quy đồng, so sánh số nguyên và đọc số thập phân. Mẫu số phải khác 0.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-convert",
      "section": "explore",
      "title": "Đổi về cùng dạng",
      "text": "Số nguyên có thể viết thành phân số: -2 = -2/1.\nHỗn số dương gồm phần nguyên và phần phân số nhỏ hơn 1: 1 2/3 = 1 + 2/3 = (1 × 3 + 2)/3 = 5/3.\nSố thập phân hữu hạn có thể đổi thành phân số: 0,75 = 75/100 = 3/4; -1,2 = -12/10 = -6/5.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-compare",
      "section": "explore",
      "title": "So sánh chính xác",
      "text": "Đưa các số về phân số có cùng mẫu lớn hơn 0 rồi so sánh các tử. Có thể xét dấu trước: số âm < 0 < số dương.\nVới hai số âm, số có phần số không mang dấu âm lớn hơn thì nhỏ hơn. Ví dụ: 0,8 > 0,75 nên -0,8 < -0,75.\nQuy đồng để so sánh chính xác; không làm tròn phân số trước khi so sánh.\nVí dụ: 2/3 = 200/300 < 201/300 = 67/100 = 0,67.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-order",
      "section": "explore",
      "title": "Tăng dần và giảm dần",
      "text": "Tăng dần: từ bé đến lớn. Giảm dần: từ lớn đến bé.\nĐổi về cùng dạng để so sánh, sau đó viết lại các số theo dạng ban đầu. Nếu hai số bằng nhau thì đặt cạnh nhau, dùng dấu = khi viết chuỗi so sánh. Ví dụ: 1 < 1,5 = 1 1/2 < 2.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-ex1",
      "section": "example",
      "title": "So sánh phân số với hỗn số và số thập phân",
      "text": "So sánh 1 1/4 và 1,3.\n1 1/4 = (1 × 4 + 1)/4 = 5/4 = 25/20.\n1,3 = 13/10 = 26/20.\n25 < 26 nên 1 1/4 < 1,3.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-ex2",
      "section": "example",
      "title": "Sắp xếp tăng dần",
      "text": "Sắp xếp: 1 1/2; -1; 0,25; -3/4.\n1 1/2 = 3/2 = 6/4; -1 = -4/4; 0,25 = 1/4.\n-4 < -3 < 1 < 6.\nVậy: -1 < -3/4 < 0,25 < 1 1/2.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-ex3",
      "section": "example",
      "title": "Sắp xếp giảm dần",
      "text": "Sắp xếp: 2,1; 2; 2 1/4; 13/6.\n2,1 = 21/10 = 126/60; 2 = 120/60; 2 1/4 = 9/4 = 135/60; 13/6 = 130/60.\n135 > 130 > 126 > 120.\nVậy: 2 1/4 > 13/6 > 2,1 > 2.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-fraction-order-6-guided",
      "section": "guided",
      "title": "Em thử làm",
      "text": "Xác định dạng số, đổi về cùng mẫu rồi so sánh. Kiểm tra đề yêu cầu tăng dần hay giảm dần trước khi chọn đáp án.",
      "visual": "none",
      "values": []
    }
  ],
  "exercises": [
    {
      "prompt": "Điền dấu thích hợp: 1 1/2 □ 1,5.",
      "answer": "=",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "1 1/2 = (1 × 2 + 1)/2 = 3/2; 1,5 = 15/10 = 3/2.\n1 1/2 = 3/2; 1,5 = 3/2.\nVì 3 = 3 nên 1 1/2 = 1,5.",
      "id": "math-fraction-order-6-q1",
      "section": "foundation",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "prompt": "Điền dấu thích hợp: -3/4 □ -0,7.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "-0,7 = -7/10 = -7/10.\n-3/4 = -15/20; -0,7 = -14/20.\nVì -15 < -14 nên -3/4 < -0,7.",
      "id": "math-fraction-order-6-q2",
      "section": "guided",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "prompt": "Sắp xếp theo thứ tự tăng dần: 1; 3/4; 1 1/2; 0,5.",
      "answer": "0,5; 3/4; 1; 1 1/2",
      "options": [
        "3/4; 0,5; 1; 1 1/2",
        "1 1/2; 1; 3/4; 0,5",
        "0,5; 3/4; 1; 1 1/2"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "1 = 4/4; 3/4 = 3/4; 1 1/2 = 6/4; 0,5 = 2/4.\n0,5 < 3/4 < 1 < 1 1/2.",
      "id": "math-fraction-order-6-q3",
      "section": "practice",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "prompt": "Sắp xếp theo thứ tự giảm dần: 2; 7/4; 1 1/2; 1,25.",
      "answer": "2; 7/4; 1 1/2; 1,25",
      "options": [
        "1,25; 1 1/2; 7/4; 2",
        "2; 7/4; 1 1/2; 1,25",
        "7/4; 2; 1 1/2; 1,25"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "2 = 8/4; 7/4 = 7/4; 1 1/2 = 6/4; 1,25 = 5/4.\n2 > 7/4 > 1 1/2 > 1,25.",
      "id": "math-fraction-order-6-q4",
      "section": "practice",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "prompt": "Điền dấu thích hợp: 3/2 □ 1.",
      "answer": ">",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "3/2 = 3/2; 1 = 2/2.\nVì 3 > 2 nên 3/2 > 1.",
      "id": "math-fraction-order-6-q5",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "So sánh và sắp xếp",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 1 1/2 □ 1,5.",
      "answer": "=",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "1 1/2 = (1 × 2 + 1)/2 = 3/2; 1,5 = 15/10 = 3/2.\n1 1/2 = 3/2; 1,5 = 3/2.\nVì 3 = 3 nên 1 1/2 = 1,5.",
      "id": "math-fraction-order-6-q6",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "So sánh và sắp xếp",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 3/4 □ 0,8.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "0,8 = 8/10 = 4/5.\n3/4 = 15/20; 0,8 = 16/20.\nVì 15 < 16 nên 3/4 < 0,8.",
      "id": "math-fraction-order-6-q7",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "So sánh và sắp xếp",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: -1/2 □ 0.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "-1/2 = -1/2; 0 = 0/2.\nVì -1 < 0 nên -1/2 < 0.",
      "id": "math-fraction-order-6-q8",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "So sánh và sắp xếp",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: -3/4 □ -0,7.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "-0,7 = -7/10 = -7/10.\n-3/4 = -15/20; -0,7 = -14/20.\nVì -15 < -14 nên -3/4 < -0,7.",
      "id": "math-fraction-order-6-q9",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 2 1/3 □ 7/3.",
      "answer": "=",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "2 1/3 = (2 × 3 + 1)/3 = 7/3.\n2 1/3 = 7/3; 7/3 = 7/3.\nVì 7 = 7 nên 2 1/3 = 7/3.",
      "id": "math-fraction-order-6-q10",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 5/4 □ 1,2.",
      "answer": ">",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "1,2 = 12/10 = 6/5.\n5/4 = 25/20; 1,2 = 24/20.\nVì 25 > 24 nên 5/4 > 1,2.",
      "id": "math-fraction-order-6-q11",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: -5/2 □ -2.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "-5/2 = -5/2; -2 = -4/2.\nVì -5 < -4 nên -5/2 < -2.",
      "id": "math-fraction-order-6-q12",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 2/3 □ 0,67.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "0,67 = 67/100 = 67/100.\n2/3 = 200/300; 0,67 = 201/300.\nVì 200 < 201 nên 2/3 < 0,67.",
      "id": "math-fraction-order-6-q13",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Điền dấu thích hợp: 1 3/4 □ 1,8.",
      "answer": "<",
      "options": [
        "<",
        "=",
        ">"
      ],
      "hint": "Đổi hỗn số, số thập phân về phân số rồi quy đồng mẫu số lớn hơn 0.",
      "solution": "1 3/4 = (1 × 4 + 3)/4 = 7/4; 1,8 = 18/10 = 9/5.\n1 3/4 = 35/20; 1,8 = 36/20.\nVì 35 < 36 nên 1 3/4 < 1,8.",
      "id": "math-fraction-order-6-q14",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự tăng dần: 1; 3/4; 1 1/2; 0,5.",
      "answer": "0,5; 3/4; 1; 1 1/2",
      "options": [
        "3/4; 0,5; 1; 1 1/2",
        "1 1/2; 1; 3/4; 0,5",
        "0,5; 3/4; 1; 1 1/2"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "1 = 4/4; 3/4 = 3/4; 1 1/2 = 6/4; 0,5 = 2/4.\n0,5 < 3/4 < 1 < 1 1/2.",
      "id": "math-fraction-order-6-q15",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự giảm dần: 2; 7/4; 1 1/2; 1,25.",
      "answer": "2; 7/4; 1 1/2; 1,25",
      "options": [
        "1,25; 1 1/2; 7/4; 2",
        "2; 7/4; 1 1/2; 1,25",
        "7/4; 2; 1 1/2; 1,25"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "2 = 8/4; 7/4 = 7/4; 1 1/2 = 6/4; 1,25 = 5/4.\n2 > 7/4 > 1 1/2 > 1,25.",
      "id": "math-fraction-order-6-q16",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự tăng dần: -1; -3/4; 0; -0,5.",
      "answer": "-1; -3/4; -0,5; 0",
      "options": [
        "-1; -3/4; -0,5; 0",
        "-3/4; -1; -0,5; 0",
        "0; -0,5; -3/4; -1"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "-1 = -4/4; -3/4 = -3/4; 0 = 0/4; -0,5 = -2/4.\n-1 < -3/4 < -0,5 < 0.",
      "id": "math-fraction-order-6-q17",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự giảm dần: -2; -5/4; 0,5; 1 1/4.",
      "answer": "1 1/4; 0,5; -5/4; -2",
      "options": [
        "0,5; 1 1/4; -5/4; -2",
        "-2; -5/4; 0,5; 1 1/4",
        "1 1/4; 0,5; -5/4; -2"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "-2 = -8/4; -5/4 = -5/4; 0,5 = 2/4; 1 1/4 = 5/4.\n1 1/4 > 0,5 > -5/4 > -2.",
      "id": "math-fraction-order-6-q18",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự tăng dần: 1 1/3; 1,2; 5/4; 1.",
      "answer": "1; 1,2; 5/4; 1 1/3",
      "options": [
        "1 1/3; 5/4; 1,2; 1",
        "1; 1,2; 5/4; 1 1/3",
        "1,2; 1; 5/4; 1 1/3"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "1 1/3 = 80/60; 1,2 = 72/60; 5/4 = 75/60; 1 = 60/60.\n1 < 1,2 < 5/4 < 1 1/3.",
      "id": "math-fraction-order-6-q19",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự giảm dần: 2/3; 0,67; 1; 1 1/2.",
      "answer": "1 1/2; 1; 0,67; 2/3",
      "options": [
        "1 1/2; 1; 0,67; 2/3",
        "1; 1 1/2; 0,67; 2/3",
        "2/3; 0,67; 1; 1 1/2"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "2/3 = 200/300; 0,67 = 201/300; 1 = 300/300; 1 1/2 = 450/300.\n1 1/2 > 1 > 0,67 > 2/3.",
      "id": "math-fraction-order-6-q20",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự tăng dần: -1,2; -5/4; 0; 1 1/5.",
      "answer": "-5/4; -1,2; 0; 1 1/5",
      "options": [
        "-1,2; -5/4; 0; 1 1/5",
        "1 1/5; 0; -1,2; -5/4",
        "-5/4; -1,2; 0; 1 1/5"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "-1,2 = -24/20; -5/4 = -25/20; 0 = 0/20; 1 1/5 = 24/20.\n-5/4 < -1,2 < 0 < 1 1/5.",
      "id": "math-fraction-order-6-q21",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Sắp xếp theo thứ tự giảm dần: 3; 2 1/4; 2,2; 7/3.",
      "answer": "3; 7/3; 2 1/4; 2,2",
      "options": [
        "2,2; 2 1/4; 7/3; 3",
        "3; 7/3; 2 1/4; 2,2",
        "7/3; 3; 2 1/4; 2,2"
      ],
      "hint": "Đưa về cùng mẫu; tăng dần từ bé đến lớn, giảm dần từ lớn đến bé.",
      "solution": "3 = 180/60; 2 1/4 = 135/60; 2,2 = 132/60; 7/3 = 140/60.\n3 > 7/3 > 2 1/4 > 2,2.",
      "id": "math-fraction-order-6-q22",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "So sánh và sắp xếp",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "prompt": "Chọn số nhỏ nhất trong các số: -1; -0,9; -5/4; 1 1/4.",
      "answer": "-5/4",
      "options": [
        "-1",
        "-0,9",
        "-5/4",
        "1 1/4"
      ],
      "hint": "Quy đồng mẫu số; chú ý thứ tự khi các số đều âm.",
      "solution": "-1 = -20/20; -0,9 = -18/20; -5/4 = -25/20; 1 1/4 = 25/20.\nSố nhỏ nhất là -5/4.",
      "id": "math-fraction-order-6-q23",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "So sánh và sắp xếp",
      "difficulty": "hard",
      "workspace": "medium"
    },
    {
      "prompt": "Chọn số nhỏ nhất trong các số: 2; 2 1/5; 2,19; 11/5.",
      "answer": "2",
      "options": [
        "2",
        "2 1/5",
        "2,19",
        "11/5"
      ],
      "hint": "Quy đồng mẫu số; chú ý thứ tự khi các số đều âm.",
      "solution": "2 = 200/100; 2 1/5 = 220/100; 2,19 = 219/100; 11/5 = 220/100.\nSố nhỏ nhất là 2.",
      "id": "math-fraction-order-6-q24",
      "section": "extra",
      "kind": "choice",
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "So sánh và sắp xếp",
      "difficulty": "hard",
      "workspace": "medium"
    }
  ]
};

export function addFractionOrderLesson(lessons: MathLessonData[]) {
  if (lessons.length >= 100 || lessons.some(l => l.id === fractionOrderLesson.id)) return lessons;
  return [...lessons, structuredClone(fractionOrderLesson)];
}


export function clarifyFractionComparison(lessons: MathLessonData[]) {
  const previous = 'Không làm tròn trước khi so sánh: 2/3 < 67/100 vì 200/300 < 201/300.';
  const replacement = 'Quy đồng để so sánh chính xác; không làm tròn phân số trước khi so sánh.\nVí dụ: 2/3 = 200/300 < 201/300 = 67/100 = 0,67.';
  return lessons.map(lesson => lesson.id !== fractionOrderLesson.id ? lesson : {
    ...lesson,
    blocks: lesson.blocks.map(block => block.id !== 'math-fraction-order-6-compare' ? block : {
      ...block, text: block.text.replace(previous, replacement),
    }),
  });
}
