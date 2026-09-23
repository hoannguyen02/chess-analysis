// Structured solution diagrams: no inference from Vietnamese question wording.
export type SolutionNumberLine = {
  min: number;
  max: number;
  divisions: number;
  points: { value: string; name?: string; emphasis?: boolean }[];
  caption?: string;
};

// A leading minus applies to the entire mixed number, e.g. -1 1/2 = -1.5.
export function numberLineValue(text: string): number | null {
  const value = text.trim().replace(/−/gu, '-');
  const mixed = value.match(/^([+-]?)(\d+)\s+(\d+)\/(\d+)$/u);
  if (mixed) {
    const [, sign, whole, n, d] = mixed;
    if (+d === 0 || +n >= +d) return null;
    return (sign === '-' ? -1 : 1) * (+whole + +n / +d);
  }
  const fraction = value.match(/^([+-]?\d+)\/(\d+)$/u);
  if (fraction) return +fraction[2] ? +fraction[1] / +fraction[2] : null;
  return /^[+-]?\d+(?:[.,]\d+)?$/u.test(value)
    ? Number(value.replace(',', '.'))
    : null;
}

export function parseSolutionNumberLine(
  input: unknown
): SolutionNumberLine | null {
  if (input === null) return null; // Explicitly hide a built-in diagram.
  const fail = (): never => {
    throw new Error(
      'Trục số lời giải: cần hai đầu nguyên chứa 0, 1–12 phần mỗi đơn vị, tối đa 60 khoảng và 1–12 điểm nằm trên vạch chia.'
    );
  };
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return fail();
  const raw = input as Record<string, unknown>;
  const { min, max, divisions } = raw;
  if (
    typeof min !== 'number' ||
    !Number.isInteger(min) ||
    min < -1000 ||
    min > 0 ||
    typeof max !== 'number' ||
    !Number.isInteger(max) ||
    max > 1000 ||
    max < 0 ||
    min >= max ||
    typeof divisions !== 'number' ||
    !Number.isInteger(divisions) ||
    divisions < 1 ||
    divisions > 12 ||
    (max - min) * divisions > 60 ||
    !Array.isArray(raw.points) ||
    raw.points.length < 1 ||
    raw.points.length > 12
  )
    return fail();
  const positions = new Set<number>();
  const points = raw.points.map(
    (entry): SolutionNumberLine['points'][number] => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry))
        return fail();
      const point = entry as Record<string, unknown>;
      if (typeof point.value !== 'string' || point.value.length > 32)
        return fail();
      const value = numberLineValue(point.value);
      if (
        value === null ||
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        Math.abs(value * divisions - Math.round(value * divisions)) > 1e-8 ||
        positions.has(value)
      )
        return fail();
      positions.add(value);
      if (
        point.name !== undefined &&
        (typeof point.name !== 'string' ||
          !point.name.trim() ||
          point.name.length > 16 ||
          /[\r\n]/u.test(point.name))
      )
        return fail();
      if (point.emphasis !== undefined && typeof point.emphasis !== 'boolean')
        return fail();
      return {
        value: point.value.trim(),
        ...(point.name !== undefined ? { name: point.name as string } : {}),
        ...(point.emphasis !== undefined
          ? { emphasis: point.emphasis as boolean }
          : {}),
      };
    }
  );
  if (
    raw.caption !== undefined &&
    (typeof raw.caption !== 'string' || raw.caption.length > 240)
  )
    return fail();
  return {
    min,
    max,
    divisions,
    points,
    ...(raw.caption !== undefined ? { caption: raw.caption as string } : {}),
  };
}

// Coordinates are fractions of the axis span, shared by drawing and tests.
export function numberLineGeometry(diagram: SolutionNumberLine) {
  const { min, max, divisions } = diagram;
  return {
    ticks: Array.from({ length: (max - min) * divisions + 1 }, (_, index) => ({
      value: min + index / divisions,
      position: index / ((max - min) * divisions),
      major: index % divisions === 0,
    })),
    points: diagram.points
      .map((point) => ({
        ...point,
        position: (numberLineValue(point.value)! - min) / (max - min),
      }))
      .sort((a, b) => a.position - b.position),
  };
}
