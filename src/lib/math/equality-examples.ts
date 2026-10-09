import { equalityFractionNotation } from './equality-notation';
export type EqualityExample = {
  id: string;
  title: string;
  rows: {
    equation: string;
    explanation: string;
    highlight?: string;
    why?: string;
  }[];
  check: string;
};
const originalequalityExamples: EqualityExample[] = [
  {
    id: 'eq-example-plus',
    title: 'Ví dụ 1: chuyển số hạng dương',
    rows: [
      {
        equation: 'x + 4 = -3',
        explanation: 'Tìm x để hai vế bằng nhau.',
        highlight: '+ 4',
      },
      {
        equation: 'x = -3 - 4',
        explanation: 'Chuyển +4 sang vế phải thành -4.',
        highlight: '- 4',
        why: 'Trừ 4 ở cả hai vế: x + 4 - 4 = -3 - 4. Thu gọn vế trái còn x.',
      },
      { equation: 'x = -7', explanation: 'Tính -3 - 4.' },
    ],
    check: '-7 + 4 = -3. Hai vế bằng nhau.',
  },
  {
    id: 'eq-example-minus',
    title: 'Ví dụ 2: chuyển số hạng âm',
    rows: [
      {
        equation: 'x - 3 = -8',
        explanation: 'Tìm x để hai vế bằng nhau.',
        highlight: '- 3',
      },
      {
        equation: 'x = -8 + 3',
        explanation: 'Chuyển -3 sang vế phải thành +3.',
        highlight: '+ 3',
        why: 'Cộng 3 ở cả hai vế: x - 3 + 3 = -8 + 3. Thu gọn vế trái còn x.',
      },
      { equation: 'x = -5', explanation: 'Tính -8 + 3.' },
    ],
    check: '-5 - 3 = -8. Hai vế bằng nhau.',
  },
  {
    id: 'eq-example-fraction',
    title: 'Ví dụ 3: quy đồng sau khi chuyển vế',
    rows: [
      {
        equation: 'x + 1/2 = 5/6',
        explanation: 'Tìm x để hai vế bằng nhau.',
        highlight: '+ 1/2',
      },
      {
        equation: 'x = 5/6 - 1/2',
        explanation: 'Chuyển +1/2 sang vế phải thành -1/2.',
        highlight: '- 1/2',
        why: 'Trừ 1/2 ở cả hai vế: x + 1/2 - 1/2 = 5/6 - 1/2.',
      },
      { equation: 'x = 5/6 - 3/6', explanation: 'Quy đồng mẫu 6: 1/2 = 3/6.' },
      { equation: 'x = 2/6', explanation: 'Trừ hai tử, giữ nguyên mẫu.' },
      {
        equation: 'x = 1/3',
        explanation: 'Chia cả tử và mẫu cho 2 để rút gọn.',
      },
    ],
    check: '1/3 + 1/2 = 2/6 + 3/6 = 5/6. Hai vế bằng nhau.',
  },
  {
    id: 'eq-example-factor',
    title: 'Ví dụ 4: phân biệt số hạng và thừa số',
    rows: [
      {
        equation: '3x + 2 = 14',
        explanation: 'Trước hết, tìm giá trị của 3x.',
        highlight: '+ 2',
      },
      {
        equation: '3x = 14 - 2',
        explanation: 'Chuyển +2 sang vế phải thành -2.',
        highlight: '- 2',
        why: 'Trừ 2 ở cả hai vế: 3x + 2 - 2 = 14 - 2.',
      },
      { equation: '3x = 12', explanation: 'Tính 14 - 2.' },
      {
        equation: 'x = 12 : 3',
        explanation: '3 đang nhân với x. Chia cả hai vế cho 3.',
        why: '3x : 3 = 12 : 3. Thừa số 3 không chuyển thành số hạng -3.',
      },
      { equation: 'x = 4', explanation: 'Tính 12 : 3.' },
    ],
    check: '3 × 4 + 2 = 14. Hai vế bằng nhau.',
  },
  {
    id: 'eq-example-power',
    title: 'Ví dụ 5: tính lũy thừa rồi tìm x',
    rows: [
      {
        equation: 'x + 3^2 = 5',
        explanation: 'Tính lũy thừa trước khi chuyển vế.',
      },
      {
        equation: 'x + 9 = 5',
        explanation: '3^2 = 3 × 3 = 9.',
        highlight: '+ 9',
      },
      {
        equation: 'x = 5 - 9',
        explanation: 'Chuyển +9 sang vế phải thành -9.',
        highlight: '- 9',
        why: 'Trừ 9 ở cả hai vế: x + 9 - 9 = 5 - 9.',
      },
      { equation: 'x = -4', explanation: 'Tính 5 - 9.' },
    ],
    check: '-4 + 3^2 = -4 + 9 = 5. Hai vế bằng nhau.',
  },
  {
    id: 'eq-example-power-product',
    title: 'Ví dụ 6: nhân lũy thừa cùng cơ số',
    rows: [
      {
        equation: '2^x × 2^3 = 2^7 (x ∈ ℕ)',
        explanation: 'Tìm số mũ x bằng cách gộp hai lũy thừa cùng cơ số.',
      },
      {
        equation: '2^(x + 3) = 2^7',
        explanation: 'Giữ cơ số 2, cộng hai số mũ x và 3.',
        why: 'Nhân hai lũy thừa cùng cơ số: a^m × a^n = a^(m + n).',
      },
      {
        equation: 'x + 3 = 7',
        explanation: 'Hai lũy thừa cơ số 2 bằng nhau nên số mũ bằng nhau.',
        highlight: '+ 3',
      },
      {
        equation: 'x = 7 - 3',
        explanation: 'Chuyển +3 sang vế phải thành -3.',
        highlight: '- 3',
        why: 'Trừ 3 ở cả hai vế: x + 3 - 3 = 7 - 3.',
      },
      { equation: 'x = 4', explanation: 'Tính 7 - 3. Giá trị 4 thuộc ℕ.' },
    ],
    check: '2^4 × 2^3 = 2^(4 + 3) = 2^7. Hai vế bằng nhau; 4 ∈ ℕ.',
  },
  {
    id: 'eq-example-power-quotient',
    title: 'Ví dụ 7: chia lũy thừa cùng cơ số',
    rows: [
      {
        equation: '2^x : 2^3 = 2^4 (x ∈ ℕ, x ≥ 3)',
        explanation: 'Tìm số mũ x bằng cách gộp hai lũy thừa cùng cơ số.',
      },
      {
        equation: '2^(x - 3) = 2^4',
        explanation:
          'Giữ cơ số 2, lấy số mũ của số bị chia trừ số mũ của số chia.',
        why: 'Với a ≠ 0 và m ≥ n là các số tự nhiên: a^m : a^n = a^(m - n).',
      },
      {
        equation: 'x - 3 = 4',
        explanation: 'Hai lũy thừa cơ số 2 bằng nhau nên số mũ bằng nhau.',
        highlight: '- 3',
      },
      {
        equation: 'x = 4 + 3',
        explanation: 'Chuyển -3 sang vế phải thành +3.',
        highlight: '+ 3',
        why: 'Cộng 3 ở cả hai vế: x - 3 + 3 = 4 + 3.',
      },
      {
        equation: 'x = 7',
        explanation: 'Tính 4 + 3. Giá trị 7 thuộc ℕ và 7 ≥ 3.',
      },
    ],
    check: '2^7 : 2^3 = 2^(7 - 3) = 2^4. Hai vế bằng nhau; 7 ∈ ℕ và 7 ≥ 3.',
  },
  {
    id: 'eq-example-subtrahend',
    title: 'Ví dụ 8: tìm x khi đứng sau dấu trừ',
    rows: [
      {
        equation: '5 - x = 8',
        explanation: 'Tìm số bị trừ đi, chú ý dấu âm trước x.',
      },
      {
        equation: '-x = 8 - 5',
        explanation: 'Chuyển +5 sang vế phải thành -5.',
      },
      {
        equation: '-x = 3',
        explanation: 'Tính 8 - 5.',
      },
      {
        equation: 'x = -3',
        explanation: 'Nhân cả hai vế với -1.',
      },
    ],
    check: '5 - (-3) = 5 + 3 = 8.',
  },
  {
    id: 'eq-example-negative-factor',
    title: 'Ví dụ 9: chia cho hệ số âm',
    rows: [
      {
        equation: '-2x = 6',
        explanation: 'Hệ số của x là -2.',
      },
      {
        equation: 'x = 6 : (-2)',
        explanation: 'Chia cả hai vế cho -2, không chuyển -2 thành +2.',
      },
      {
        equation: 'x = -3',
        explanation: 'Số dương chia số âm cho kết quả âm.',
      },
    ],
    check: '(-2) × (-3) = 6.',
  },
  {
    id: 'eq-example-minus-brackets',
    title: 'Ví dụ 10: dấu trừ trước ngoặc',
    rows: [
      {
        equation: '10 - (x + 2) = 3',
        explanation: 'Chú ý dấu trừ đứng trước cả ngoặc.',
      },
      {
        equation: '10 - x - 2 = 3',
        explanation: 'Đổi dấu cả hai số hạng trong ngoặc.',
      },
      {
        equation: '8 - x = 3',
        explanation: 'Thu gọn 10 - 2 = 8.',
      },
      {
        equation: '-x = 3 - 8',
        explanation: 'Chuyển +8 sang vế phải thành -8.',
      },
      {
        equation: '-x = -5',
        explanation: 'Tính 3 - 8.',
      },
      {
        equation: 'x = 5',
        explanation: 'Nhân cả hai vế với -1.',
      },
    ],
    check: '10 - (5 + 2) = 10 - 7 = 3.',
  },
];

export const equalityExamples = originalequalityExamples.map((example) => ({
  ...example,
  rows: example.rows.map((row) => ({
    ...row,
    equation: equalityFractionNotation(row.equation),
    explanation: equalityFractionNotation(row.explanation),
    ...(row.why ? { why: equalityFractionNotation(row.why) } : {}),
  })),
}));
