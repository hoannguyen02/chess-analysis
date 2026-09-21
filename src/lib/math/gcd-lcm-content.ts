import { MathBlock, MathExercise } from './lessons';

const block = (id: string, section: MathBlock['section'], title: string, text: string): MathBlock =>
  ({ id: `n-common-${id}`, section, title, text, visual: 'none', values: [] });

export const commonFactorBlocks: MathBlock[] = [
  block('factor', 'explore', 'Phân tích ra thừa số nguyên tố',
    'Phân tích một số tự nhiên lớn hơn 1 ra thừa số nguyên tố là viết số đó thành tích các thừa số nguyên tố. Có thể chia liên tiếp cho các số nguyên tố, bắt đầu từ số nhỏ nhất, đến khi thương bằng 1.\nVí dụ: 60 : 2 = 30; 30 : 2 = 15; 15 : 3 = 5; 5 : 5 = 1.\n60 = 2 × 2 × 3 × 5 = 2² × 3 × 5.'),
  block('gcd', 'explore', 'Ước chung và ước chung lớn nhất (ƯCLN)',
    'Với các số tự nhiên khác 0, ước chung là số mà tất cả các số đã cho đều chia hết cho nó. ƯCLN là số lớn nhất trong các ước chung.\nƯ(12) = {1; 2; 3; 4; 6; 12}.\nƯ(18) = {1; 2; 3; 6; 9; 18}.\nƯC(12, 18) = {1; 2; 3; 6}; ƯCLN(12, 18) = 6.\nƯC là một tập hợp; ƯCLN là một số. Các ước chung chính là các ước của ƯCLN.'),
  block('lcm', 'explore', 'Bội chung và bội chung nhỏ nhất (BCNN)',
    'Bội chung của các số tự nhiên khác 0 là số chia hết cho tất cả các số đó. BCNN là bội chung nhỏ nhất khác 0.\nB(4) = {0; 4; 8; 12; 16; 20; 24; ...}.\nB(6) = {0; 6; 12; 18; 24; ...}.\nBC(4, 6) = {0; 12; 24; 36; ...}; BCNN(4, 6) = 12.\nSố 0 là bội chung nhưng không phải BCNN. Các bội chung chính là các bội của BCNN.'),
  block('method', 'explore', 'Tìm ƯCLN và BCNN bằng thừa số nguyên tố',
    'Với hai hay nhiều số lớn hơn 1, trước hết phân tích mỗi số ra thừa số nguyên tố.\nTìm ƯCLN: chọn các thừa số nguyên tố chung; lấy mỗi thừa số với số mũ nhỏ nhất rồi nhân lại. Không có thừa số nguyên tố chung thì ƯCLN bằng 1.\nTìm BCNN: chọn các thừa số nguyên tố chung và riêng; lấy mỗi thừa số với số mũ lớn nhất rồi nhân lại.\nHai số có ƯCLN bằng 1 gọi là hai số nguyên tố cùng nhau, khi đó BCNN bằng tích hai số. Ví dụ: ƯCLN(8, 15) = 1; BCNN(8, 15) = 120.\nNếu a chia hết cho b (a, b khác 0) thì ƯCLN(a, b) = b và BCNN(a, b) = a. Đặc biệt: ƯCLN(a, 1) = 1; BCNN(a, 1) = a.'),
  block('example-gcd', 'example', '4. Tìm ƯCLN rồi tìm các ước chung',
    'Tìm ƯCLN và ƯC của 24 và 36.\n24 = 2³ × 3; 36 = 2² × 3².\nCác thừa số nguyên tố chung là 2 và 3. Số mũ nhỏ nhất của 2 là 2, của 3 là 1.\nƯCLN(24, 36) = 2² × 3 = 12.\nƯC(24, 36) = Ư(12) = {1; 2; 3; 4; 6; 12}.'),
  block('example-lcm', 'example', '5. Tìm BCNN rồi tìm các bội chung',
    'Tìm BCNN của 12 và 20, rồi tìm các bội chung nhỏ hơn 150.\n12 = 2² × 3; 20 = 2² × 5.\nChọn các thừa số 2, 3, 5 với số mũ lớn nhất.\nBCNN(12, 20) = 2² × 3 × 5 = 60.\nBC(12, 20) = {0; 60; 120; 180; ...}.\nCác bội chung nhỏ hơn 150 là 0, 60, 120.'),
  block('example-sharing', 'example', '6. Chia đều thành nhiều phần nhất',
    'Có 24 quyển vở và 36 chiếc bút, chia hết thành các phần quà sao cho mỗi phần có số vở như nhau và số bút như nhau. Chia được nhiều nhất bao nhiêu phần?\nSố phần là ước chung của 24 và 36.\nSố phần nhiều nhất là ƯCLN(24, 36) = 12 (phần).\nMỗi phần có: 24 : 12 = 2 (quyển vở); 36 : 12 = 3 (chiếc bút).'),
  block('example-repeat', 'example', '7. Tìm lần tiếp theo cùng xảy ra',
    'Hai đèn cùng nháy lúc đầu. Một đèn nháy sau mỗi 6 giây, đèn kia sau mỗi 8 giây. Sau ít nhất bao nhiêu giây hai đèn lại cùng nháy?\nThời gian cần tìm là bội chung khác 0 nhỏ nhất của 6 và 8.\n6 = 2 × 3; 8 = 2³.\nBCNN(6, 8) = 2³ × 3 = 24.\nĐáp số: 24 giây.'),
];

