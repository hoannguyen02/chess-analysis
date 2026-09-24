// Parentheses add no meaning around an unsigned fraction used as an explicit
// arithmetic operand. Keep them when they group a nested fraction, exponent,
// function argument, implicit product, negative value, or invalid denominator.
export function stripRedundantFractionParentheses(text: string): string {
  return text.replace(
    /\(\s*(\d+)\s*\/\s*(\d+)\s*\)/gu,
    (
      match: string,
      numerator: string,
      denominator: string,
      offset: number,
      source: string
    ) => {
      if (BigInt(denominator) === BigInt(0)) return match;
      const before = source.slice(0, offset),
        after = source.slice(offset + match.length),
        previous = before.match(/(\S)\s*$/u)?.[1] || '',
        next = after.match(/^\s*(\S)/u)?.[1] || '',
        immediateBefore = source[offset - 1] || '',
        immediateAfter = source[offset + match.length] || '';
      if (
        previous === '/' ||
        next === '/' ||
        /^[\^!_⁰¹²³⁴⁵⁶⁷⁸⁹]$/u.test(next) ||
        (immediateBefore !== '' &&
          !/\s/u.test(immediateBefore) &&
          /[\p{L}\p{N}_)\]}]/u.test(immediateBefore)) ||
        (immediateAfter !== '' &&
          !/\s/u.test(immediateAfter) &&
          /[\p{L}\p{N}_([{]/u.test(immediateAfter))
      )
        return match;
      const arithmeticOperator = /^[+\-−×*:÷=<>≤≥≠]$/u;
      if (!arithmeticOperator.test(previous) && !arithmeticOperator.test(next))
        return match;
      return `${numerator}/${denominator}`;
    }
  );
}

// Hide denominator 1 only. Preserve intermediate working such as 6/6
// and 6/3; never evaluate lesson text as code.
export function wholeNumberFraction(
  n: number | string,
  d: number | string,
  precedingText = ''
): string | null {
  const numerator = String(n).trim(),
    denominator = String(d).trim();
  if (!/^[+-]?\d+$/.test(numerator) || !/^[+-]?\d+$/.test(denominator))
    return null;
  const top = BigInt(numerator),
    bottom = BigInt(denominator);
  // Keep the fraction in explicit integer-to-fraction conversions (e.g. -2 = -2/1).
  const conversion = precedingText.match(/(?:^|[^\d/])([+-]?\d+)\s*=\s*$/);
  if (bottom === BigInt(1) && conversion && BigInt(conversion[1]) === top)
    return null;
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

// Keep authored prose and word-problem solutions intact. Pure calculation
// chains become one equality step per line in the learner view and PDF.
export function formatCalculationSteps(value: string): string {
  if (value.includes('\n')) return value;
  const parts = value.split(/\s*=\s*/u);
  if (
    parts.length < 3 ||
    !/^[\d\s+\-−×÷*/:().,[\]~□=^₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹a-zA-Z]+$/u.test(value)
  )
    return value;
  return parts.join('\n= ');
}
