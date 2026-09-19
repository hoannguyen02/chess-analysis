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
