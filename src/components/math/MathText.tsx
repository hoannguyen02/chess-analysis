import {
  cancellationParts,
  stripRedundantFractionParentheses,
  wholeNumberFraction,
} from '@/lib/math/format';
import { ReactNode } from 'react';
import styles from './MathLesson.module.css';

function Factors({ value }: { value: number | string }) {
  return (
    <>
      {cancellationParts(String(value)).map((part, i) =>
        part.cancelled ? (
          <span key={i} className={styles.cancelledFactor}>
            {part.text}
          </span>
        ) : (
          part.text
        )
      )}
    </>
  );
}

export function Fraction({ n, d, precedingText = '' }: { n: number | string; d: number | string; precedingText?: string }) {
  const whole = wholeNumberFraction(n, d, precedingText);
  if (whole !== null) return <span>{whole}</span>;
  return (
    <span
      className={styles.fraction}
      role="img"
      aria-label={`${cancellationParts(String(n))
        .map((p) => (p.cancelled ? `${p.text} được rút gọn` : p.text))
        .join('')} phần ${cancellationParts(String(d))
        .map((p) => (p.cancelled ? `${p.text} được rút gọn` : p.text))
        .join('')}`}
    >
      <span aria-hidden="true">
        <Factors value={n} />
      </span>
      <span aria-hidden="true">
        <Factors value={d} />
      </span>
    </span>
  );
}

// Format lesson copy only; navigation and progress counts are not fractions.
export function MathText({ children }: { children: string }) {
  const text = stripRedundantFractionParentheses(children);
  const parts: ReactNode[] = [];
  const pattern = /(\([^()]+\)|-?\d+|□)\s*\/\s*(\([^()]+\)|-?\d+|□)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    parts.push(text.slice(cursor, index));
    const unwrap = (value: string) =>
      value.startsWith('(') ? value.slice(1, -1) : value;
    parts.push(
      <Fraction
        key={index}
        n={unwrap(match[1])}
        d={unwrap(match[2])}
        precedingText={text.slice(0, index)}
      />
    );
    cursor = index + match[0].length;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
