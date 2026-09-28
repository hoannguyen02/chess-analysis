export type ConstructionId =
  | 'b4'
  | 'm4'
  | 'equal-angles'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5';
type Point = [number, number];
export type AnglePrimitive =
  | { points: Point[]; dashed?: boolean }
  | { at: Point; text: string; size: number };

/** One geometry model for screen and print. Only given measures are labelled. */
export function angleConstruction(id: ConstructionId, reveal: boolean) {
  const items: AnglePrimitive[] = [];
  const point = (a: number, r: number): Point => [
    220 + r * Math.cos((a * Math.PI) / 180),
    235 - r * Math.sin((a * Math.PI) / 180),
  ];
  const line = (...points: Point[]) => items.push({ points });
  const text = (value: string, a: number, r: number, size = 14) =>
    items.push({ at: point(a, r), text: value, size });
  const arc = (
    a: number,
    b: number,
    r: number,
    label = '',
    ticks = 0,
    dashed = false
  ) => {
    items.push({
      points: Array.from({ length: 41 }, (_, i) =>
        point(a + ((b - a) * i) / 40, r)
      ),
      dashed,
    });
    if (label) text(label, (a + b) / 2, r + 18);
    for (let i = 0; i < ticks; i++) {
      const mid = (a + b) / 2 + (i - (ticks - 1) / 2) * 5;
      line(point(mid, r - 4), point(mid, r + 4));
    }
  };
  if (id === 'equal-angles') {
    // Separate vertices illustrate why equal measures alone do not imply vertical angles.
    for (const [cx, cy, vertex, lower, upper] of [
      [75, 220, 'O', 'x', 'y'],
      [285, 220, 'A', 'u', 'v'],
    ] as const) {
      const p = (a: number, r: number): Point => [
        cx + r * Math.cos((a * Math.PI) / 180),
        cy - r * Math.sin((a * Math.PI) / 180),
      ];
      for (const [name, a] of [
        [lower, 0],
        [upper, 60],
      ] as const) {
        line(p(a, 0), p(a, 115));
        const tip = p(a, 115),
          base = p(a, 107);
        const dx = 3 * Math.sin((a * Math.PI) / 180),
          dy = 3 * Math.cos((a * Math.PI) / 180);
        line([base[0] + dx, base[1] + dy], tip, [base[0] - dx, base[1] - dy]);
        items.push({ at: p(a, 132), text: name, size: 18 });
      }
      items.push({
        points: Array.from({ length: 31 }, (_, i) => p(i * 2, 40)),
      });
      items.push({ at: p(30, 65), text: '60°', size: 14 });
      items.push({ at: [cx - 8, cy + 22], text: vertex, size: 18 });
    }
    items.push({
      at: [220, 35],
      text: reveal
        ? 'Bằng nhau nhưng không đối đỉnh'
        : 'Hai góc này có đối đỉnh không?',
      size: 16,
    });
    return { items, caption: 'Hai góc cùng số đo, có đỉnh O và A khác nhau.' };
  }
  let rays: [string, number][];
  let caption: string;
  if (id === 'b4') {
    rays = [
      ['x', 0],
      ['y', 50],
    ];
    arc(0, 180, 180);
    for (let a = 0; a <= 180; a += 5) {
      line(point(a, a % 10 === 0 ? 171 : 176), point(a, 180));
      if (a % 10 === 0) {
        text(String(a), a, 137, 10);
        text(String(180 - a), a, 158, 10);
      }
    }
    caption =
      'Thang trong: bắt đầu từ 0 ở bên phải, theo tia Ox. Thang ngoài: bắt đầu từ 0 ở bên trái.';
    items.push({
      at: [220, 278],
      text: 'Trong: 0 → 180   ·   Ngoài: 180 → 0',
      size: 13,
    });
  } else if (id === 'm4') {
    rays = [
      ['x', 0],
      ['z', 45],
      ['y', 180],
    ];
    arc(0, 45, 65, reveal ? '45°' : 'a');
    arc(45, 180, 85, reveal ? '135°' : '3a');
    items.push({ at: [220, 18], text: 'Hai góc kề bù', size: 16 });
    items.push({ at: [220, 278], text: 'Góc xOy = 180°', size: 14 });
    caption =
      'Góc nhỏ có số đo a; góc lớn có số đo 3a. Hình minh họa, không dùng để đo.';
  } else {
    const cases = {
      h1: {
        rays: [
          ['x', 0],
          ['z', 64],
          ['t', 122],
          ['y', 180],
        ],
        target: [64, 122],
        answer: 58,
        name: 'zOt',
      },
      h2: {
        rays: [
          ['x', 0],
          ['m', 40],
          ['z', 80],
          ['n', 130],
          ['y', 180],
        ],
        target: [40, 130],
        answer: 90,
        name: 'mOn',
      },
      h3: {
        rays: [
          ['x', 0],
          ['m', 30],
          ['z', 60],
          ['n', 96],
          ['y', 132],
        ],
        target: [30, 96],
        answer: 66,
        name: 'mOn',
      },
      h4: {
        rays: [
          ['x', 0],
          ['t', 36],
          ['z', 72],
          ['y', 144],
        ],
        target: [36, 144],
        answer: 108,
        name: 'tOy',
      },
      h5: {
        rays: [
          ['x', 0],
          ['t', 50],
          ['z', 100],
          ['y', 150],
        ],
        target: [50, 150],
        answer: 100,
        name: 'tOy',
      },
    };
    const c = cases[id];
    rays = c.rays as [string, number][];
    if (id === 'h1') {
      arc(0, 64, 55, '64°');
      arc(64, 122, 70, '', 1);
      arc(122, 180, 70, '', 1);
    }
    if (id === 'h2' || id === 'h3') {
      const [, m, z, n, y] = rays.map((r) => r[1]);
      arc(0, m, 55, '', 1);
      arc(m, z, 55, '', 1);
      arc(z, n, 75, '', 2);
      arc(n, y, 75, '', 2);
    }
    if (id === 'h4') {
      arc(0, 36, 45, '', 1);
      arc(36, 72, 45, '', 1);
      arc(0, 72, 80, '', 2);
      arc(72, 144, 80, '', 2);
    }
    if (id === 'h5') {
      arc(0, 50, 55, '', 1);
      arc(50, 100, 55, '', 1);
    }
    arc(c.target[0], c.target[1], 155, '', 0, true);
    items.push({
      at: [220, 18],
      text: `Góc ${c.name} = ${reveal ? `${c.answer}°` : '?'}`,
      size: 16,
    });
    const total = rays[rays.length - 1][1];
    items.push({
      at: [220, 278],
      text: `Góc xOy = ${total}°${id === 'h5' ? '; xOz = 2 × zOy' : ''}`,
      size: 14,
    });
    caption =
      'Cung nét đứt chỉ góc cần tìm. Các cung có cùng số dấu gạch biểu diễn các góc bằng nhau. Hình minh họa, không dùng để đo.';
  }
  for (const [name, a] of rays) {
    line(point(a, 0), point(a, 185));
    const tip = point(a, 185),
      base = point(a, 176),
      dx = 4 * Math.sin((a * Math.PI) / 180),
      dy = 4 * Math.cos((a * Math.PI) / 180);
    line([base[0] + dx, base[1] + dy], tip, [base[0] - dx, base[1] - dy]);
    text(name, a, 203, 18);
  }
  items.push({ at: [215, 254], text: 'O', size: 18 });
  return { items, caption };
}
