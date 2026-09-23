import type { MathExercise, MathLessonData } from './lessons';

export const numberLineLesson: MathLessonData = {
  "id": "math-number-line-7",
  "title": "Biểu diễn số trên trục số",
  "grade": 7,
  "topic": "Số hữu tỉ",
  "goal": "Biểu diễn và đọc vị trí số nguyên, phân số, hỗn số trên trục số.",
  "textbook": "Bài tự biên soạn theo chủ đề biểu diễn số hữu tỉ trên trục số lớp 7.",
  "teacherNotes": "Học sau phân số và số nguyên. Các hình trực tuyến dùng cùng tỉ lệ cho mọi khoảng trên một trục. Bài tự vẽ làm trong vở hoặc trên phiếu PDF rồi tự đối chiếu lời giải.",
  "knowledgeSummary": "Trục số có gốc 0, đoạn đơn vị và chiều dương từ trái sang phải. Các đoạn đơn vị bằng nhau.\nPhân số có mẫu b lớn hơn 0: chia mỗi đơn vị thành b phần, đếm từ 0 sang phải với số dương và sang trái với số âm.\nĐổi hỗn số thành phân số trước khi biểu diễn. Các phân số bằng nhau có cùng điểm biểu diễn.\nVí dụ: 1 1/2 = 3/2 ở giữa 1 và 2; -5/4 ở giữa -2 và -1.\nLưu ý: Đếm khoảng, không đếm vạch 0; -(1 1/2) = -3/2.",
  "blocks": [
    {
      "id": "math-number-line-7-pre",
      "section": "foundation",
      "title": "Em cần biết gì trước?",
      "text": "Nhớ thứ tự số nguyên, cách rút gọn phân số và đổi hỗn số thành phân số.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-number-line-7-axis",
      "section": "explore",
      "title": "Gốc, đơn vị và chiều của trục số",
      "text": "Chọn điểm O biểu diễn 0, một đoạn đơn vị và chiều dương từ trái sang phải. Các đoạn đơn vị phải bằng nhau.\nSố dương nằm bên phải 0; số âm nằm bên trái 0. Điểm biểu diễn số nhỏ hơn nằm bên trái điểm biểu diễn số lớn hơn.",
      "visual": "number-line",
      "values": [
        -3,
        3,
        1,
        -2
      ]
    },
    {
      "id": "math-number-line-7-fraction",
      "section": "explore",
      "title": "Chia mỗi đơn vị thành các phần bằng nhau",
      "text": "Viết phân số với mẫu lớn hơn 0. Để biểu diễn a/b, chia mỗi đoạn đơn vị thành b phần bằng nhau. Từ 0 đếm số khoảng nhỏ bằng phần số không mang dấu của tử: sang phải nếu số dương, sang trái nếu số âm.\nVí dụ: 3/4 ở vạch thứ ba bên phải 0 khi mỗi đơn vị chia thành 4 phần.",
      "visual": "number-line",
      "values": [
        -1,
        2,
        4,
        0.75
      ]
    },
    {
      "id": "math-number-line-7-mixed",
      "section": "explore",
      "title": "Đổi hỗn số rồi xác định vị trí",
      "text": "1 1/2 = (1 × 2 + 1)/2 = 3/2. Điểm biểu diễn nằm giữa 1 và 2, cách 1 một nửa đơn vị.\nVới số đối của hỗn số: -(1 1/2) = -(1 + 1/2) = -3/2, không phải -1 + 1/2. Hai điểm 3/2 và -3/2 ở hai phía của 0 và cách 0 bằng nhau.",
      "visual": "number-line",
      "values": [
        -2,
        2,
        2,
        1.5
      ]
    },
    {
      "id": "math-number-line-7-same",
      "section": "explore",
      "title": "Một số có một vị trí",
      "text": "Các phân số bằng nhau có cùng điểm biểu diễn: 1/2 = 2/4 = 0,5. Hỗn số 1 1/2 và phân số 3/2 cũng cùng một vị trí.\nKhi biểu diễn nhiều số, chọn cách chia phù hợp cho tất cả, chẳng hạn dùng 6 phần mỗi đơn vị cho 1/2 và 2/3.",
      "visual": "none",
      "values": []
    },
    {
      "id": "math-number-line-7-example-neg",
      "section": "example",
      "title": "Biểu diễn phân số âm",
      "text": "Biểu diễn -5/4.\nChia mỗi đơn vị thành 4 phần bằng nhau. Từ 0 đi sang trái 5 khoảng nhỏ. Điểm A nằm giữa -2 và -1, cách -1 một khoảng bằng 1/4 đơn vị.",
      "visual": "number-line",
      "values": [
        -2,
        1,
        4,
        -1.25
      ]
    },
    {
      "id": "math-number-line-7-example-mixed",
      "section": "example",
      "title": "Biểu diễn hỗn số",
      "text": "Biểu diễn 2 1/3.\n2 1/3 = (2 × 3 + 1)/3 = 7/3. Chia mỗi đơn vị thành 3 phần bằng nhau. Từ 0 đi sang phải 7 khoảng nhỏ, hoặc từ 2 đi sang phải thêm 1 khoảng nhỏ.",
      "visual": "number-line",
      "values": [
        0,
        3,
        3,
        2.3333333333333335
      ]
    },
    {
      "id": "math-number-line-7-example-read",
      "section": "example",
      "title": "Đọc số từ vị trí",
      "text": "Mỗi đơn vị chia thành 4 phần bằng nhau. A ở vạch thứ ba bên trái 0.\nMỗi khoảng nhỏ dài 1/4 đơn vị. Vì A nằm bên trái 0 nên A biểu diễn -3/4.",
      "visual": "number-line",
      "values": [
        -1,
        1,
        4,
        -0.75
      ]
    },
    {
      "id": "math-number-line-7-guided",
      "section": "guided",
      "title": "Em thử làm",
      "text": "Xác định mỗi khoảng nhỏ bằng bao nhiêu phần của đơn vị. Đếm khoảng từ 0, không đếm vạch 0 là khoảng thứ nhất. Chọn đúng chiều trước khi đánh dấu.",
      "visual": "none",
      "values": []
    }
  ],
  "exercises": [
    {
      "id": "math-number-line-7-q1",
      "section": "foundation",
      "kind": "choice",
      "prompt": "Điểm biểu diễn -2 nằm phía nào so với 0?",
      "answer": "Bên trái",
      "hint": "Số âm nằm bên trái 0.",
      "solution": "-2 < 0 nên điểm biểu diễn -2 ở bên trái 0.",
      "options": [
        "Bên trái",
        "Bên phải",
        "Tại 0"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "id": "math-number-line-7-q2",
      "section": "guided",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 5 phần bằng nhau. A ở vạch thứ ba bên phải 0. A biểu diễn số nào?",
      "answer": "3/5",
      "hint": "Mỗi khoảng nhỏ dài 1/5.",
      "solution": "A cách 0 ba khoảng về bên phải nên biểu diễn 3/5.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "id": "math-number-line-7-q3",
      "section": "practice",
      "kind": "fraction",
      "prompt": "Viết hỗn số 1 2/3 thành phân số để biểu diễn trên trục số.",
      "answer": "5/3",
      "hint": "Nhân phần nguyên với mẫu rồi cộng tử.",
      "solution": "1 2/3 = (1 × 3 + 2)/3 = 5/3.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "id": "math-number-line-7-q4",
      "section": "practice",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 4 phần. Từ -1 đi sang phải một khoảng nhỏ, em đến số nào?",
      "answer": "-3/4",
      "hint": "-1 = -4/4.",
      "solution": "-1 + 1/4 = -4/4 + 1/4 = -3/4.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "id": "math-number-line-7-q5",
      "section": "extra",
      "kind": "choice",
      "prompt": "Điểm biểu diễn -2 nằm phía nào so với 0?",
      "answer": "Bên trái",
      "hint": "Số âm nằm bên trái 0.",
      "solution": "-2 < 0 nên điểm biểu diễn -2 ở bên trái 0.",
      "options": [
        "Bên trái",
        "Bên phải",
        "Tại 0"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q6",
      "section": "extra",
      "kind": "number",
      "prompt": "Điểm gốc O biểu diễn số nào?",
      "answer": "0",
      "hint": "Gốc của trục số.",
      "solution": "Điểm O biểu diễn 0.",
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q7",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 4 phần bằng nhau. Mỗi khoảng nhỏ dài bao nhiêu đơn vị?",
      "answer": "1/4",
      "hint": "Lấy 1 chia số phần.",
      "solution": "Mỗi khoảng nhỏ dài 1/4 đơn vị.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q8",
      "section": "extra",
      "kind": "number",
      "prompt": "Từ 0 đi sang phải 3 đơn vị. Em đến số nào?",
      "answer": "3",
      "hint": "Chiều sang phải là chiều dương.",
      "solution": "0 + 3 = 3.",
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q9",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 5 phần bằng nhau. A ở vạch thứ ba bên phải 0. A biểu diễn số nào?",
      "answer": "3/5",
      "hint": "Mỗi khoảng nhỏ dài 1/5.",
      "solution": "A cách 0 ba khoảng về bên phải nên biểu diễn 3/5.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q10",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 4 phần bằng nhau. B ở vạch thứ ba bên trái 0. B biểu diễn số nào?",
      "answer": "-3/4",
      "hint": "Chú ý dấu âm.",
      "solution": "B ở bên trái 0, cách 0 ba khoảng 1/4 nên biểu diễn -3/4.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q11",
      "section": "extra",
      "kind": "number",
      "prompt": "Để biểu diễn 5/3 khi mỗi đơn vị chia thành 3 phần, từ 0 đi sang phải bao nhiêu khoảng nhỏ?",
      "answer": "5",
      "hint": "Tử cho số khoảng cần đếm.",
      "solution": "5/3 = 5 × (1/3), nên đi 5 khoảng nhỏ.",
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q12",
      "section": "extra",
      "kind": "number",
      "prompt": "Để biểu diễn -7/4 khi mỗi đơn vị chia thành 4 phần, từ 0 đi sang trái bao nhiêu khoảng nhỏ?",
      "answer": "7",
      "hint": "Đếm khoảng, không đếm vạch 0.",
      "solution": "-7/4 nằm cách 0 bảy khoảng nhỏ về bên trái.",
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q13",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Viết hỗn số 1 2/3 thành phân số để biểu diễn trên trục số.",
      "answer": "5/3",
      "hint": "Nhân phần nguyên với mẫu rồi cộng tử.",
      "solution": "1 2/3 = (1 × 3 + 2)/3 = 5/3.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q14",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Viết số đối của 2 1/4 thành phân số.",
      "answer": "-9/4",
      "hint": "Lấy số đối của cả hỗn số.",
      "solution": "-(2 1/4) = -(2 + 1/4) = -9/4.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q15",
      "section": "extra",
      "kind": "choice",
      "prompt": "Điểm biểu diễn 7/3 nằm giữa hai số nguyên liên tiếp nào?",
      "answer": "2 và 3",
      "hint": "7/3 = 2 1/3.",
      "solution": "2 = 6/3 < 7/3 < 9/3 = 3.",
      "options": [
        "1 và 2",
        "2 và 3",
        "3 và 4"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q16",
      "section": "extra",
      "kind": "choice",
      "prompt": "Điểm biểu diễn -5/4 nằm giữa hai số nguyên liên tiếp nào?",
      "answer": "-2 và -1",
      "hint": "So sánh với -8/4 và -4/4.",
      "solution": "-2 = -8/4 < -5/4 < -4/4 = -1.",
      "options": [
        "-2 và -1",
        "-1 và 0",
        "1 và 2"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q17",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 4 phần. Từ -1 đi sang phải một khoảng nhỏ, em đến số nào?",
      "answer": "-3/4",
      "hint": "-1 = -4/4.",
      "solution": "-1 + 1/4 = -4/4 + 1/4 = -3/4.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q18",
      "section": "extra",
      "kind": "fraction",
      "prompt": "Mỗi đơn vị chia thành 3 phần. Từ 1 đi sang trái hai khoảng nhỏ, em đến số nào?",
      "answer": "1/3",
      "hint": "1 = 3/3.",
      "solution": "1 − 2/3 = 3/3 − 2/3 = 1/3.",
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q19",
      "section": "extra",
      "kind": "choice",
      "prompt": "Số nào có cùng điểm biểu diễn với 1 1/2?",
      "answer": "6/4",
      "hint": "Rút gọn từng phân số.",
      "solution": "6/4 = 3/2 = 1 1/2.",
      "options": [
        "6/4",
        "2/3",
        "4/6"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q20",
      "section": "extra",
      "kind": "fraction",
      "prompt": "A biểu diễn -3/2. Điểm đối xứng với A qua 0 biểu diễn số nào?",
      "answer": "3/2",
      "hint": "Hai điểm đối xứng qua 0 biểu diễn hai số đối nhau.",
      "solution": "Số đối của -3/2 là 3/2.",
      "solutionNumberLine": {
        "min": -2, "max": 2, "divisions": 2,
        "points": [{ "value": "-3/2", "name": "A" }, { "value": "3/2", "name": "A′", "emphasis": true }],
        "caption": "A và A′ nằm ở hai phía của 0, cùng cách 0 một khoảng bằng 3/2 đơn vị."
      },
      "options": [],
      "unit": "",
      "simplified": true,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q21",
      "section": "extra",
      "kind": "choice",
      "prompt": "Trong các số -1; -3/4; 0; 1 1/2, số nào có điểm biểu diễn ngoài cùng bên trái?",
      "answer": "-1",
      "hint": "Số nhỏ nhất ở bên trái nhất.",
      "solution": "-1 < -3/4 < 0 < 1 1/2.",
      "solutionNumberLine": {
        "min": -2, "max": 2, "divisions": 4,
        "points": [{ "value": "-1", "emphasis": true }, { "value": "-3/4" }, { "value": "0" }, { "value": "1 1/2" }],
        "caption": "Điểm biểu diễn -1 nằm ngoài cùng bên trái trong các điểm đã cho."
      },
      "options": [
        "-1",
        "-3/4",
        "0",
        "1 1/2"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q22",
      "section": "extra",
      "kind": "choice",
      "prompt": "Trong các số 2; 7/4; 2 1/4; -1/2, số nào có điểm biểu diễn ngoài cùng bên phải?",
      "answer": "2 1/4",
      "hint": "Số lớn nhất ở bên phải nhất.",
      "solution": "-1/2 < 7/4 < 2 < 2 1/4.",
      "solutionNumberLine": {
        "min": -1, "max": 3, "divisions": 4,
        "points": [{ "value": "2" }, { "value": "7/4" }, { "value": "2 1/4", "emphasis": true }, { "value": "-1/2" }],
        "caption": "Điểm biểu diễn 2 1/4 nằm ngoài cùng bên phải trong các điểm đã cho."
      },
      "options": [
        "2",
        "7/4",
        "2 1/4",
        "-1/2"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q23",
      "section": "extra",
      "kind": "number",
      "prompt": "Chọn số phần bằng nhau ít nhất để chia mỗi đơn vị sao cho cả 1/2 và 2/3 đều nằm trên các vạch chia.",
      "answer": "6",
      "hint": "Tìm BCNN của 2 và 3.",
      "solution": "BCNN(2, 3) = 6. Khi đó 1/2 = 3/6 và 2/3 = 4/6.",
      "solutionNumberLine": {
        "min": 0, "max": 1, "divisions": 6,
        "points": [{ "value": "1/2" }, { "value": "2/3" }],
        "caption": "Đoạn từ 0 đến 1 chia thành 6 phần bằng nhau; hai điểm ở vạch thứ 3 và thứ 4."
      },
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "hard",
      "workspace": "medium"
    },
    {
      "id": "math-number-line-7-q24",
      "section": "extra",
      "kind": "written",
      "prompt": "Vẽ trục số và biểu diễn các số -3/2; -1; 0; 1/2; 1 1/2.",
      "answer": "-3/2 < -1 < 0 < 1/2 < 1 1/2",
      "hint": "Chia mỗi đơn vị thành hai phần bằng nhau.",
      "solution": "Chia mỗi đơn vị thành 2 phần. Từ 0: -3/2 ở 3 khoảng bên trái; -1 ở 2 khoảng bên trái; 1/2 ở 1 khoảng bên phải; 1 1/2 = 3/2 ở 3 khoảng bên phải. Thứ tự từ trái sang phải: -3/2 < -1 < 0 < 1/2 < 1 1/2.",
      "solutionNumberLine": {
        "min": -2, "max": 2, "divisions": 2,
        "points": [{ "value": "-3/2" }, { "value": "-1" }, { "value": "0" }, { "value": "1/2" }, { "value": "1 1/2" }],
        "caption": "Mỗi đoạn đơn vị được chia thành 2 phần bằng nhau."
      },
      "options": [],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "Biểu diễn số trên trục số",
      "difficulty": "hard",
      "workspace": "large",
      "criteria": [
        "Chọn gốc 0 và các đoạn đơn vị bằng nhau.",
        "Chia mỗi đơn vị thành hai phần bằng nhau.",
        "Đặt đủ năm điểm đúng vị trí và ghi số tương ứng."
      ]
    }
  ]
};

export function addNumberLineLesson(lessons: MathLessonData[]) {
  if (lessons.length >= 100 || lessons.some(l => l.id === numberLineLesson.id)) return lessons;
  return [...lessons, structuredClone(numberLineLesson)];
}

// Old saved copies receive the new illustrations at export time only when the
// exercise still matches its source. Never draw an old answer for an edited task.
export function withNumberLineSolution(exercise: MathExercise): MathExercise {
  if (exercise.solutionNumberLine !== undefined) return exercise;
  const source = numberLineLesson.exercises.find(item => item.id === exercise.id);
  if (!source?.solutionNumberLine || source.prompt !== exercise.prompt ||
    source.solution !== exercise.solution || source.answer !== exercise.answer ||
    source.kind !== exercise.kind || JSON.stringify(source.options) !== JSON.stringify(exercise.options)) return exercise;
  return { ...exercise, solutionNumberLine: structuredClone(source.solutionNumberLine) };
}
