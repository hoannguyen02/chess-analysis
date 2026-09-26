import { useState } from 'react';
import { NumberPlacement } from './InteractiveLab';
import { EqualityWarmup } from './EqualityLab';
import { MathText } from './MathText';
import s from './InteractiveLab.module.css';

export default function FoundationWarmup({
  kind,
}: {
  kind: 'number-line' | 'powers' | 'equality';
}) {
  const [choice, setChoice] = useState<string | null>(null);
  if (kind === 'equality') return <EqualityWarmup />;
  if (kind === 'number-line') {
    return (
      <div className={s.lab}>
        <NumberPlacement round={0} warmup onComplete={() => {}} />
      </div>
    );
  }
  const correct = choice === '2^3';
  return (
    <div className={s.lab}>
      <h3>Viết gọn tích này</h3>
      <div className={s.workspace}>
        <div className={s.factors} aria-label="2 nhân 2 nhân 2">
          <span>2</span> × <span>2</span> × <span>2</span>
        </div>
        <p>Chọn cách viết lũy thừa của tích trên.</p>
        <div className={s.controls}>
          {['2^3', '3^2', '2 × 3'].map((answer) => (
            <button
              key={answer}
              type="button"
              aria-pressed={choice === answer}
              onClick={() => setChoice(answer)}
            >
              <MathText>{answer}</MathText>
            </button>
          ))}
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          choice ? `${s.feedback} ${correct ? s.success : ''}` : undefined
        }
      >
        {choice && (
          <>
            <strong className={s.feedbackTitle}>
              {correct ? 'Đúng rồi!' : 'Chưa đúng — thử lại nhé.'}
            </strong>
            <MathText>
              {correct
                ? '2 × 2 × 2 = 2^3, đọc là “hai mũ ba”. Cơ số 2 là thừa số được lặp lại; số mũ 3 cho biết có ba thừa số 2.'
                : choice === '3^2'
                  ? '3^2 là 3 × 3. Trong hình, thừa số được lặp lại là số nào? Có bao nhiêu thừa số đó?'
                  : '2 × 3 là cộng ba số 2, được 6. Tích trong hình là nhân ba số 2 với nhau. Hãy chọn cách viết có cơ số và số mũ.'}
            </MathText>
          </>
        )}
      </div>
    </div>
  );
}
