// AM length, MB length, lift M off AB (0/1), show length labels (0/1).
export function parseSegment(value: unknown): number[] {
  if (!Array.isArray(value) || value.length !== 4 ||
      value.some(v => typeof v !== 'number' || !Number.isFinite(v)) ||
      value[0] < 1 || value[0] > 20 || value[1] < 1 || value[1] > 20 ||
      ![0, 1].includes(value[2]) || ![0, 1].includes(value[3]) ||
      (value[2] === 1 && value[3] === 1))
    throw new Error('Hình đoạn thẳng cần AM, MB từ 1–20; lệch hàng và hiện độ dài là 0 hoặc 1. Chỉ ghi độ dài khi thẳng hàng.');
  return value.slice();
}
export function segmentGeometry(values: number[]) {
  const [left, right, lift, show] = parseSegment(values);
  return { middle: 30 + 420 * left / (left + right), y: lift ? 28 : 70,
    left, right, lift: Boolean(lift), show: Boolean(show) };
}
