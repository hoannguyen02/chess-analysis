import type { MathLessonData } from './lessons';

export const midpointLesson: MathLessonData = {
  "id": "math-midpoint-3",
  "title": "Điểm ở giữa, trung điểm của đoạn thẳng",
  "grade": 3,
  "semester": "1",
  "topic": "Hình học",
  "goal": "Nhận biết ba điểm thẳng hàng, điểm ở giữa và trung điểm; xác định trung điểm và tính độ dài đơn giản.",
  "textbook": "Bài tự biên soạn, tham khảo Toán 3 Kết nối tri thức, tập 1, Bài 16.",
  "teacherNotes": "Tham khảo: https://olm.vn/chu-de/diem-o-giua-trung-diem-cua-doan-thang-2061561479. Nhấn mạnh hai điều kiện của trung điểm. Hình minh họa trên màn hình và PDF không dùng để đo trực tiếp; sử dụng số đo ghi trong đề. Các bài tính dùng cm.",
  "knowledgeSummary": "Ba điểm cùng nằm trên một đường thẳng là ba điểm thẳng hàng.\nM ở giữa A và B khi A, M, B thẳng hàng theo thứ tự A – M – B (hoặc B – M – A).\nM là trung điểm của AB khi M ở giữa A, B và AM = MB.\nKhi M là trung điểm: độ dài AM và MB đều bằng độ dài AB chia cho 2; độ dài AB bằng độ dài AM nhân với 2.\nVí dụ: AB = 8 cm, M là trung điểm thì AM = MB = 4 cm.\nLưu ý: Điểm ở giữa chưa chắc là trung điểm. Cách đều hai đầu nhưng không ở giữa cũng không phải trung điểm. Dùng số đo của đề, không đo hình minh họa.",
  "blocks": [
    {
      "id": "midpoint-b1",
      "section": "foundation",
      "title": "Ba điểm thẳng hàng",
      "text": "Ba điểm cùng nằm trên một đường thẳng là ba điểm thẳng hàng. Trên hình, A, M, B thẳng hàng theo thứ tự từ trái sang phải.",
      "visual": "segment",
      "values": [
        2,
        4,
        0,
        0
      ]
    },
    {
      "id": "midpoint-b2",
      "section": "explore",
      "title": "Điểm ở giữa",
      "text": "Trên hình, A, M, B thẳng hàng và M nằm giữa hai điểm A, B. Ta nói M là điểm ở giữa A và B.\nĐiểm ở giữa không nhất thiết chia đoạn thẳng thành hai phần bằng nhau.",
      "visual": "segment",
      "values": [
        2,
        4,
        0,
        1
      ]
    },
    {
      "id": "midpoint-b3",
      "section": "explore",
      "title": "Trung điểm của đoạn thẳng",
      "text": "M ở giữa A và B; AM = MB = 3 cm. Khi đó M là trung điểm của đoạn thẳng AB.\nĐể xác định trung điểm, cần kiểm tra cả hai điều kiện: điểm đó ở giữa hai đầu đoạn thẳng và hai đoạn tạo thành dài bằng nhau.",
      "visual": "segment",
      "values": [
        3,
        3,
        0,
        1
      ]
    },
    {
      "id": "midpoint-b4",
      "section": "explore",
      "title": "Ở giữa nhưng không phải trung điểm",
      "text": "M ở giữa A và B, nhưng AM = 2 cm, MB = 4 cm. Vì AM không bằng MB nên M không phải là trung điểm của AB.",
      "visual": "segment",
      "values": [
        2,
        4,
        0,
        1
      ]
    },
    {
      "id": "midpoint-b5",
      "section": "explore",
      "title": "Không thẳng hàng thì không ở giữa",
      "text": "Ở hình này, M không nằm trên đường thẳng AB. Vì vậy M không ở giữa A và B và không là trung điểm của AB, dù có thể cách đều A và B.",
      "visual": "segment",
      "values": [
        3,
        3,
        1,
        0
      ]
    },
    {
      "id": "midpoint-b6",
      "section": "example",
      "title": "1. Xác định trung điểm",
      "text": "M ở giữa A và B. Trên hình có AM = 4 cm và MB = 4 cm.\nHai đoạn AM, MB bằng nhau, nên M là trung điểm của AB.",
      "visual": "segment",
      "values": [
        4,
        4,
        0,
        1
      ]
    },
    {
      "id": "midpoint-b7",
      "section": "example",
      "title": "2. Tính độ dài mỗi nửa",
      "text": "AB dài 8 cm, M là trung điểm của AB.\nĐộ dài đoạn AM là:\n8 : 2 = 4 (cm).\nVậy AM = MB = 4 cm.",
      "visual": "none",
      "values": []
    },
    {
      "id": "midpoint-b8",
      "section": "example",
      "title": "3. Tính độ dài cả đoạn",
      "text": "M là trung điểm của AB, AM = 3 cm.\nMB = AM = 3 cm.\nĐộ dài đoạn AB là:\n3 + 3 = 6 (cm).\nĐáp số: 6 cm.",
      "visual": "segment",
      "values": [
        3,
        3,
        0,
        1
      ]
    },
    {
      "id": "midpoint-b9",
      "section": "example",
      "title": "4. Cách xác định trung điểm bằng thước",
      "text": "Đoạn AB dài 6 cm. Tính 6 : 2 = 3 cm. Đặt thước dọc theo AB, vạch 0 trùng A; đánh dấu M tại vạch 3 cm. Kiểm tra M ở giữa A, B và AM = MB = 3 cm.\nCó thể gấp một băng giấy sao cho hai đầu trùng nhau; nếp gấp xác định điểm chia băng thành hai phần bằng nhau.",
      "visual": "none",
      "values": []
    },
    {
      "id": "midpoint-b10",
      "section": "guided",
      "title": "Em thử làm",
      "text": "AB dài 10 cm, M là trung điểm của AB. Hai đoạn AM và MB bằng nhau. Hãy tìm độ dài AM.",
      "visual": "none",
      "values": []
    }
  ],
  "exercises": [
    {
      "id": "midpoint-e1",
      "section": "foundation",
      "kind": "choice",
      "prompt": "Quan sát hình. Điểm nào ở giữa hai điểm còn lại?",
      "answer": "M",
      "hint": "Xét thứ tự ba điểm trên đoạn thẳng.",
      "solution": "A, M, B thẳng hàng theo thứ tự đó nên M ở giữa A và B.",
      "options": [
        "A",
        "M",
        "B"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "segment": [
        2,
        4,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e2",
      "section": "guided",
      "kind": "number",
      "prompt": "AB dài 10 cm, M là trung điểm của AB. Đoạn AM dài bao nhiêu xăng-ti-mét?",
      "answer": "5",
      "hint": "Chia độ dài AB cho 2.",
      "solution": "Bài giải:\nĐộ dài đoạn AM là:\n10 : 2 = 5 (cm).\nĐáp số: 5 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": []
    },
    {
      "id": "midpoint-e3",
      "section": "practice",
      "kind": "choice",
      "prompt": "Quan sát hình. M có là trung điểm của AB không?",
      "answer": "Có",
      "hint": "Kiểm tra điểm ở giữa và hai độ dài.",
      "solution": "M ở giữa A, B và AM = MB = 4 cm nên M là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "segment": [
        4,
        4,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e4",
      "section": "practice",
      "kind": "choice",
      "prompt": "Quan sát hình. M có là trung điểm của AB không?",
      "answer": "Không",
      "hint": "So sánh AM và MB.",
      "solution": "M ở giữa A, B nhưng AM = 2 cm khác MB = 5 cm nên M không là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "segment": [
        2,
        5,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e5",
      "section": "extra",
      "kind": "choice",
      "prompt": "Điểm nào ở giữa A và B trong hình?",
      "answer": "M",
      "hint": "Nhớ điều kiện điểm ở giữa và trung điểm.",
      "solution": "M ở giữa A và B.",
      "options": [
        "A",
        "M",
        "B"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        2,
        5,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e6",
      "section": "extra",
      "kind": "choice",
      "prompt": "Ba điểm A, M, B trong hình có thẳng hàng không?",
      "answer": "Có",
      "hint": "Nhớ điều kiện điểm ở giữa và trung điểm.",
      "solution": "A, M, B cùng nằm trên một đường thẳng.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        5,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e7",
      "section": "extra",
      "kind": "choice",
      "prompt": "Điểm M trong hình có ở giữa A và B không?",
      "answer": "Không",
      "hint": "Nhớ điều kiện điểm ở giữa và trung điểm.",
      "solution": "M không nằm trên đường thẳng AB nên không ở giữa A và B.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        3,
        1,
        0
      ]
    },
    {
      "id": "midpoint-e8",
      "section": "extra",
      "kind": "choice",
      "prompt": "M là trung điểm của AB khi nào?",
      "answer": "M ở giữa A, B và AM = MB",
      "hint": "Nhớ điều kiện điểm ở giữa và trung điểm.",
      "solution": "Phải có cả hai điều kiện: M ở giữa A, B và AM = MB.",
      "options": [
        "M ở giữa A, B và AM = MB",
        "Chỉ cần M ở giữa A và B",
        "Chỉ cần AM = MB"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "foundation",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e9",
      "section": "extra",
      "kind": "choice",
      "prompt": "Quan sát hình. M có phải là trung điểm của AB không?",
      "answer": "Có",
      "hint": "M đã ở giữa A và B; hãy so sánh hai đoạn.",
      "solution": "M ở giữa A và B; AM = 2 cm, MB = 2 cm. Hai đoạn bằng nhau nên M là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        2,
        2,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e10",
      "section": "extra",
      "kind": "choice",
      "prompt": "Quan sát hình. M có phải là trung điểm của AB không?",
      "answer": "Không",
      "hint": "M đã ở giữa A và B; hãy so sánh hai đoạn.",
      "solution": "M ở giữa A và B; AM = 2 cm, MB = 4 cm. Hai đoạn không bằng nhau nên M không là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        2,
        4,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e11",
      "section": "extra",
      "kind": "choice",
      "prompt": "Quan sát hình. M có phải là trung điểm của AB không?",
      "answer": "Có",
      "hint": "M đã ở giữa A và B; hãy so sánh hai đoạn.",
      "solution": "M ở giữa A và B; AM = 5 cm, MB = 5 cm. Hai đoạn bằng nhau nên M là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        5,
        5,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e12",
      "section": "extra",
      "kind": "choice",
      "prompt": "Quan sát hình. M có phải là trung điểm của AB không?",
      "answer": "Không",
      "hint": "M đã ở giữa A và B; hãy so sánh hai đoạn.",
      "solution": "M ở giữa A và B; AM = 3 cm, MB = 6 cm. Hai đoạn không bằng nhau nên M không là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        6,
        0,
        1
      ]
    },
    {
      "id": "midpoint-e13",
      "section": "extra",
      "kind": "number",
      "prompt": "M là trung điểm của AB, AB = 6 cm. Đoạn MB dài bao nhiêu xăng-ti-mét?",
      "answer": "3",
      "hint": "Lấy độ dài AB chia cho 2.",
      "solution": "Bài giải:\nĐộ dài đoạn MB là:\n6 : 2 = 3 (cm).\nĐáp số: 3 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        3,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e14",
      "section": "extra",
      "kind": "number",
      "prompt": "M là trung điểm của AB, AB = 12 cm. Đoạn MB dài bao nhiêu xăng-ti-mét?",
      "answer": "6",
      "hint": "Lấy độ dài AB chia cho 2.",
      "solution": "Bài giải:\nĐộ dài đoạn MB là:\n12 : 2 = 6 (cm).\nĐáp số: 6 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        3,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e15",
      "section": "extra",
      "kind": "number",
      "prompt": "M là trung điểm của AB, AM = 4 cm. Đoạn AB dài bao nhiêu xăng-ti-mét?",
      "answer": "8",
      "hint": "AB gồm hai đoạn bằng AM.",
      "solution": "Bài giải:\nĐộ dài đoạn AB là:\n4 × 2 = 8 (cm).\nĐáp số: 8 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        3,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e16",
      "section": "extra",
      "kind": "number",
      "prompt": "M là trung điểm của AB, AM = 7 cm. Đoạn AB dài bao nhiêu xăng-ti-mét?",
      "answer": "14",
      "hint": "AB gồm hai đoạn bằng AM.",
      "solution": "Bài giải:\nĐộ dài đoạn AB là:\n7 × 2 = 14 (cm).\nĐáp số: 14 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "skills",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "easy",
      "workspace": "medium",
      "segment": [
        3,
        3,
        0,
        0
      ]
    },
    {
      "id": "midpoint-e17",
      "section": "extra",
      "kind": "number",
      "prompt": "Một băng giấy thẳng dài 16 cm. Lan đánh dấu điểm ở chính giữa để chia băng giấy thành hai phần bằng nhau. Mỗi phần dài bao nhiêu xăng-ti-mét?",
      "answer": "8",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nMỗi phần băng giấy dài là:\n16 : 2 = 8 (cm).\nĐáp số: 8 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e18",
      "section": "extra",
      "kind": "number",
      "prompt": "Một đoạn dây thẳng dài 18 cm. Nam đánh dấu trung điểm của đoạn dây. Khoảng cách từ dấu đó đến mỗi đầu dây là bao nhiêu xăng-ti-mét?",
      "answer": "9",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nKhoảng cách từ dấu đến mỗi đầu dây là:\n18 : 2 = 9 (cm).\nĐáp số: 9 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e19",
      "section": "extra",
      "kind": "number",
      "prompt": "Hai đầu A và B của một thanh gỗ thẳng cách nhau 20 cm. M là trung điểm của AB. Đoạn AM dài bao nhiêu xăng-ti-mét?",
      "answer": "10",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nĐộ dài đoạn AM là:\n20 : 2 = 10 (cm).\nĐáp số: 10 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e20",
      "section": "extra",
      "kind": "number",
      "prompt": "Trên một băng giấy thẳng, M là trung điểm của đoạn AB. Từ A đến M dài 6 cm. Đoạn AB dài bao nhiêu xăng-ti-mét?",
      "answer": "12",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nĐộ dài đoạn AB là:\n6 × 2 = 12 (cm).\nĐáp số: 12 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e21",
      "section": "extra",
      "kind": "number",
      "prompt": "Một sợi dây được căng thẳng từ A đến B. M là trung điểm của AB và MB = 9 cm. Sợi dây AB dài bao nhiêu xăng-ti-mét?",
      "answer": "18",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nSợi dây AB dài là:\n9 × 2 = 18 (cm).\nĐáp số: 18 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e22",
      "section": "extra",
      "kind": "number",
      "prompt": "Trên một cạnh thẳng AB của tấm bìa, M là trung điểm và AM = 5 cm. Đoạn MB dài bao nhiêu xăng-ti-mét?",
      "answer": "5",
      "hint": "Trung điểm chia đoạn thẳng thành hai phần bằng nhau.",
      "solution": "Bài giải:\nMB = AM = 5 cm.\nĐáp số: 5 cm.",
      "options": [],
      "unit": "cm",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "application",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium"
    },
    {
      "id": "midpoint-e23",
      "section": "extra",
      "kind": "choice",
      "prompt": "M cách đều A và B nhưng không nằm trên đường thẳng AB. M có phải là trung điểm của AB không?",
      "answer": "Không",
      "hint": "Cần kiểm tra cả điều kiện ở giữa.",
      "solution": "M không ở giữa A và B nên không là trung điểm của AB, dù MA = MB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium",
      "segment": [
        3,
        3,
        1,
        0
      ]
    },
    {
      "id": "midpoint-e24",
      "section": "extra",
      "kind": "choice",
      "prompt": "M ở giữa A và B. AM = 3 cm và AB = 8 cm. M có phải là trung điểm của AB không?",
      "answer": "Không",
      "hint": "Tính MB = AB − AM rồi so sánh với AM.",
      "solution": "MB = 8 − 3 = 5 (cm). AM = 3 cm khác MB = 5 cm nên M không là trung điểm của AB.",
      "options": [
        "Có",
        "Không"
      ],
      "unit": "",
      "simplified": false,
      "tolerance": 0,
      "mistakes": [],
      "group": "challenge",
      "skill": "Điểm ở giữa và trung điểm",
      "difficulty": "medium",
      "workspace": "medium",
      "segment": [
        3,
        5,
        0,
        0
      ]
    }
  ]
};

export function addMidpointLesson(lessons: MathLessonData[]): MathLessonData[] {
 if (lessons.length >= 100 || lessons.some(l => l.id === midpointLesson.id)) return lessons;
 return [...lessons, structuredClone(midpointLesson)];
}
