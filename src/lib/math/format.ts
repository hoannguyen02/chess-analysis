// Hide denominator 1 only. Preserve intermediate working such as 6/6
// and 6/3; never evaluate lesson text as code.
export function wholeNumberFraction(
  n: number | string,
  d: number | string
): string | null {
  const numerator = String(n).trim(),
    denominator = String(d).trim();
  if (!/^[+-]?\d+$/.test(numerator) || !/^[+-]?\d+$/.test(denominator))
    return null;
  const top = BigInt(numerator),
    bottom = BigInt(denominator);
  return bottom === BigInt(1) ? String(top) : null;
}

// A factor enclosed in ~ marks is cancelled, e.g. (~5~ × ~4~)/(~4~ × 2 × ~5~ × 3).
export function cancellationParts(value: string) {
  return value
    .split(/(~[^~]+~)/g)
    .filter(Boolean)
    .map((part) => ({
      text:
        part.startsWith('~') && part.endsWith('~') ? part.slice(1, -1) : part,
      cancelled: part.startsWith('~') && part.endsWith('~'),
    }));
}
export const cancellationText = (value: string) =>
  cancellationParts(value)
    .map((part) => part.text)
    .join('');
