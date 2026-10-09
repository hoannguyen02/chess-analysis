import type { AnglePrimitive } from './angle-construction';
export type ParallelFigure = {
  mode?:
    | 'transversal'
    | 'euclid'
    | 'triple'
    | 'intersection'
    | 'parallel-lines';
  angle?: number;
  tilt?: number;
  parallel?: boolean;
  labels?: Record<string, string>;
  answers?: Record<string, string>;
};
export const parallelAngleValue = (angle: number, index: number) =>
  index % 2 ? angle : 180 - angle;
/** A1/B1 upper-right, then counterclockwise: 2 upper-left, 3 lower-left, 4 lower-right. */
export function parallelGeometry(config: ParallelFigure, reveal = false) {
  const items: AnglePrimitive[] = [];
  const line = (...points: [number, number][]) => items.push({ points });
  const text = (value: string, x: number, y: number, size = 14) =>
    items.push({ at: [x, y], text: value, size });
  if (config.mode === 'intersection') {
    const cx = 220,
      cy = 145,
      angle = 65;
    const point = (a: number, r: number): [number, number] => [
      cx + r * Math.cos((a * Math.PI) / 180),
      cy - r * Math.sin((a * Math.PI) / 180),
    ];
    line([35, cy], [405, cy]);
    line(point(angle + 180, 120), point(angle, 120));
    text('a', 418, cy);
    text('c', 280, 27);
    text('O', 207, cy - 10);
    const bounds = [0, angle, 180, 180 + angle, 360];
    for (let i = 1; i <= 4; i++) {
      const mid = (bounds[i - 1] + bounds[i]) / 2;
      const [x, y] = point(mid, 55);
      text(String(i), x, y, 18);
      if (i <= 3) {
        items.push({
          points: Array.from({ length: 25 }, (_, j) =>
            point(bounds[i - 1] + ((bounds[i] - bounds[i - 1]) * j) / 24, 32)
          ),
        });
        if (i === 1 || i === 3) line(point(mid, 27), point(mid, 37));
      }
    }
    text('Góc 1 = góc 3 (đối đỉnh)', 220, 275);
    return {
      items,
      caption:
        'Hai đường thẳng a và c cắt nhau tại O. Góc 1 và góc 3 có cùng dấu gạch: chúng đối đỉnh và bằng nhau. Góc 1 và góc 2 kề bù, tổng bằng 180°.',
    };
  }
  if (config.mode === 'parallel-lines') {
    line([35, 100], [405, 100]);
    line([35, 205], [405, 205]);
    text('a', 418, 100);
    text('b', 418, 205);
    for (const y of [100, 205]) line([350, y - 5], [358, y], [350, y + 5]);
    text('a ∥ b', 220, 265, 18);
    return {
      items,
      caption:
        'Hai đường thẳng a và b song song. Dấu mũi tên giống nhau trên hai đường biểu thị quan hệ song song.',
    };
  }
  if (config.mode === 'euclid') {
    line([30, 230], [405, 230]);
    text('a', 415, 230);
    const slope = Math.tan(((config.tilt ?? 0) * Math.PI) / 180);
    line([45, 100 + 170 * slope], [385, 100 - 170 * slope]);
    text('b', 399, 100 - 170 * slope);
    text('M', 215, 83);
    line([211, 96], [219, 104]);
    line([211, 104], [219, 96]);
    text(config.tilt ? 'b đi qua M' : 'b ∥ a', 220, 275);
    return {
      items,
      caption: 'M nằm ngoài đường thẳng a. Đường thẳng b đi qua M.',
    };
  }
  if (config.mode === 'triple') {
    for (const [name, y] of [
      ['a', 80],
      ['b', 150],
      ['d', 220],
    ] as const) {
      line([40, y], [395, y]);
      text(name, 415, y);
    }
    text('a ∥ d; b ∥ d; a ≠ b', 220, 275);
    return {
      items,
      caption: 'Hai đường thẳng phân biệt a và b cùng song song với d.',
    };
  }
  const knownAngle = (vertex: string) => {
    for (const [key, label] of Object.entries(config.labels ?? {})) {
      if (key[0] !== vertex || !/^\d+°$/.test(label)) continue;
      const value = Number(label.slice(0, -1));
      return Number(key[1]) % 2 ? value : 180 - value;
    }
    return undefined;
  };
  const angle = config.angle ?? knownAngle('A') ?? knownAngle('B') ?? 65;
  const beta = config.parallel ? 0 : angle - (knownAngle('B') ?? angle);
  const slope = Math.tan((beta * Math.PI) / 180);
  const rad = (angle * Math.PI) / 180;
  const ax = 220 + 55 / Math.tan(rad),
    bx = 220 - 55 / Math.tan(rad);
  line([25, 95], [405, 95]);
  line([25, 205 - (25 - bx) * slope], [405, 205 - (405 - bx) * slope]);
  line([220 - 125 / Math.tan(rad), 275], [220 + 125 / Math.tan(rad), 25]);
  text('a', 420, 95);
  text('b', 420, 205 - (405 - bx) * slope);
  text('c', 220 + 125 / Math.tan(rad) + 12, 25);
  for (const [name, cx, cy] of [
    ['A', ax, 95],
    ['B', bx, 205],
  ] as const) {
    text(name, cx - 9, cy - 8, 12);
    const base = name === 'B' ? beta : 0;
    const bounds = [base, angle, 180 + base, 180 + angle, 360 + base];
    for (let i = 1; i <= 4; i++) {
      const from = bounds[i - 1],
        to = bounds[i],
        mid = (((from + to) / 2) * Math.PI) / 180;
      const key = `${name}${i}`;
      const label =
        reveal && config.answers?.[key]
          ? config.answers[key]
          : config.labels?.[key];
      const r = label ? 27 : 20;
      if (label)
        items.push({
          points: Array.from({ length: 25 }, (_, j) => {
            const t = ((from + ((to - from) * j) / 24) * Math.PI) / 180;
            return [cx + r * Math.cos(t), cy - r * Math.sin(t)];
          }),
        });
      text(String(i), cx + 37 * Math.cos(mid), cy - 37 * Math.sin(mid), 11);
      if (label)
        text(label, cx + 66 * Math.cos(mid), cy - 66 * Math.sin(mid), 13);
    }
  }
  if (config.parallel) {
    for (const y of [95, 205]) line([355, y - 5], [363, y], [355, y + 5]);
    text('a ∥ b', 365, 285);
  }
  return {
    items,
    caption:
      'c cắt a tại A, cắt b tại B. Góc 1 ở phía trên bên phải; đánh số ngược chiều kim đồng hồ. Hình minh họa, không dùng để đo.',
  };
}
