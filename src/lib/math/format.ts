// Parentheses add no meaning around an unsigned fraction used as an explicit
// arithmetic operand. Keep them when they group a nested fraction, exponent,
// function argument, implicit product, negative value, or invalid denominator.
export function formatMultiplicationNotation(text: string, grade: number): string {
  if (grade < 6) return text;
  // Only explicit multiplication directly beside the unknown. Do not replace
  // numeric arithmetic, prose, or reinterpret an authored unknown as a box.
  return text
    .replace(/×(?=\s*x(?![\p{L}\p{N}_]))/gu, '·')
    .replace(/(?<![\p{L}_])x\s*×/gu, match => match.replace('×', '·'));
}

export const variableParts = (text: string) =>
  text.split(/((?<![\p{L}_])x(?![\p{L}\p{N}_]))/gu);

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
      const arithmeticOperator = /^[+\-−×·*:÷=<>≤≥≠]$/u;
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

// Recognize numeric working only; prose, variables and units keep their labels.
export function isCalculationOnlySolution(value: string): boolean {
  return value.includes('=') && /\d/u.test(value) &&
    /^[\d\s+\-−×·÷*/:().,[\]~□=^₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(value);
}

// Shared by grouped question labels and solution matching. A colon-delimited
// instruction may use new wording, but must contain only words, never conditions
// or mathematical operands. Unknown non-delimited wording stays intact.
export function calculationExpression(prompt: string): string {
  return prompt.normalize('NFC').trim()
    .replace(/^Luyện tập\s+\d+\.\s*/iu, '')
    .replace(/^Tính\b(?:[\p{L}\s]*:\s*|(?:(?: một cách)? hợp l[íý]| nhanh| giá trị(?: của)? biểu thức)?\s*:?\s*)/iu, '');
}

// Only omit a literal repeat of the displayed question. Never drop a first
// transformation or infer mathematical equivalence between different expressions.
export function calculationContinuation(prompt: string, solution: string): string {
  const normalize = (text: string) => stripRedundantFractionParentheses(text.normalize('NFC'))
    .trim().replace(/[.。]$/u, '').replace(/−/gu, '-').replace(/\s/gu, '');
  if (/^Tìm\s+x\b/iu.test(prompt.trim())) {
    const equation = prompt.trim().replace(/^Tìm\s+x\s*(?:,\s*biết\s*)?:\s*/iu, '')
      .replace(/\s*\(x\s*∈[^()]*\)\s*[.。]?$/u, '');
    const rows = solution.trim().split(/\r?\n/u);
    // Compare the whole equation, not merely its left-hand side. Keep a lone
    // answer and never discard a transformed equation or an explanatory note.
    if (rows.length > 1 && equation.includes('=') && normalize(equation) === normalize(rows[0]))
      return rows.slice(1).join('\n');
    return solution;
  }
  const steps = formatCalculationSteps(solution);
  if (!isCalculationOnlySolution(solution)) return steps;
  const equals = steps.indexOf('=');
  const expression = calculationExpression(prompt);
  return equals > 0 && normalize(expression) === normalize(steps.slice(0, equals))
    ? steps.slice(equals).trim() : steps;
}

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
