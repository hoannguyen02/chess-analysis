import { wholeNumberFraction } from '@/lib/math/format';
import { ReactNode } from 'react';
import styles from './MathLesson.module.css';

export function Fraction({ n, d }: { n: number | string; d: number | string }) {
  const whole = wholeNumberFraction(n, d);
  if (whole !== null) return <span>{whole}</span>;
  return (
    <span className={styles.fraction} role="img" aria-label={`${n} phần ${d}`}>
      <span aria-hidden="true">{n}</span>
      <span aria-hidden="true">{d}</span>
    </span>
  );
}

// Format lesson copy only; navigation and progress counts are not fractions.
export function MathText({ children }: { children: string }) {
  const parts: ReactNode[] = [];
  const pattern = /(\([^()]+\)|-?\d+|□)\s*\/\s*(\([^()]+\)|-?\d+|□)/g;
  let cursor = 0;
  for (const match of children.matchAll(pattern)) {
    const index = match.index!;
    parts.push(children.slice(cursor, index));
    const unwrap = (value: string) =>
      value.startsWith('(') ? value.slice(1, -1) : value;
    parts.push(
      <Fraction key={index} n={unwrap(match[1])} d={unwrap(match[2])} />
    );
    cursor = index + match[0].length;
  }
  parts.push(children.slice(cursor));
  return <>{parts}</>;
}
