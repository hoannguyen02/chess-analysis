import { useState } from 'react';
import {
  ConceptLabKind,
  GROUP_ROUNDS,
  MIDPOINT_ROUNDS,
  PART_ROUNDS,
  RATIONAL_ROUNDS,
  groupResult,
  isMidpoint,
  partResult,
} from '@/lib/math/concept-labs';
import { MathText } from './MathText';
import s from './InteractiveLab.module.css';

type Props = { round: number; onComplete: () => void };
function Feedback({
  correct,
  children,
}: {
  correct: boolean;
  children: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${s.feedback} ${correct ? s.success : ''}`}
    >
      <MathText>{children}</MathText>
    </div>
  );
}
function Choices({
  values,
  selected,
  onChoose,
  unit = '',
}: {
  values: readonly number[];
  selected: number | null;
  onChoose: (n: number) => void;
  unit?: string;
}) {
  return (
    <div className={s.controls}>
      {values.map((n) => (
        <button
          type="button"
          key={n}
          aria-pressed={selected === n}
          onClick={() => onChoose(n)}
        >
          {n}
          {unit && ` ${unit}`}
        </button>
      ))}
    </div>
  );
}

function MissingParts({ round, onComplete }: Props) {
  const r = PART_ROUNDS[round];
  const [selected, setSelected] = useState<number | null>(null);
  const result = selected === null ? null : partResult(round, selected);
  const candidateWhole = r.unknown === 'whole' ? selected : r.whole;
  const candidatePart = r.unknown === 'part' ? selected : r.whole - r.known;
  return (
    <>
      <h3>Tìm phần còn thiếu</h3>
      <p>
        Chọn số điền vào ô trống. Sơ đồ sẽ thay đổi để em kiểm tra cả bộ và hai
        phần.
      </p>
      <div className={s.workspace}>
        <div className={s.expression}>
          <MathText>
            {r.expression.replace(
              '□',
              selected === null ? '□' : String(selected)
            )}
          </MathText>
        </div>
        <p>
          Cả bộ: <strong>{candidateWhole ?? '?'}</strong>
        </p>
        <div
          className={s.partBar}
          aria-label={`Một phần ${r.known}, phần kia ${candidatePart ?? 'chưa biết'}. Sơ đồ minh họa không theo tỉ lệ.`}
        >
          <span>{r.known}</span>
          <span>{candidatePart ?? '?'}</span>
        </div>
        <p className={s.note}>
          Hai phần ghép lại thành cả bộ. Sơ đồ không theo tỉ lệ.
        </p>
        {selected !== null && (
          <p>
            <MathText>{`${r.known} + ${candidatePart} = ${r.known + candidatePart!}`}</MathText>
          </p>
        )}
      </div>
      <Choices
        values={r.choices}
        selected={selected}
        onChoose={(n) => {
          setSelected(n);
          if (partResult(round, n).correct) onComplete();
        }}
      />
      {result && (
        <Feedback correct={result.correct}>
          {result.correct
            ? `Đúng! ${r.unknown === 'whole' ? `Tìm cả bộ: ${r.known} + ${r.whole - r.known} = ${selected}.` : `Tìm phần còn thiếu: ${r.whole} − ${r.known} = ${selected}.`} Thay số vào ô trống, hai vế bằng nhau.`
            : r.unknown === 'whole'
              ? `Cả bộ phải bằng tổng hai phần: ${r.known} và ${r.whole - r.known}. Số ${selected} đã bằng tổng đó chưa?`
              : `Với số em chọn, hai phần có tổng ${result.total}, nhưng cả bộ phải có ${r.whole}. Hãy chọn lại phần còn thiếu.`}
        </Feedback>
      )}
    </>
  );
}

function EqualGroups({ round, onComplete }: Props) {
  const r = GROUP_ROUNDS[round];
  const [selected, setSelected] = useState<number | null>(null);
  const result = selected === null ? null : groupResult(round, selected);
  const groups = result?.groups ?? r.groups;
  const size = result?.size ?? (r.unknown === 'size' ? 0 : r.size);
  return (
    <>
      <h3>Xưởng đóng hộp</h3>
      <p>
        {r.unknown === 'size'
          ? `Chia đều ${r.total} chiếc bút vào ${r.groups} hộp. Mỗi hộp có bao nhiêu chiếc?`
          : r.unknown === 'groups'
            ? `Có ${r.total} chiếc bút. Mỗi hộp đựng ${r.size} chiếc. Cần bao nhiêu hộp?`
            : `Có ${r.groups} hộp, mỗi hộp ${r.size} chiếc bút. Có tất cả bao nhiêu chiếc?`}
      </p>
      <div className={s.workspace}>
        {r.unknown !== 'groups' || selected !== null ? (
          <div className={s.trays}>
            {Array.from({ length: groups }, (_, i) => (
              <div className={s.tray} key={i}>
                <strong>Hộp {i + 1}</strong>
                <div className={s.objects} aria-hidden="true">
                  {Array.from({ length: size }, (_, j) => (
                    <span key={j} />
                  ))}
                </div>
                <p>{size || '?'} chiếc</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Mỗi hộp có {r.size} chiếc. Chọn số hộp để mở mô hình đóng gói.</p>
        )}
        {result && (
          <p>
            <MathText>{`${groups} × ${size} = ${result.total}`}</MathText> chiếc
            bút trong các hộp.
          </p>
        )}
      </div>
      <Choices
        values={r.choices}
        selected={selected}
        unit={r.unknown === 'groups' ? 'hộp' : 'chiếc'}
        onChoose={(n) => {
          setSelected(n);
          if (groupResult(round, n).correct) onComplete();
        }}
      />
      {result && (
        <Feedback correct={result.correct}>
          {result.correct
            ? `Đúng! ${groups} hộp × ${size} chiếc mỗi hộp = ${result.total} chiếc. ${r.unknown === 'groups' ? 'Em vừa tìm số hộp.' : r.unknown === 'size' ? 'Em vừa tìm số bút trong một hộp.' : 'Em vừa tìm tổng số bút.'}`
            : r.unknown === 'total'
              ? `Hãy đếm ${groups} nhóm, mỗi nhóm ${size} chiếc. Cần nhân số nhóm với số chiếc mỗi nhóm.`
              : `Cách đóng này cần ${result.total} chiếc, ${result.total > r.total ? 'nhiều hơn' : 'ít hơn'} ${r.total} chiếc đang có. Hãy đổi ${r.unknown === 'groups' ? 'số hộp' : 'số chiếc trong mỗi hộp'}.`}
        </Feedback>
      )}
    </>
  );
}

function Measurement({ round, onComplete }: Props) {
  const [amount, setAmount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const target = round === 1 ? 500 : 1000;
  if (round === 0)
    return (
      <>
        <h3>Đo từ vạch nào?</h3>
        <p>
          Bút bắt đầu ở vạch 2 cm và kết thúc ở vạch 8 cm. Chọn độ dài của bút.
        </p>
        <div className={s.workspace}>
          <div
            className={s.ruler}
            role="img"
            aria-label="Thước từ 0 đến 10 cm. Bút nằm từ vạch 2 đến vạch 8."
          >
            <div className={s.pencil} />
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} style={{ left: `${i * 10}%` }}>
                {i}
              </span>
            ))}
          </div>
          <p className={s.note}>
            Các số trên hình có đơn vị cm; hình không có kích thước thật.
          </p>
        </div>
        <Choices
          values={[8, 10, 6]}
          unit="cm"
          selected={selected}
          onChoose={(n) => {
            setSelected(n);
            if (n === 6) onComplete();
          }}
        />
        {selected !== null && (
          <Feedback correct={selected === 6}>
            {selected === 6
              ? 'Đúng! Độ dài bút là 8 − 2 = 6 (cm). Đo số khoảng giữa hai đầu bút.'
              : 'Vạch đầu của bút không ở 0. Lấy số ở vạch cuối trừ số ở vạch đầu, hoặc đếm số khoảng từ 2 đến 8.'}
          </Feedback>
        )}
      </>
    );
  const unit = round === 1 ? 'ml' : 'g';
  function change(delta: number) {
    const next = Math.max(0, Math.min(1200, amount + delta));
    setAmount(next);
    setTouched(true);
    if (next === target) onComplete();
  }
  return (
    <>
      <h3>{round === 1 ? 'Đong đúng lượng nước' : 'Ghép các quả cân'}</h3>
      <p>
        {round === 1
          ? 'Ca đang trống. Hãy đong đúng 500 ml nước; mỗi lần thêm hoặc bớt 100 ml.'
          : 'Hãy ghép các quả cân 100 g để được tổng khối lượng 1 kg. Nhớ: 1 kg = 1 000 g.'}
      </p>
      <div className={s.workspace}>
        {round === 1 ? (
          <div
            className={s.jug}
            role="img"
            aria-label={`Ca có ${amount} ml, mục tiêu 500 ml, sức chứa 1 200 ml.`}
          >
            <div
              className={s.water}
              style={{ height: `${(amount / 1200) * 100}%` }}
            />
            <div
              className={s.targetLine}
              style={{ bottom: `${(500 / 1200) * 100}%` }}
            >
              <span>500 ml</span>
            </div>
          </div>
        ) : (
          <div
            className={s.weights}
            aria-label={`${amount / 100} quả cân, mỗi quả 100 g`}
          >
            {Array.from({ length: amount / 100 }, (_, i) => (
              <span key={i}>100 g</span>
            ))}
            {!amount && <p>Chưa có quả cân</p>}
          </div>
        )}
        <p aria-live="polite">
          Hiện có:{' '}
          <strong>
            {amount} {unit}
          </strong>
        </p>
        <div className={s.controls}>
          <button
            type="button"
            disabled={amount === 0}
            onClick={() => change(-100)}
          >
            − 100 {unit}
          </button>
          <button
            type="button"
            disabled={amount === 1200}
            onClick={() => change(100)}
          >
            + 100 {unit}
          </button>
        </div>
      </div>
      {touched && (
        <Feedback correct={amount === target}>
          {amount === target
            ? `Đúng lượng cần tìm! ${round === 1 ? '5 lần 100 ml = 500 ml.' : '10 quả cân × 100 g = 1 000 g = 1 kg.'}`
            : amount < target
              ? `Còn thiếu ${target - amount} ${unit}. Em cần thêm bao nhiêu lần nữa?`
              : `Đã thừa ${amount - target} ${unit}. Hãy bớt để đúng lượng cần tìm.`}
        </Feedback>
      )}
    </>
  );
}

function Midpoint({ round, onComplete }: Props) {
  const r = MIDPOINT_ROUNDS[round];
  const [position, setPosition] = useState<number>(r.initial);
  const [onLine, setOnLine] = useState(!r.lifted);
  const [touched, setTouched] = useState(false);
  const correct = isMidpoint(r.length, position, onLine);
  function move(next: number, aligned = onLine) {
    setPosition(next);
    setOnLine(aligned);
    setTouched(true);
    if (isMidpoint(r.length, next, aligned)) onComplete();
  }
  return (
    <>
      <h3>Đặt M vào trung điểm</h3>
      <p>
        {r.lifted
          ? 'M cách đều A và B nhưng đang ở ngoài đoạn AB. Hãy đặt M thành trung điểm của AB.'
          : `AB dài ${r.length} cm. Chọn một vị trí cho M để AM và MB bằng nhau.`}
      </p>
      <div className={s.workspace}>
        <div
          className={s.segment}
          role="img"
          aria-label={`AB dài ${r.length} cm. ${onLine ? `M nằm trên AB, AM = ${position} cm, MB = ${r.length - position} cm.` : 'M nằm ngoài đường thẳng AB và cách đều A, B.'}`}
        >
          <span className={s.endpoint} style={{ left: 0 }}>
            A
          </span>
          <span className={s.endpoint} style={{ left: '100%' }}>
            B
          </span>
          <span
            className={s.midpoint}
            style={{
              left: `${(position / r.length) * 100}%`,
              bottom: onLine ? -7 : 60,
            }}
          >
            M
          </span>
        </div>
        <p>
          {onLine
            ? `AM = ${position} cm; MB = ${r.length - position} cm.`
            : 'MA = MB, nhưng M không nằm trên đoạn AB.'}
        </p>
        {onLine ? (
          <div className={s.controls}>
            {Array.from({ length: r.length - 1 }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                aria-pressed={position === n}
                aria-label={`Đặt M cách A ${n} cm`}
                onClick={() => move(n)}
              >
                {n} cm
              </button>
            ))}
          </div>
        ) : (
          <div className={s.controls}>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
              }}
            >
              Giữ M ở ngoài đoạn AB
            </button>
            <button type="button" onClick={() => move(r.length / 2, true)}>
              Đặt M lên đoạn AB, vẫn cách đều A và B
            </button>
          </div>
        )}
      </div>
      {touched && (
        <Feedback correct={correct}>
          {correct
            ? `M nằm giữa A và B; AM = MB = ${r.length / 2} cm. Đủ hai điều kiện, M là trung điểm của AB.`
            : !onLine
              ? 'Cách đều hai đầu chưa đủ. Trung điểm phải nằm trên đoạn AB. Hãy đưa M lên đoạn AB.'
              : `M đã ở giữa A và B, nhưng ${position} cm khác ${r.length - position} cm. Hãy chọn vị trí để hai đoạn bằng nhau.`}
        </Feedback>
      )}
    </>
  );
}

function Rational({ round, onComplete }: Props) {
  const r = RATIONAL_ROUNDS[round];
  const [selected, setSelected] = useState<number | null>(null);
  const comparing = round === 1;
  // Keep the labelled interval inside the axis so 0 is separate from its arrow.
  const left = (value: number) =>
    `${(comparing ? 0.1 + (value + 1) * 0.8 : (value + 1.5) / 3) * 100}%`;
  const ticks = comparing
    ? Array.from({ length: 13 }, (_, i) => -1 + i / 12)
    : [-1, 0, 1];
  return (
    <>
      <h3>Cùng quan sát trục số</h3>
      <p>
        <MathText>{r.prompt}</MathText>
      </p>
      <div className={s.workspace}>
        {comparing && (
          <>
            <h4>1. Quy đồng mẫu số về 12</h4>
            <p>
              <MathText>{'-2/3 = (-2 × 4)/(3 × 4) = -8/12'}</MathText>
            </p>
            <p>
              <MathText>{'-3/4 = (-3 × 3)/(4 × 3) = -9/12'}</MathText>
            </p>
            <h4>2. So sánh trên trục số</h4>
            <p>
              <MathText>
                {
                  'Đoạn từ -1 đến 0 được chia thành 12 khoảng bằng nhau. Mỗi khoảng dài 1/12. Số nằm bên phải là số lớn hơn.'
                }
              </MathText>
            </p>
          </>
        )}
        <div
          className={s.rationalAxis}
          role="img"
          aria-label={
            comparing
              ? 'Trục số từ -1 đến 0, chia thành 12 khoảng bằng nhau. -3/4 = -9/12; -2/3 = -8/12 nằm bên phải -9/12.'
              : `Trục số từ -1,5 đến 1,5. ${r.referenceLabel} ${r.referenceText}.${selected === null ? '' : ` ${r.selectedLabel} ${r.choices[selected]}.`}`
          }
        >
          <div className={s.rail} />
          {ticks.map((n) => (
            <span key={n} className={s.tick} style={{ left: left(n) }}>
              {(!comparing || n === -1 || n === 0) && <span>{n}</span>}
            </span>
          ))}
          <span
            className={s.referencePoint}
            data-selected={comparing ? selected === 1 : undefined}
            style={{ left: left(r.reference) }}
          >
            {!comparing && <span>{r.referenceLabel}</span>}
            <span>
              <MathText>
                {comparing ? '-3/4 = -9/12' : r.referenceText}
              </MathText>
            </span>
          </span>
          {(comparing || selected !== null) && (
            <span
              className={`${s.candidatePoint} ${comparing ? s.comparisonPoint : ''}`}
              data-selected={comparing ? selected === 0 : undefined}
              style={{ left: left(comparing ? -2 / 3 : r.values[selected!]) }}
            >
              {!comparing && <span>{r.selectedLabel}</span>}
              <span>
                <MathText>
                  {comparing ? '-2/3 = -8/12' : r.choices[selected!]}
                </MathText>
              </span>
            </span>
          )}
        </div>
      </div>
      <div className={s.controls}>
        {r.choices.map((choice, i) => (
          <button
            type="button"
            key={choice}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              if (choice === r.answer) onComplete();
            }}
          >
            <MathText>{choice}</MathText>
          </button>
        ))}
      </div>
      {selected !== null && (
        <Feedback correct={r.choices[selected] === r.answer}>
          {r.choices[selected] === r.answer ? r.success : r.hint}
        </Feedback>
      )}
    </>
  );
}

export default function ConceptLab({
  kind,
  ...props
}: Props & { kind: ConceptLabKind }) {
  if (kind === 'missing-parts') return <MissingParts {...props} />;
  if (kind === 'equal-groups') return <EqualGroups {...props} />;
  if (kind === 'measurement') return <Measurement {...props} />;
  if (kind === 'midpoint') return <Midpoint {...props} />;
  return <Rational {...props} />;
}
