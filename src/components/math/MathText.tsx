import { cancellationParts, wholeNumberFraction } from '@/lib/math/format';
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

export function Fraction({ n, d }: { n: number | string; d: number | string }) {
  const whole = wholeNumberFraction(n, d);
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
