// Use stacked fractions when isolating x; retain division in the original
// questions and in rules that explicitly teach division of powers/fractions.
export function equalityFractionNotation(text: string): string {
  return text
    .replace(/(?<![\w/^])([0-9]+) : (\(-[0-9]+\)|[0-9]+)(?![\d/^])/gu, '$1/$2')
    .replaceAll('3x : 3', '(3x)/3')
    .replaceAll('x = b : a', 'x = (b)/(a)')
    .replaceAll('x = a : b', 'x = (a)/(b)')
    .replaceAll('3/2 : 3', '(3/2) × (1/3)')
    .split('\n')
    .filter((line, index, lines) => index === 0 || line !== lines[index - 1])
    .join('\n');
}
