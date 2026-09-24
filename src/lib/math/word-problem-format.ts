import { cancellationText } from './format';

export type WordProblemRow = {
  text: string;
  role: 'heading' | 'explanation' | 'calculation' | 'answer';
};

const wordProblemUnit = /\s*\(([\p{L}°²³%]+(?:[ /][\p{L}°²³%]+)*)\)(\s*\.?)$/u;

function wordProblemCalculation(line: string): string | null {
  const expression = cancellationText(line.replace(wordProblemUnit, ''));
  if (
    !expression.includes('=') ||
    !/^(?:[\d\s.,;+−×÷*/:()[\]{}=⁰¹²³⁴⁵⁶⁷⁸⁹^%-]|ƯCLN|BCNN|ƯC|BC)+$/u.test(
      expression
    )
  )
    return null;

  const steps = expression.replace(/\.$/u, '').split('=');
  if (
    steps.length > 2 &&
    steps.every((part) =>
      /^(?:\d+(?:[.,]\d+)?|[+−×÷*/:()[\]\s-])+$/u.test(part)
    ) &&
    /^[+−-]?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?$/u.test(steps.at(-1)!.trim())
  ) {
    const authored = line.split('=').map((part) => part.trim());
    return `${authored[0]} = ${authored.at(-1)}`;
  }
  return line;
}

export function wordProblemRows(solution: string): WordProblemRow[] | null {
  const lines = solution
    .normalize('NFC')
    .trim()
    .replace(/^(?:Lời giải(?: mẫu)?|Bài giải)\s*:\s*/iu, '')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const body = lines.map((line) => {
    if (/^Đáp số\s*:/iu.test(line))
      return {
        text: line
          .replace(/^Đáp số\s*:\s*/iu, 'Đáp số: ')
          .replace(wordProblemUnit, ' $1$2'),
        role: 'answer' as const,
      };
    const calculation = wordProblemCalculation(line);
    return {
      text: calculation ?? line,
      role:
        calculation !== null
          ? ('calculation' as const)
          : ('explanation' as const),
    };
  });
  if (body.length < 2 || body.at(-1)?.role !== 'answer') return null;
  return [{ text: 'Bài giải:', role: 'heading' }, ...body];
}
