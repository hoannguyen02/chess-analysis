import {
  EXTRA_GROUPS,
  MathBlock,
  MathExercise,
  MathLessonData,
  MathSection,
  SECTION_LABELS,
  TOPICS,
  blankBlock,
  blankExercise,
} from '@/lib/math/lessons';
import { MathText } from './MathText';
import {
  getKnowledgeSummary,
  withKnowledgeSummary,
} from '@/lib/math/knowledge-summary';
import s from './MathStudio.module.css';
export type MathEditTarget =
  | { metadata: true }
  | { block: string }
  | { exercise: string };
export default function LessonEditor({
  draft,
  onChange,
  onSave,
  onPreview,
  onCancel,
  focus,
}: {
  draft: MathLessonData;
  onChange: (draft: MathLessonData) => void;
  onSave: () => void;
  onPreview?: () => void;
  focus?: MathEditTarget;
  onCancel: () => void;
}) {
  const update = (patch: Partial<MathLessonData>) =>
    onChange({ ...withKnowledgeSummary(draft), ...patch });
  const block = (id: string, patch: Partial<MathBlock>) =>
    update({
      blocks: draft.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  const exercise = (id: string, patch: Partial<MathExercise>) =>
    update({
      exercises: draft.exercises.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className={s.toolbar}>
        <h1>Soạn bài học</h1>
        <div className={s.actions}>
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
          {onPreview && (
            <button type="button" onClick={onPreview}>
              Xem như học sinh
            </button>
          )}
          <button className={s.primary}>Lưu bài học</button>
        </div>
      </div>
      <p className={s.muted}>
        Lưu trên trình duyệt này. Xuất JSON để sao lưu. Nội dung chỉ được lưu
        khi chọn “Lưu bài học”.
      </p>
      {(!focus || 'metadata' in focus) && (
        <section className={s.panel}>
          <h2>Thông tin bài học</h2>
          <div className={s.grid}>
            <label>
              Tên bài
              <input
                required
                maxLength={200}
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </label>
            <label>
              Lớp
              <select
                value={draft.grade}
                onChange={(e) => update({ grade: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Lớp {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chủ đề
              <input
                list="math-topics"
                required
                maxLength={100}
                value={draft.topic}
                onChange={(e) => update({ topic: e.target.value })}
              />
              <datalist id="math-topics">
                {TOPICS.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </datalist>
            </label>
            <label>
              Mục tiêu
              <input
                required
                maxLength={1000}
                value={draft.goal}
                onChange={(e) => update({ goal: e.target.value })}
              />
            </label>
            <label>
              Tham chiếu sách
              <textarea
                maxLength={1000}
                value={draft.textbook}
                onChange={(e) => update({ textbook: e.target.value })}
                placeholder="Bộ sách, ấn bản, tập, bài, trang đã xác minh"
              />
            </label>
            <label>
              Ghi chú riêng cho giáo viên
              <textarea
                maxLength={4000}
                value={draft.teacherNotes}
                onChange={(e) => update({ teacherNotes: e.target.value })}
              />
              <small>
                Không đưa vào liên kết học sinh; có trong bản sao lưu.
              </small>
            </label>
          </div>
          <label>
            Kiến thức cần nhớ (đầu phiếu bài tập PDF)
            <textarea
              rows={8}
              maxLength={4000}
              value={getKnowledgeSummary(draft)}
              onChange={(event) =>
                update({ knowledgeSummary: event.target.value })
              }
              placeholder="Các quy tắc, công thức chính; một ví dụ ngắn; lỗi cần tránh."
            />
            <small>
              Gợi ý khoảng nửa trang, mỗi ý một dòng. Dùng ví dụ khác bài tập;
              không đưa đáp án vào đây. Có thể viết phân số như 1/2. Để trống
              nếu không cần; phần này không in trong PDF lời giải.
            </small>
          </label>
          {getKnowledgeSummary(draft).trim() && (
            <div className={s.mathPreview}>
              <MathText>{getKnowledgeSummary(draft)}</MathText>
            </div>
          )}
        </section>
      )}
      {!focus && (
        <>
          <div className={s.toolbar}>
            <h2>Các phần giảng</h2>
            <button
              type="button"
              disabled={draft.blocks.length >= 50}
              onClick={() =>
                update({ blocks: [...draft.blocks, blankBlock()] })
              }
            >
              + Thêm phần giảng
            </button>
          </div>
          <p className={s.muted}>
            Nhập phân số như 1/2 hoặc (1 × 3)/(2 × 3); học sinh sẽ thấy dạng xếp
            dọc. Các phần cùng nhóm xuất hiện theo thứ tự bên dưới.
          </p>
        </>
      )}
      {draft.blocks.map(
        (b, index) =>
          (!focus || ('block' in focus && focus.block === b.id)) && (
            <details className={s.panel} key={b.id} open>
              <summary>
                {index + 1}. {b.title || 'Phần giảng mới'}
              </summary>
              <div className={s.grid}>
                <label>
                  Nhóm bài học
                  <select
                    value={b.section}
                    onChange={(e) =>
                      block(b.id, { section: e.target.value as MathSection })
                    }
                  >
                    {Object.entries(SECTION_LABELS)
                      .filter(([value]) => value !== 'extra')
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Tiêu đề
                  <input
                    required
                    maxLength={200}
                    value={b.title}
                    onChange={(e) => block(b.id, { title: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Nội dung
                <textarea
                  rows={4}
                  maxLength={8000}
                  value={b.text}
                  onChange={(e) => block(b.id, { text: e.target.value })}
                />
              </label>
              {b.text && (
                <div className={s.mathPreview}>
                  <MathText>{b.text}</MathText>
                </div>
              )}
              <div className={s.grid}>
                <label>
                  Hình minh họa
                  <select
                    value={b.visual}
                    onChange={(e) =>
                      block(b.id, {
                        visual: e.target.value as MathBlock['visual'],
                        values:
                          e.target.value === 'fractions'
                            ? [1, 2, 1, 3]
                            : e.target.value === 'rectangle'
                              ? [8, 5]
                              : [],
                      })
                    }
                  >
                    <option value="none">Không có</option>
                    <option value="fractions">Hai thanh phân số</option>
                    <option value="rectangle">Hình chữ nhật (cm)</option>
                  </select>
                </label>
                {b.values.map((value, i) => (
                  <label key={i}>
                    {b.visual === 'rectangle'
                      ? ['Chiều dài', 'Chiều rộng'][i]
                      : [
                          'Tử số thứ nhất',
                          'Mẫu số thứ nhất',
                          'Tử số thứ hai',
                          'Mẫu số thứ hai',
                        ][i]}
                    <input
                      type="number"
                      min={b.visual === 'rectangle' || i % 2 ? 1 : 0}
                      max={b.visual === 'fractions' ? 24 : 1000}
                      step={b.visual === 'rectangle' ? 'any' : 1}
                      required
                      value={value}
                      onChange={(e) =>
                        block(b.id, {
                          values: b.values.map((old, at) =>
                            at === i ? Number(e.target.value) : old
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className={s.actions}>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const items = [...draft.blocks];
                    [items[index - 1], items[index]] = [
                      items[index],
                      items[index - 1],
                    ];
                    update({ blocks: items });
                  }}
                >
                  ↑ Di chuyển lên
                </button>
                <button
                  type="button"
                  disabled={index === draft.blocks.length - 1}
                  onClick={() => {
                    const items = [...draft.blocks];
                    [items[index + 1], items[index]] = [
                      items[index],
                      items[index + 1],
                    ];
                    update({ blocks: items });
                  }}
                >
                  ↓ Di chuyển xuống
                </button>
                <button
                  type="button"
                  className={s.danger}
                  onClick={() =>
                    update({
                      blocks: draft.blocks.filter((item) => item.id !== b.id),
                    })
                  }
                >
                  Xóa phần
                </button>
              </div>
            </details>
          )
      )}
      {!focus && (
        <>
          <div className={s.toolbar}>
            <h2>Bài tập</h2>
            <button
              type="button"
              disabled={draft.exercises.length >= 100}
              onClick={() =>
                update({ exercises: [...draft.exercises, blankExercise()] })
              }
            >
              + Thêm bài tập
            </button>
          </div>
          <section className={s.panel}>
            <h2>Luyện tập thêm</h2>
            <p>
              Bộ bài tập riêng để học từng câu hoặc tải PDF. Gợi ý khoảng 20
              câu: 4 nền tảng, 8 kỹ năng, 6 vận dụng, 2 thử thách.
            </p>
            <p>
              {Object.entries(EXTRA_GROUPS)
                .map(
                  ([key, label]) =>
                    `${label}: ${draft.exercises.filter((e) => e.section === 'extra' && (e.group || 'skills') === key).length}`
                )
                .join(' · ')}
            </p>
            <button
              type="button"
              disabled={draft.exercises.length >= 100}
              onClick={() =>
                update({
                  exercises: [
                    ...draft.exercises,
                    {
                      ...blankExercise(),
                      section: 'extra',
                      group: 'skills',
                      difficulty: 'medium',
                      workspace: 'medium',
                    },
                  ],
                })
              }
            >
              + Thêm câu luyện tập thêm
            </button>
          </section>
        </>
      )}
      {draft.exercises.map(
        (e, index) =>
          (!focus || ('exercise' in focus && focus.exercise === e.id)) && (
            <details className={s.panel} key={e.id} open>
              <summary>
                {index + 1}. {e.prompt || 'Bài tập mới'}
              </summary>
              <div className={s.grid}>
                <label>
                  Phần luyện tập
                  <select
                    value={e.section}
                    onChange={(event) =>
                      exercise(e.id, {
                        section: event.target.value as MathExercise['section'],
                        ...(event.target.value !== 'extra' &&
                        e.kind === 'written'
                          ? { kind: 'number' as const, answer: '' }
                          : {}),
                      })
                    }
                  >
                    {(
                      ['foundation', 'guided', 'practice', 'extra'] as const
                    ).map((section) => (
                      <option key={section} value={section}>
                        {SECTION_LABELS[section]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Loại đáp án
                  <select
                    value={e.kind}
                    onChange={(event) =>
                      exercise(e.id, {
                        kind: event.target.value as MathExercise['kind'],
                        answer:
                          event.target.value === 'written'
                            ? 'Lời giải mẫu'
                            : '',
                        criteria:
                          event.target.value === 'written'
                            ? ['Trình bày đủ các bước giải.']
                            : undefined,
                        options:
                          event.target.value === 'choice'
                            ? ['Lựa chọn A', 'Lựa chọn B']
                            : [],
                        unit: '',
                        simplified: false,
                        tolerance: 0,
                      })
                    }
                  >
                    <option value="number">Số</option>
                    <option value="fraction">Phân số</option>
                    <option value="choice">Trắc nghiệm</option>
                    {e.section === 'extra' && (
                      <option value="written">Tự luận / giải thích</option>
                    )}
                  </select>
                </label>
              </div>
              {e.section === 'extra' && (
                <div className={s.grid}>
                  <label>
                    Nhóm kỹ năng
                    <select
                      value={e.group || 'skills'}
                      onChange={(event) =>
                        exercise(e.id, {
                          group: event.target.value as MathExercise['group'],
                        })
                      }
                    >
                      {Object.entries(EXTRA_GROUPS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Kỹ năng cần luyện
                    <input
                      maxLength={150}
                      value={e.skill || ''}
                      onChange={(event) =>
                        exercise(e.id, { skill: event.target.value })
                      }
                      placeholder="Ví dụ: quy đồng mẫu số"
                    />
                  </label>
                  <label>
                    Độ khó
                    <select
                      value={e.difficulty || 'medium'}
                      onChange={(event) =>
                        exercise(e.id, {
                          difficulty: event.target
                            .value as MathExercise['difficulty'],
                        })
                      }
                    >
                      <option value="easy">Cơ bản</option>
                      <option value="medium">Vừa</option>
                      <option value="hard">Nâng cao</option>
                    </select>
                  </label>
                  {e.kind !== 'choice' && (
                    <label>
                      Chỗ làm bài trong PDF
                      <select
                        value={e.workspace || 'medium'}
                        onChange={(event) =>
                          exercise(e.id, {
                            workspace: event.target
                              .value as MathExercise['workspace'],
                          })
                        }
                      >
                        <option value="small">Ít — 2 dòng</option>
                        <option value="medium">Vừa — 4 dòng</option>
                        <option value="large">Nhiều — 6 dòng</option>
                      </select>
                    </label>
                  )}
                  {e.kind === 'written' && (
                    <label>
                      Tiêu chí tự đánh giá (mỗi dòng một ý)
                      <textarea
                        required
                        value={(e.criteria || []).join('\n')}
                        onChange={(event) =>
                          exercise(e.id, {
                            criteria: event.target.value.split('\n'),
                          })
                        }
                      />
                    </label>
                  )}
                </div>
              )}
              <label>
                Câu hỏi (nội dung in trên PDF)
                <textarea
                  required
                  maxLength={2000}
                  value={e.prompt}
                  onChange={(event) =>
                    exercise(e.id, { prompt: event.target.value })
                  }
                />
              </label>
              <div className={s.mathPreview}>
                <MathText>{e.prompt}</MathText>
              </div>
              <label>
                Hướng dẫn nhập đáp án (chỉ hiện trên web)
                <textarea
                  maxLength={1000}
                  value={e.inputInstruction || ''}
                  placeholder="Ví dụ: Nhập tử số và mẫu số vào hai ô."
                  onChange={(event) =>
                    exercise(e.id, { inputInstruction: event.target.value })
                  }
                />
                <small>
                  Không in trên phiếu bài tập hoặc lời giải PDF. Các yêu cầu
                  toán học như tối giản phân số cần ghi trong câu hỏi.
                </small>
              </label>
              <div className={s.grid}>
                {e.kind === 'choice' && (
                  <label>
                    Các lựa chọn (mỗi dòng một lựa chọn)
                    <textarea
                      rows={4}
                      value={e.options.join('\n')}
                      onChange={(event) =>
                        exercise(e.id, {
                          options: event.target.value.split('\n'),
                        })
                      }
                    />
                  </label>
                )}
                <label>
                  {e.kind === 'written'
                    ? 'Nhãn đáp án (lời giải chi tiết bên dưới)'
                    : 'Đáp án đúng'}
                  <input
                    required
                    maxLength={500}
                    value={e.answer}
                    placeholder={
                      e.kind === 'fraction'
                        ? 'Ví dụ: 5/6'
                        : e.kind === 'choice'
                          ? 'Khớp chính xác một lựa chọn'
                          : 'Ví dụ: 24'
                    }
                    onChange={(event) =>
                      exercise(e.id, { answer: event.target.value })
                    }
                  />
                </label>
                {e.kind !== 'choice' && e.kind !== 'written' && (
                  <label>
                    Đơn vị bắt buộc (nếu có)
                    <input
                      maxLength={40}
                      value={e.unit}
                      onChange={(event) =>
                        exercise(e.id, { unit: event.target.value })
                      }
                      placeholder="cm, cm²…"
                    />
                  </label>
                )}
                {e.kind === 'number' && (
                  <label>
                    Sai số cho phép
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="1000"
                      required
                      value={e.tolerance}
                      onChange={(event) =>
                        exercise(e.id, {
                          tolerance: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                )}
                {e.kind === 'fraction' && (
                  <label className={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={e.simplified}
                      onChange={(event) =>
                        exercise(e.id, { simplified: event.target.checked })
                      }
                    />
                    Yêu cầu phân số tối giản
                  </label>
                )}
                <label>
                  Gợi ý
                  <textarea
                    maxLength={4000}
                    value={e.hint}
                    onChange={(event) =>
                      exercise(e.id, { hint: event.target.value })
                    }
                  />
                </label>
                <label>
                  Lời giải sau khi kiểm tra
                  <textarea
                    required
                    rows={3}
                    maxLength={8000}
                    value={e.solution}
                    onChange={(event) =>
                      exercise(e.id, { solution: event.target.value })
                    }
                  />
                </label>
              </div>
              <h3>Lỗi thường gặp</h3>
              {e.mistakes.map((mistake, i) => (
                <div className={s.grid} key={i}>
                  <label>
                    Đáp án sai
                    <input
                      required
                      maxLength={500}
                      value={mistake.answer}
                      onChange={(event) =>
                        exercise(e.id, {
                          mistakes: e.mistakes.map((m, j) =>
                            j === i ? { ...m, answer: event.target.value } : m
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Giải thích lỗi
                    <input
                      required
                      maxLength={2000}
                      value={mistake.feedback}
                      onChange={(event) =>
                        exercise(e.id, {
                          mistakes: e.mistakes.map((m, j) =>
                            j === i ? { ...m, feedback: event.target.value } : m
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      exercise(e.id, {
                        mistakes: e.mistakes.filter((_, j) => i !== j),
                      })
                    }
                  >
                    Bỏ lỗi này
                  </button>
                </div>
              ))}
              <div className={s.actions}>
                <button
                  type="button"
                  disabled={e.mistakes.length >= 10}
                  onClick={() =>
                    exercise(e.id, {
                      mistakes: [...e.mistakes, { answer: '', feedback: '' }],
                    })
                  }
                >
                  + Thêm lỗi thường gặp
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const items = [...draft.exercises];
                    [items[index - 1], items[index]] = [
                      items[index],
                      items[index - 1],
                    ];
                    update({ exercises: items });
                  }}
                >
                  ↑ Di chuyển lên
                </button>
                <button
                  type="button"
                  className={s.danger}
                  onClick={() =>
                    update({
                      exercises: draft.exercises.filter(
                        (item) => item.id !== e.id
                      ),
                    })
                  }
                >
                  Xóa bài tập
                </button>
              </div>
            </details>
          )
      )}
      <div className={s.actions}>
        <button className={s.primary}>Lưu bài học</button>
        {onPreview && (
          <button type="button" onClick={onPreview}>
            Xem như học sinh
          </button>
        )}
      </div>
    </form>
  );
}
