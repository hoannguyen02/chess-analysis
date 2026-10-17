import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseLessonSpreadsheet, LessonPosition } from '@/lib/lesson-import';

export function LessonSpreadsheetImport({
  onImport,
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (positions: Omit<LessonPosition, 'id'>[]) => void;
}) {
  const t = useTranslations('setup-board');
  const [text, setText] = useState('');
  const preview = useMemo(() => parseLessonSpreadsheet(text), [text]);
  if (!open) return null;
  return (
    <div
      id="lesson-spreadsheet-import"
      className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3"
    >
      <p className="text-sm text-slate-600">{t('spreadsheet-help')}</p>
      <textarea
        aria-label={t('spreadsheet-paste')}
        placeholder={t('spreadsheet-paste')}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="w-full rounded-lg border-slate-300 font-mono text-xs"
        rows={5}
      />
      {text.trim() && (
        <>
          <p className="text-sm">
            {t('spreadsheet-count', { count: preview.positions.length })}
          </p>
          <ul className="max-h-40 space-y-1 overflow-auto text-sm">
            {preview.positions.map((position, index) => (
              <li key={index}>
                {position.title}
                {position.previousMove ? ` · ${position.previousMove}` : ''}
              </li>
            ))}
          </ul>
          {preview.errors.length > 0 && (
            <div
              role="alert"
              className="max-h-32 overflow-auto text-sm text-rose-700"
            >
              {preview.errors.map((error) => (
                <p key={`${error.row}-${error.column}`}>
                  {t('spreadsheet-error', {
                    row: error.row,
                    column: error.column,
                    reason: t(`spreadsheet-invalid-${error.reason}`),
                  })}
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={!preview.positions.length}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-40"
            onClick={() => {
              onImport(preview.positions);
              setText('');
              onClose();
            }}
          >
            {t(
              preview.errors.length
                ? 'spreadsheet-add-valid'
                : 'spreadsheet-add',
              { count: preview.positions.length }
            )}
          </button>
        </>
      )}
    </div>
  );
}
