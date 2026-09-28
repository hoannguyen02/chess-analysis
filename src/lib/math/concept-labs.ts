export type ConceptLabKind =
  | 'missing-parts'
  | 'equal-groups'
  | 'measurement'
  | 'midpoint'
  | 'rational';

export const PART_ROUNDS = [
  {
    whole: 39,
    known: 15,
    unknown: 'part',
    expression: '□ + 15 = 39',
    choices: [24, 54, 15],
  },
  {
    whole: 39,
    known: 15,
    unknown: 'whole',
    expression: '□ − 15 = 24',
    choices: [9, 39, 24],
  },
  {
    whole: 39,
    known: 24,
    unknown: 'part',
    expression: '39 − □ = 24',
    choices: [63, 24, 15],
  },
] as const;
export const GROUP_ROUNDS = [
  { total: 24, groups: 4, size: 6, unknown: 'size', choices: [4, 6, 8] },
  { total: 24, groups: 4, size: 6, unknown: 'groups', choices: [6, 3, 4] },
  { total: 20, groups: 5, size: 4, unknown: 'total', choices: [9, 20, 25] },
] as const;
export const MIDPOINT_ROUNDS = [
  { length: 8, initial: 2, lifted: false },
  { length: 10, initial: 3, lifted: false },
  { length: 6, initial: 3, lifted: true },
] as const;
export const RATIONAL_ROUNDS = [
  {
    prompt: 'Chọn một cách viết khác của 1/2.',
    choices: ['2/4', '1/4', '2/3'],
    values: [0.5, 0.25, 2 / 3],
    answer: '2/4',
    reference: 0.5,
    referenceText: '1/2',
    referenceLabel: 'Số đã cho',
    selectedLabel: 'Em chọn',
    success: '1/2 = 2/4. Hai cách viết cùng chỉ một vị trí trên trục số.',
    hint: 'Nhân cả tử và mẫu của 1/2 với cùng một số. Điểm em chọn có trùng với điểm 1/2 không?',
  },
  {
    prompt: 'Chọn số lớn hơn: -2/3 hay -3/4?',
    choices: ['-2/3', '-3/4'],
    values: [-2 / 3, -0.75],
    answer: '-2/3',
    reference: -0.75,
    referenceText: '-3/4',
    referenceLabel: 'So sánh với',
    selectedLabel: 'Em chọn',
    success:
      '-2/3 = -8/12; -3/4 = -9/12. Điểm -2/3 nằm bên phải nên -2/3 lớn hơn.',
    hint: 'Chưa đúng. Sau khi quy đồng, ta so sánh -8/12 và -9/12. Vì -8 > -9 nên -8/12 > -9/12. Vậy -2/3 lớn hơn -3/4. Trên hình, điểm -8/12 nằm bên phải điểm -9/12.',
  },
  {
    prompt: 'Từ -1/2 đi sang phải 3/4 đơn vị. Em đến số nào?',
    choices: ['-5/4', '1/4', '2/4'],
    values: [-1.25, 0.25, 0.5],
    answer: '1/4',
    reference: -0.5,
    referenceText: '-1/2',
    referenceLabel: 'Bắt đầu tại',
    selectedLabel: 'Em đến',
    success:
      '-1/2 + 3/4 = -2/4 + 3/4 = 1/4. Từ -2/4 đi sang phải ba khoảng, mỗi khoảng bằng 1/4.',
    hint: 'Bắt đầu ở -2/4, rồi đi sang phải 3 khoảng, mỗi khoảng bằng 1/4. Đừng cộng các mẫu số.',
  },
] as const;

export const CONCEPT_PROMPTS: Record<ConceptLabKind, string> = {
  'missing-parts':
    'Em đang tìm cả bộ hay một phần? Thay số em chọn vào ô trống rồi kiểm tra hai vế có bằng nhau không.',
  'equal-groups':
    'Đề bài hỏi số hộp, số đồ vật trong mỗi hộp hay tổng số đồ vật? Hãy chỉ đại lượng đó trên hình.',
  measurement:
    'Em đang đo độ dài, khối lượng hay dung tích? Mỗi vạch hoặc mỗi lần thêm tương ứng với bao nhiêu đơn vị?',
  midpoint:
    'M có nằm trên đoạn AB không? Hai độ dài AM và MB có bằng nhau không? Cần đủ cả hai điều kiện.',
  rational:
    'Các cách viết bằng nhau có cùng vị trí. Trên trục số, số nằm bên phải lớn hơn. Khi cộng số dương, ta đi sang phải.',
};

export function partResult(round: number, value: number) {
  const r = PART_ROUNDS[round];
  const expected = r.unknown === 'whole' ? r.whole : r.whole - r.known;
  return {
    correct: value === expected,
    expected,
    total: r.unknown === 'whole' ? value : value + r.known,
  };
}
export function groupResult(round: number, value: number) {
  const r = GROUP_ROUNDS[round];
  const groups = r.unknown === 'groups' ? value : r.groups;
  const size = r.unknown === 'size' ? value : r.size;
  const expected =
    r.unknown === 'groups' ? r.groups : r.unknown === 'size' ? r.size : r.total;
  return {
    correct: value === expected,
    groups,
    size,
    total: groups * size,
    expected,
  };
}
export function isMidpoint(length: number, position: number, onLine: boolean) {
  return onLine && position > 0 && position < length && position * 2 === length;
}
