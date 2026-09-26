import { useState } from 'react';
import type { EqualityExample as Example } from '@/lib/math/equality-examples';
import { MathText } from './MathText';
import s from './EqualityExample.module.css';

export default function EqualityExample({
  example,
  onComplete,
}: {
  example: Example;
  onComplete: () => void;
}) {
  const [visible, setVisible] = useState(1);
  const [clean, setClean] = useState(false);
  const done = visible === example.rows.length;
  return (
    <div>
      <p>
        Tìm x: <MathText>{example.rows[0].equation}</MathText>.
      </p>
      <div className={s.solution} aria-label="Lời giải từng bước">
        {example.rows.slice(0, visible).map((row, index) => {
          const highlight =
            !clean && index === visible - 1 ? row.highlight : undefined;
          const offset = highlight ? row.equation.indexOf(highlight) : -1;
          return (
            <div key={index} className={`${s.row} ${clean ? s.clean : ''}`}>
              <div className={s.equation}>
                {highlight && offset >= 0 ? (
                  <>
                    <MathText>{row.equation.slice(0, offset)}</MathText>
                    <mark>
                      <MathText>{highlight}</MathText>
                    </mark>
                    <MathText>
                      {row.equation.slice(offset + highlight.length)}
                    </MathText>
                  </>
                ) : (
                  <MathText>{row.equation}</MathText>
                )}
              </div>
              {!clean && (
                <div className={s.explanation}>
                  <MathText>{row.explanation}</MathText>
                  {row.why && (
                    <details>
                      <summary>Vì sao làm như vậy?</summary>
                      <p>
                        <MathText>{row.why}</MathText>
                      </p>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className={s.status} role="status">
        Đã xem {visible}/{example.rows.length} dòng lời giải.
      </p>
      {!done && (
        <button
          type="button"
          onClick={() => {
            const next = visible + 1;
            setVisible(next);
            if (next === example.rows.length) onComplete();
          }}
        >
          Xem bước tiếp theo →
        </button>
      )}
      {done && (
        <>
          {!clean && (
            <p className={s.check}>
              <strong>Thử lại: </strong>
              <MathText>{example.check}</MathText>
            </p>
          )}
          <button
            type="button"
            aria-pressed={clean}
            onClick={() => setClean(!clean)}
          >
            {clean ? 'Xem giải thích từng bước' : 'Xem cách trình bày'}
          </button>
        </>
      )}
    </div>
  );
}
