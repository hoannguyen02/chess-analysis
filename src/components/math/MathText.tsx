import {
  cancellationParts,
  stripRedundantFractionParentheses,
  wholeNumberFraction,
} from '@/lib/math/format';
import { ReactNode } from 'react';
import styles from './MathLesson.module.css';

// Keep the stored □ marker unchanged; only its presentation gets a question mark.
function Placeholders({ children }: { children: string }) {
  return (
    <>
      {children.split(/(□)/u).map((part, index) =>
        part === '□' ? (
          <span
            key={index}
            className={styles.questionBox}
            role="img"
            aria-label="Ô trống cần điền"
          >
            <span aria-hidden="true">?</span>
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function Factors({ value }: { value: number | string }) {
  return (
    <>
      {cancellationParts(String(value)).map((part, i) =>
        part.cancelled ? (
          <span key={i} className={styles.cancelledFactor}>
            <Placeholders>{part.text}</Placeholders>
          </span>
        ) : (
          <Placeholders key={i}>{part.text}</Placeholders>
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
        .join('').replaceAll('□', 'ô trống cần điền')} phần ${cancellationParts(String(d))
        .map((p) => (p.cancelled ? `${p.text} được rút gọn` : p.text))
        .join('').replaceAll('□', 'ô trống cần điền')}`}
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
    parts.push(<Placeholders key={`text-${cursor}`}>{text.slice(cursor, index)}</Placeholders>);
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
  parts.push(<Placeholders key={`text-${cursor}`}>{text.slice(cursor)}</Placeholders>);
  return <>{parts}</>;
}