type Row = [string, string, string, string, string[]?];
const rows: Row[] = [
  ['ƯC(8, 12) là tập hợp nào?', '{1; 2; 4}', 'Liệt kê các ước của từng số.', 'Ư(8) = {1; 2; 4; 8}; Ư(12) = {1; 2; 3; 4; 6; 12}.\nƯC(8, 12) = {1; 2; 4}.', ['{1; 2; 4}', '{0; 4; 8}', '{4}']],
  ['BCNN(3, 5) bằng bao nhiêu?', '15', 'Chọn bội chung nhỏ nhất khác 0.', 'BC(3, 5) = {0; 15; 30; ...}. BCNN(3, 5) = 15.', ['0', '1', '15', '30']],
  ['Tìm ƯCLN(18, 30).', '6', 'Chọn thừa số chung với số mũ nhỏ nhất.', '18 = 2 × 3²; 30 = 2 × 3 × 5.\nƯCLN(18, 30) = 2 × 3 = 6.'],
  ['Tìm BCNN(18, 30).', '90', 'Chọn cả thừa số chung và riêng.', '18 = 2 × 3²; 30 = 2 × 3 × 5.\nBCNN(18, 30) = 2 × 3² × 5 = 90.'],
  ['Tìm ƯCLN(8, 15).', '1', 'Hai số có thừa số nguyên tố chung không?', '8 = 2³; 15 = 3 × 5. Không có thừa số nguyên tố chung nên ƯCLN(8, 15) = 1.'],
  ['Tìm BCNN(6, 24).', '24', '24 có chia hết cho 6 không?', '24 chia hết cho 6 nên BCNN(6, 24) = 24.'],
  ['Tìm ƯCLN(24, 36, 60).', '12', 'Chọn thừa số chung của cả ba số.', '24 = 2³ × 3; 36 = 2² × 3²; 60 = 2² × 3 × 5.\nƯCLN(24, 36, 60) = 2² × 3 = 12.'],
  ['Tìm BCNN(4, 6, 10).', '60', 'Chọn các thừa số 2, 3, 5.', '4 = 2²; 6 = 2 × 3; 10 = 2 × 5.\nBCNN(4, 6, 10) = 2² × 3 × 5 = 60.'],
  ['Có 30 quả cam và 42 quả táo, chia hết vào các túi sao cho số cam ở mỗi túi bằng nhau và số táo ở mỗi túi bằng nhau. Chia được nhiều nhất bao nhiêu túi?', '6', 'Số túi là ước chung của 30 và 42.', '30 = 2 × 3 × 5; 42 = 2 × 3 × 7.\nSố túi nhiều nhất là:\nƯCLN(30, 42) = 2 × 3 = 6 (túi).\nĐáp số: 6 túi.'],
  ['Hai xe buýt cùng rời bến lúc 7 giờ. Một tuyến cứ 12 phút có một xe rời bến, tuyến kia cứ 18 phút có một xe rời bến. Sau ít nhất bao nhiêu phút hai tuyến lại có xe cùng rời bến?', '36', 'Tìm bội chung nhỏ nhất khác 0 của hai khoảng thời gian.', '12 = 2² × 3; 18 = 2 × 3².\nThời gian ít nhất là:\nBCNN(12, 18) = 2² × 3² = 36 (phút).\nĐáp số: 36 phút.'],
  ['Tìm x ∈ ℕ lớn nhất biết 48 và 72 đều chia hết cho x.', '24', 'x là ước chung lớn nhất.', '48 = 2⁴ × 3; 72 = 2³ × 3².\nx = ƯCLN(48, 72) = 2³ × 3 = 24.'],
  ['Tìm x ∈ ℕ, biết x chia hết cho cả 8 và 12 và 40 < x < 60.', '48', 'Liệt kê các bội của BCNN(8, 12).', '8 = 2³; 12 = 2² × 3.\nBCNN(8, 12) = 2³ × 3 = 24.\nBC(8, 12) = {0; 24; 48; 72; ...}.\nVì 40 < x < 60 nên x = 48.'],
];
const makeExercise = (row: Row, id: string, section: MathExercise['section'], group?: MathExercise['group']): MathExercise => ({
  id, section, prompt: row[0], answer: row[1], hint: row[2], solution: row[3], options: row[4] ?? [],
  kind: row[4] ? 'choice' : 'number', unit: '', simplified: false, tolerance: 0, mistakes: [],
  ...(group ? { group, skill: 'ƯCLN và BCNN', difficulty: group === 'challenge' ? 'hard' : group === 'foundation' ? 'easy' : 'medium', workspace: 'medium' } as const : {}),
});
export const commonFactorExercises: MathExercise[] = [
  makeExercise(['Tìm ƯCLN(12, 18).', '6', 'Liệt kê các ước chung.', 'ƯC(12, 18) = {1; 2; 3; 6}. ƯCLN(12, 18) = 6.'], 'n-common-guided-gcd', 'guided'),
  makeExercise(['Tìm BCNN(4, 6).', '12', 'Không chọn bội chung 0.', 'BC(4, 6) = {0; 12; 24; ...}. BCNN(4, 6) = 12.'], 'n-common-guided-lcm', 'guided'),
  makeExercise(['Tìm ƯCLN(20, 28).', '4', 'Phân tích ra thừa số nguyên tố.', '20 = 2² × 5; 28 = 2² × 7.\nƯCLN(20, 28) = 2² = 4.'], 'n-common-test-gcd', 'practice'),
  makeExercise(['Tìm BCNN(9, 12).', '36', 'Chọn thừa số chung và riêng với số mũ lớn nhất.', '9 = 3²; 12 = 2² × 3.\nBCNN(9, 12) = 2² × 3² = 36.'], 'n-common-test-lcm', 'practice'),
  ...rows.map((row, i) => makeExercise(row, `n-common-extra-${i + 1}`, 'extra', i < 2 ? 'foundation' : i < 8 ? 'skills' : i < 10 ? 'application' : 'challenge')),
];
