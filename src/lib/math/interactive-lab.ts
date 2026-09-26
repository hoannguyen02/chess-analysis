import type { MathLessonData } from './lessons';

export const LAB_LABELS = {
  none: 'Không dùng hoạt động tương tác',
  sharing: 'Chia quà công bằng',
  'number-line': 'Định vị trên trục số',
  powers: 'Khám phá lũy thừa',
  'missing-parts': 'Tìm phần còn thiếu',
  'equal-groups': 'Xưởng đóng hộp',
  measurement: 'Phòng đo lường',
  midpoint: 'Tìm trung điểm',
  rational: 'Khám phá số hữu tỉ',
} as const;
export type InteractiveLabKind = keyof typeof LAB_LABELS;

// Resolve at presentation time: existing saved content and progress stay intact.
export function interactiveLabFor(
  lesson: Pick<MathLessonData, 'id' | 'grade' | 'interactiveLab'>
): InteractiveLabKind {
  if (lesson.interactiveLab) return lesson.interactiveLab;
  if (lesson.grade === 3 && lesson.id === 'math-unit-fractions-3')
    return 'sharing';
  if (lesson.grade === 7 && lesson.id === 'math-number-line-7')
    return 'number-line';
  if (lesson.grade === 7 && lesson.id === 'math-rational-exponents-7')
    return 'powers';
  const builtIns: Record<string, { grade: number; kind: InteractiveLabKind }> =
    {
      'math-add-subtract-components-3': { grade: 3, kind: 'missing-parts' },
      'math-multiply-divide-components-3': { grade: 3, kind: 'equal-groups' },
      'math-measurement-units-3': { grade: 3, kind: 'measurement' },
      'math-midpoint-3': { grade: 3, kind: 'midpoint' },
      'math-rational-7': { grade: 7, kind: 'rational' },
    };
  const preset = builtIns[lesson.id];
  return preset?.grade === lesson.grade ? preset.kind : 'none';
}

export const SHARING_ROUNDS = [
  { total: 12, groups: 3 },
  { total: 15, groups: 5 },
  { total: 8, groups: 2 },
] as const;
export const LINE_ROUNDS = [
  { numerator: -3, denominator: 4 },
  { numerator: -5, denominator: 4 },
  { numerator: 2, denominator: 3 },
] as const;
export const POWER_ROUNDS = [
  { base: -2, exponent: 3 },
  { base: -2, exponent: 2 },
  { base: -0.5, exponent: 3 },
] as const;

export function fractionLabel(n: number, d: number): string {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(Math.abs(n), d);
  return d / divisor === 1
    ? String(n / divisor)
    : `${n / divisor}/${d / divisor}`;
}

export function checkSharing(counts: number[], total: number) {
  const remaining = total - counts.reduce((a, b) => a + b, 0);
  const correct =
    remaining === 0 && counts.every((n) => n === total / counts.length);
  return {
    correct,
    message: correct
      ? `Em đã chia ${total} chiếc bánh thành ${counts.length} nhóm bằng nhau. Mỗi nhóm có ${counts[0]} chiếc.`
      : remaining > 0
        ? `Còn ${remaining} chiếc chưa chia. Hãy chia hết rồi so sánh các khay.`
        : 'Khay nào nhiều nhất, khay nào ít nhất? Hãy chuyển bánh để các khay bằng nhau.',
  };
}

export function checkPlacement(
  position: number,
  numerator: number,
  denominator: number
) {
  const correct = position === numerator;
  const direction = numerator < 0 ? 'trái' : 'phải';
  return {
    correct,
    message: correct
      ? `Từ 0 đi sang ${direction} ${Math.abs(numerator)} khoảng, mỗi khoảng ${fractionLabel(1, denominator)} đơn vị.`
      : position === -numerator
        ? `Khoảng cách tới 0 đúng rồi. Số ${numerator < 0 ? 'âm' : 'dương'} nằm ở phía nào của 0?`
        : `Mỗi khoảng bằng ${fractionLabel(1, denominator)} đơn vị. Từ 0, đếm ${Math.abs(numerator)} khoảng sang ${direction}; không đếm vạch 0 là một khoảng.`,
  };
}
