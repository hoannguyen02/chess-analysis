import { checkAnswer, MathExercise } from '@/lib/math/lessons';
import { useEffect, useRef, useState } from 'react';
import s from './MathLesson.module.css';
import { MathText } from './MathText';
import SegmentDiagram from './SegmentDiagram';
export type Result = {
  answer: string;
  unit: string;
  assisted: boolean;
  solved: boolean;
  attempted?: boolean;
};
export default function Exercise({
  exercise,
  result,
  onChange,
}: {
  exercise: MathExercise;
  result?: Result;
  onChange: (result: Result) => void;
}) {
  const [answer, setAnswer] = useState(result?.answer || '');
  const [denominator, setDenominator] = useState(
    result?.answer.split('/')[1] || ''
  );
  const [unit, setUnit] = useState(result?.unit || '');
  const [message, setMessage] = useState('');
  const [incorrect, setIncorrect] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const solved = !!result?.solved;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);
  function cancelCheck() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    []
  );
  const rawAnswer =
    exercise.kind === 'fraction'
      ? `${answer.split('/')[0]}/${denominator}`
      : answer;
  function saveDraft(value: string, nextUnit = unit) {
    cancelCheck();
    setIncorrect(false);
    setMessage('');
    if (!composing.current)
      timer.current = setTimeout(() => check(value, nextUnit), 800);
    onChange({
      answer: value,
      unit: nextUnit,
      assisted: !!result?.assisted,
      solved: false,
      attempted: result?.attempted,
    });
  }
  function check(value = rawAnswer, nextUnit = unit) {
    cancelCheck();
    if (
      composing.current ||
      solved ||
      !value.trim() ||
      (exercise.unit && !nextUnit.trim())
    )
      return;
    if (
      exercise.kind === 'fraction' &&
      value.split('/').some((part) => !part.trim())
    )
      return;
    const checked = checkAnswer(exercise, value, nextUnit);
    setIncorrect(!checked.correct);
    setMessage(checked.correct ? '' : checked.message);
    onChange({
      answer: value,
      unit: nextUnit,
      assisted: !!result?.assisted || !checked.correct,
      solved: checked.correct,
      attempted: true,
    });
  }
  function help(solution: boolean) {
    cancelCheck();
    onChange({
      answer: rawAnswer,
      unit,
      assisted: true,
      solved: false,
      attempted: result?.attempted,
    });
    setIncorrect(false);
    setShowSolution(solution);
    setMessage(
      solution
        ? exercise.solution
        : exercise.hint || 'Xem lại ví dụ từng bước trước khi trả lời.'
    );
  }
  const label = (part: string) => `${exercise.id}-${part}`;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        check();
      }}
      className={s.question}
    >
      <h3>
        <MathText>{exercise.prompt}</MathText>
      </h3>
      {exercise.segment && (
        <SegmentDiagram
          values={exercise.segment}
          labels={exercise.segmentLabels}
        />
      )}
      {exercise.inputInstruction && (
        <p id={label('instruction')} className={s.footer}>
          <MathText>{exercise.inputInstruction}</MathText>
        </p>
      )}
      {exercise.kind === 'choice' ? (
        <div className={s.actions}>
          {exercise.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={solved}
              aria-pressed={answer === option}
              aria-describedby={
                exercise.inputInstruction ? label('instruction') : undefined
              }
              onClick={() => {
                setAnswer(option);
                check(option);
              }}
            >
              <MathText>{option}</MathText>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={s.inputs}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              check();
            }
          }}
          onCompositionStart={() => {
            composing.current = true;
            cancelCheck();
          }}
          onCompositionEnd={() => {
            composing.current = false;
            saveDraft(rawAnswer, unit);
          }}
        >
          <span>Kết quả =</span>
          <div className={exercise.kind === 'fraction' ? s.fractionInput : ''}>
            <label htmlFor={label('answer')}>
              {exercise.kind === 'fraction' ? 'Tử số' : 'Đáp án'}
              <input
                id={label('answer')}
                aria-describedby={
                  exercise.inputInstruction ? label('instruction') : undefined
                }
                required
                disabled={solved}
                inputMode={exercise.kind === 'fraction' ? 'numeric' : 'decimal'}
                value={
                  exercise.kind === 'fraction' ? answer.split('/')[0] : answer
                }
                onChange={(e) => {
                  setAnswer(e.target.value);
                  saveDraft(
                    exercise.kind === 'fraction'
                      ? `${e.target.value}/${denominator}`
                      : e.target.value
                  );
                }}
                maxLength={500}
              />
            </label>
            {exercise.kind === 'fraction' && (
              <>
                <span className={s.inputDivider} />
                <label htmlFor={label('denominator')}>
                  Mẫu số
                  <input
                    id={label('denominator')}
                    aria-describedby={
                      exercise.inputInstruction
                        ? label('instruction')
                        : undefined
                    }
                    inputMode="numeric"
                    required
                    disabled={solved}
                    value={denominator}
                    onChange={(e) => {
                      setDenominator(e.target.value);
                      saveDraft(`${answer.split('/')[0]}/${e.target.value}`);
                    }}
                    maxLength={100}
                  />
                </label>
              </>
            )}
          </div>
          {exercise.unit && (
            <label htmlFor={label('unit')}>
              Đơn vị
              <input
                id={label('unit')}
                required
                disabled={solved}
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  saveDraft(rawAnswer, e.target.value);
                }}
                maxLength={40}
              />
              <small>Ví dụ: {exercise.unit}</small>
            </label>
          )}
        </div>
      )}
      {exercise.kind !== 'choice' && (
        <p className={s.footer}>
          Kết quả tự hiện sau khi em ngừng nhập 0,8 giây. Điền đủ tử số, mẫu số
          và đơn vị nếu có; nhấn Enter để kiểm tra ngay.
        </p>
      )}
      {exercise.kind === 'fraction' && exercise.simplified && (
        <p>Viết kết quả dưới dạng tối giản.</p>
      )}
      <div className={s.actions}>
        <button type="button" disabled={solved} onClick={() => help(false)}>
          Gợi ý
        </button>
        <button
          type="button"
          disabled={solved || showSolution}
          onClick={() => help(true)}
        >
          Xem lời giải
        </button>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={solved ? s.success : message ? s.feedback : undefined}
      >
        {solved ? (
          <>
            <strong>Đúng rồi! Em làm tốt lắm!</strong>
            <p>Lời giải</p>
            <div className={s.prose}>
              <MathText>{exercise.solution}</MathText>
            </div>
          </>
        ) : message ? (
          <>
            {incorrect && (
              <p>
                <strong>
                  Chưa đúng lần này, không sao cả! Em thử lại nhé.
                </strong>
              </p>
            )}
            {showSolution ? (
              <div className={s.prose}>
                <MathText>{message}</MathText>
              </div>
            ) : (
              <MathText>{message}</MathText>
            )}
          </>
        ) : null}
      </div>
    </form>
  );
}
