import { useEffect, useRef, useState } from 'react';
import { MathLessonData, packLessons, parseMathPack } from '@/lib/math/lessons';
import LessonEditor, { MathEditTarget } from './LessonEditor';
import s from './MathStudio.module.css';

export default function QuickLessonEdit({
  lesson,
  target,
  onSave,
  onClose,
}: {
  lesson: MathLessonData;
  target?: MathEditTarget;
  onSave: (lesson: MathLessonData) => boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(lesson));
  const [full, setFull] = useState(!target);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const original = useRef(JSON.stringify(lesson));
  const dirty = JSON.stringify(draft) !== original.current;
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function close() {
    if (!dirty || window.confirm('Bỏ các thay đổi chưa lưu?')) onClose();
  }
  function save() {
    try {
      const valid = parseMathPack(packLessons([draft])).lessons[0];
      if (!onSave(valid)) {
        setError(
          'Không lưu được bài học. Bản chỉnh sửa vẫn được giữ ở đây; hãy thử lại.'
        );
        return;
      }
      onClose();
    } catch (error) {
      setError((error as Error).message);
      dialog.current?.scrollTo({ top: 0 });
    }
  }
  return (
    <dialog
      ref={dialog}
      className={`${s.studio} ${s.quickEditPanel}`}
      aria-label="Sửa nhanh bài học"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className={s.toolbar}>
        <h2>Sửa nhanh</h2>
        <button type="button" onClick={close} aria-label="Đóng sửa nhanh">
          Đóng
        </button>
      </div>
      <p className={s.muted}>
        Thay đổi chỉ được lưu khi bấm Lưu bài học. Liên kết đã chia sẻ giữ nội
        dung cũ.
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {target && (
        <button type="button" onClick={() => setFull(!full)}>
          {full ? 'Chỉ sửa mục đã chọn' : 'Mở toàn bộ bài học'}
        </button>
      )}
      <LessonEditor
        draft={draft}
        onChange={setDraft}
        onSave={save}
        onCancel={close}
        focus={full ? undefined : target}
      />
    </dialog>
  );
}
