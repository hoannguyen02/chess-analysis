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
export const equalityExamples: EqualityExample[] = [
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
];
