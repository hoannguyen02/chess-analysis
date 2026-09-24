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
      {children
        .split(/(□|\^\([^()]*\)|\^[+-]?(?:\d+|[a-zA-Z]))/u)
        .map((part, index) =>
          part === '□' ? (
            <span
              key={index}
              className={styles.questionBox}
              role="img"
              aria-label="Ô trống cần điền"
            >
              <span aria-hidden="true">?</span>
            </span>
          ) : part.startsWith('^') ? (
            <sup key={index} className={styles.exponent}>
              {part.startsWith('^(') ? part.slice(2, -1) : part.slice(1)}
            </sup>
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

export function Fraction({
  n,
  d,
  precedingText = '',
}: {
  n: number | string;
  d: number | string;
  precedingText?: string;
}) {
  const whole = wholeNumberFraction(n, d, precedingText);
  if (whole !== null) return <span>{whole}</span>;
  return (
    <span
      className={styles.fraction}
      role="img"
      aria-label={`${cancellationParts(String(n))
        .map((p) => (p.cancelled ? `${p.text} được rút gọn` : p.text))
        .join('')
        .replaceAll('□', 'ô trống cần điền')} phần ${cancellationParts(
        String(d)
      )
        .map((p) => (p.cancelled ? `${p.text} được rút gọn` : p.text))
        .join('')
        .replaceAll('□', 'ô trống cần điền')}`}
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

function ParenthesizedFraction({
  numerator,
  denominator,
  precedingText,
  exponent,
}: {
  numerator: string;
  denominator: string;
  precedingText: string;
  exponent?: string;
}) {
  const exponentText = exponent?.startsWith('(')
    ? exponent.slice(1, -1)
    : exponent;
  return (
    <span className={exponent ? styles.fractionPower : styles.fractionGroup}>
      <span className={styles.fractionGroup}>
        <span aria-hidden="true" className={styles.fractionBracket}>
          (
        </span>
        <Fraction n={numerator} d={denominator} precedingText={precedingText} />
        <span aria-hidden="true" className={styles.fractionBracket}>
          )
        </span>
      </span>
      {exponentText && <sup className={styles.exponent}>{exponentText}</sup>}
    </span>
  );
}

function NestedFractionPower({
  numerator,
  denominator,
  precedingText,
  innerExponent,
  outerExponent,
}: {
  numerator: string;
  denominator: string;
  precedingText: string;
  innerExponent: string;
  outerExponent: string;
}) {
  return (
    <span className={styles.nestedFractionPower}>
      <span aria-hidden="true" className={styles.outerFractionBracket}>
        [
      </span>
      <ParenthesizedFraction
        numerator={numerator}
        denominator={denominator}
        precedingText={precedingText}
        exponent={innerExponent}
      />
      <span aria-hidden="true" className={styles.outerFractionBracket}>
        ]
      </span>
      <sup className={styles.exponent}>{outerExponent}</sup>
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
    const end = index + match[0].length;
    const nested =
      text[index - 2] === '[' && text[index - 1] === '(' && text[end] === ')'
        ? text
            .slice(end + 1)
            .match(
              /^\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))\]\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))/u
            )
        : null;
    const grouped = text[index - 1] === '(' && text[end] === ')';
    const exponent = grouped
      ? text.slice(end + 1).match(/^\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))/u)?.[1]
      : undefined;
    parts.push(
      <Placeholders key={`text-${cursor}`}>
        {text.slice(cursor, nested ? index - 2 : grouped ? index - 1 : index)}
      </Placeholders>
    );
    const unwrap = (value: string) =>
      value.startsWith('(') ? value.slice(1, -1) : value;
    const numerator = unwrap(match[1]),
      denominator = unwrap(match[2]),
      precedingText = text.slice(0, index);
    parts.push(
      nested ? (
        <NestedFractionPower
          key={index}
          numerator={numerator}
          denominator={denominator}
          precedingText={precedingText}
          innerExponent={nested[1].replace(/^\(|\)$/gu, '')}
          outerExponent={nested[2].replace(/^\(|\)$/gu, '')}
        />
      ) : grouped ? (
        <ParenthesizedFraction
          key={index}
          numerator={numerator}
          denominator={denominator}
          precedingText={precedingText}
          exponent={exponent}
        />
      ) : (
        <Fraction
          key={index}
          n={numerator}
          d={denominator}
          precedingText={precedingText}
        />
      )
    );
    cursor = nested
      ? end + 1 + nested[0].length
      : end + (grouped ? 1 : 0) + (exponent ? exponent.length + 1 : 0);
  }
  parts.push(
    <Placeholders key={`text-${cursor}`}>{text.slice(cursor)}</Placeholders>
  );
  return <>{parts}</>;
}
