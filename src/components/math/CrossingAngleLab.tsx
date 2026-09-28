import { useState } from 'react';
import CrossingAngleDiagram from './CrossingAngleDiagram';
import { MathText } from './MathText';
import s from './InteractiveLab.module.css';

export default function CrossingAngleLab({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const opposite = round === 4;
  const answer = opposite ? 65 : 115;
  const name = opposite ? "x'Oy'" : "x'Oy";
  const correct = choice === answer;
  return (
    <>
      <h2>{opposite ? 'Hai góc đối đỉnh' : 'Hai góc kề bù'}</h2>
      <p>
        <MathText>{`Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = 65°. Tính góc ${name}.`}</MathText>
      </p>
      <CrossingAngleDiagram
        angle={65}
        target={opposite ? 'opposite' : 'adjacent'}
        reveal={correct}
      />
      <div className={s.controls}>
        {[65, 115, 180].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={choice === value}
            onClick={() => {
              setChoice(value);
              if (value === answer) onComplete();
            }}
          >
            {value}°
          </button>
        ))}
      </div>
      {choice !== null && (
        <div
          role="status"
          className={`${s.feedback} ${correct ? s.success : ''}`}
        >
          <strong>{correct ? 'Đúng rồi!' : 'Chưa đúng — thử lại nhé.'}</strong>
          <p>
            <MathText>
              {correct
                ? opposite
                  ? "Góc x'Oy' = góc xOy = 65° vì hai góc đối đỉnh."
                  : "Góc x'Oy + góc xOy = 180° vì hai góc kề bù. Góc x'Oy = 180° − 65° = 115°."
                : opposite
                  ? 'Ox và Ox′ là hai tia đối nhau; Oy và Oy′ cũng là hai tia đối nhau. Hai góc đối đỉnh có số đo bằng nhau.'
                  : 'Hai góc có cạnh chung Oy; hai cạnh còn lại Ox và Ox′ là hai tia đối nhau. Tổng hai góc bằng 180°.'}
            </MathText>
          </p>
        </div>
      )}
    </>
  );
}
