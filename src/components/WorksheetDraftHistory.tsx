import {
  type WorksheetVersion,
  type WorksheetDraftChoices,
  type WorksheetExportRecord,
} from '@/lib/chess/worksheet-drafts';
import styles from '@/styles/WorksheetBuilder.module.css';
import { useEffect, useRef, useState } from 'react';

const displayDate = (at: string) =>
  new Date(at).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

export default function WorksheetDraftHistory({
  choices,
  versions,
  savedAt,
  draftError,
  historyError,
  busy,
  onSave,
  onOpen,
  onExport,
  onImport,
}: {
  choices: WorksheetDraftChoices;
  versions: WorksheetVersion[];
  savedAt?: string;
  draftError: string;
  historyError: string;
  busy: boolean;
  onSave: (name: string) => Promise<boolean>;
  onOpen: (
    version: WorksheetVersion,
    entry?: WorksheetExportRecord
  ) => Promise<boolean>;
  onExport: () => void;
  onImport: (file: File) => Promise<string>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [showPositions, setShowPositions] = useState<string>();
  useEffect(() => () => dialog.current?.close(), []);

  const open = (save = false) => {
    setName(choices.title.trim().slice(0, 100));
    setMessage('');
    setShowPositions(undefined);
    dialog.current?.showModal();
    if (save) nameInput.current?.focus();
  };

  return (
    <section
      className={styles.draftToolbar}
      aria-label="Bản nháp sách và phiếu bài tập"
    >
      <div className={styles.actions}>
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={busy}
          onClick={() => open()}
        >
          Bản nháp và phiên bản
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={busy}
          onClick={() => open(true)}
        >
          Lưu phiên bản
        </button>
        <small aria-live="polite">
          {savedAt && !draftError
            ? `Đã lưu nháp lúc ${displayDate(savedAt)}`
            : ''}
        </small>
      </div>
      {draftError && <p role="alert">{draftError}</p>}
      {historyError && <p role="alert">{historyError}</p>}
      <dialog
        ref={dialog}
        className={styles.bookDialog}
        aria-labelledby="worksheet-history-title"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className={styles.dialogHeader}>
          <h2 id="worksheet-history-title">Bản nháp và phiên bản</h2>
          <button
            type="button"
            aria-label="Đóng lịch sử phiên bản"
            title="Đóng"
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <div className={styles.dialogBody}>
          <p>
            Bản đang làm được lưu trên trình duyệt này. Khi mở phiên bản cũ, các
            lựa chọn hiện tại được giữ lại nếu chưa có trong lịch sử.
          </p>
          <div className={styles.actions}>
            <button type="button" disabled={pending} onClick={onExport}>
              Xuất bản sao JSON
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => fileInput.current?.click()}
            >
              Nhập bản sao JSON
            </button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setPending(true);
                setMessage('');
                try {
                  setMessage(await onImport(file));
                } finally {
                  setPending(false);
                }
              }}
            />
          </div>
          <form
            className={styles.draftSave}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!name.trim() || pending) return;
              setPending(true);
              setMessage('');
              try {
                if (await onSave(name)) setMessage('Đã lưu phiên bản.');
              } finally {
                setPending(false);
              }
            }}
          >
            <label>
              Tên phiên bản đã lưu
              <input
                ref={nameInput}
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                disabled={pending}
              />
            </label>
            <button type="submit" disabled={pending || !name.trim()}>
              Lưu phiên bản
            </button>
          </form>
          {message && <p role="status">{message}</p>}
          {historyError && <p role="alert">{historyError}</p>}
          <h3>Phiên bản đã lưu</h3>
          {!versions.length && <p>Chưa có phiên bản nào.</p>}
          <ul className={styles.draftList}>
            {versions.map((version) => (
              <li key={version.id}>
                <div className={styles.draftEntry}>
                  <div>
                    <strong>{version.name}</strong>
                    <small>
                      {displayDate(version.at)} ·{' '}
                      {version.choices.levels.join(', ') || 'Chưa chọn cấp độ'}{' '}
                      · {version.choices.sections.length} chủ đề
                    </small>
                  </div>
                  <button
                    type="button"
                    aria-label={`Mở phiên bản ${version.name}`}
                    disabled={pending}
                    onClick={async () => {
                      setPending(true);
                      setMessage('');
                      try {
                        if (await onOpen(version)) dialog.current?.close();
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    Mở phiên bản
                  </button>
                </div>
                {!!version.exports.length && (
                  <details>
                    <summary>
                      Đã tạo PDF · {version.exports.length} lần xuất
                    </summary>
                    {[...version.exports].reverse().map((entry) => {
                      const key = `${version.id}/${entry.id}`;
                      return (
                        <div key={entry.id} className={styles.draftExport}>
                          <div className={styles.actions}>
                            <small>
                              {displayDate(entry.at)} · {entry.positions.length}{' '}
                              thế cờ
                            </small>
                            <button
                              type="button"
                              onClick={() =>
                                setShowPositions(
                                  showPositions === key ? undefined : key
                                )
                              }
                              aria-expanded={showPositions === key}
                            >
                              {showPositions === key
                                ? 'Ẩn danh sách thế cờ'
                                : 'Xem danh sách thế cờ'}
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={async () => {
                                setPending(true);
                                setMessage('');
                                try {
                                  if (await onOpen(version, entry))
                                    dialog.current?.close();
                                } finally {
                                  setPending(false);
                                }
                              }}
                            >
                              Mở bản xuất này
                            </button>
                          </div>
                          {showPositions === key && (
                            <ol
                              className={styles.draftPositions}
                              aria-label="Các thế cờ đã xuất theo thứ tự"
                            >
                              {entry.positions.map((position) => (
                                <li key={position.number}>
                                  {position.section === position.topic
                                    ? position.topic
                                    : `${position.section} · ${position.topic}`}
                                  {' · '}
                                  {position.level === 'Beginner'
                                    ? 'Nhập môn'
                                    : position.level}
                                  {' · '}Trang bài tập {position.exercisePage}
                                  <code>{position.fen}</code>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </section>
  );
}
