import { useCallback, useEffect, useRef, useState } from 'react';
import {
  encodeWorksheetDrafts,
  parseWorksheetDrafts,
  sameWorksheetChoices,
  worksheetDraftKey,
  worksheetVersionsKey,
  type WorksheetDraft,
  type WorksheetDraftChoices,
  type WorksheetVersion,
} from '@/lib/chess/worksheet-drafts';

function readLocal() {
  let working: WorksheetDraft | null = null;
  let workingRaw: string | null = null;
  let versions: WorksheetVersion[] = [];
  let draftError = '';
  let historyError = '';
  try {
    workingRaw = localStorage.getItem(worksheetDraftKey);
    if (workingRaw) working = parseWorksheetDrafts(workingRaw).working;
  } catch {
    draftError = 'Không đọc được bản nháp đã lưu trong trình duyệt.';
  }
  try {
    const raw = localStorage.getItem(worksheetVersionsKey);
    if (raw) versions = parseWorksheetDrafts(raw).versions;
  } catch {
    historyError = 'Không đọc được lịch sử phiên bản trong trình duyệt.';
  }
  return { working, workingRaw, versions, draftError, historyError };
}

const draftConflict =
  'Bản nháp đã thay đổi ở tab khác. Hãy lưu phiên bản hoặc xuất bản sao của tab này trước khi tải lại trang.';

export function useWorksheetDrafts() {
  const [initial] = useState(readLocal);
  const [working, setWorking] = useState(initial.working);
  const [versions, setVersions] = useState(initial.versions);
  const [draftError, setDraftError] = useState(initial.draftError);
  const [historyError, setHistoryError] = useState(initial.historyError);
  const workingRef = useRef(initial.working);
  const workingRaw = useRef(initial.workingRaw);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key === worksheetDraftKey || event.key === null) {
        if (event.newValue !== workingRaw.current) setDraftError(draftConflict);
      }
      if (event.key === worksheetVersionsKey || event.key === null) {
        try {
          const raw = localStorage.getItem(worksheetVersionsKey);
          setVersions(raw ? parseWorksheetDrafts(raw).versions : []);
          setHistoryError('');
        } catch {
          setHistoryError(
            'Không đọc được lịch sử phiên bản trong trình duyệt.'
          );
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveWorking = useCallback(
    (choices: WorksheetDraftChoices, referenceId?: string) => {
      const write = () => {
        const previous = localStorage.getItem(worksheetDraftKey);
        if (previous !== workingRaw.current) {
          setDraftError(draftConflict);
          return;
        }
        // Leave unreadable or newer data intact for recovery.
        if (previous && !workingRef.current) parseWorksheetDrafts(previous);
        const saved = workingRef.current;
        if (
          saved &&
          saved.referenceId === referenceId &&
          sameWorksheetChoices(saved.choices, choices) &&
          saved.choices.nextId === choices.nextId
        )
          return;
        const draft = { at: new Date().toISOString(), choices, referenceId };
        const raw = encodeWorksheetDrafts(draft, []);
        localStorage.setItem(worksheetDraftKey, raw);
        workingRaw.current = raw;
        workingRef.current = draft;
        setWorking(draft);
        setDraftError('');
      };
      const failed = () => {
        setDraftError(
          'Chưa lưu được bản nháp vào trình duyệt. Bạn có thể xuất bản sao JSON.'
        );
      };
      try {
        if (navigator.locks)
          void navigator.locks.request(worksheetDraftKey, write).catch(failed);
        else write();
      } catch {
        failed();
      }
    },
    []
  );

  async function updateVersions(
    update: (current: WorksheetVersion[]) => WorksheetVersion[]
  ) {
    const write = () => {
      const raw = localStorage.getItem(worksheetVersionsKey);
      const current = raw ? parseWorksheetDrafts(raw).versions : [];
      const next = update(current);
      if (next !== current)
        localStorage.setItem(
          worksheetVersionsKey,
          encodeWorksheetDrafts(null, next)
        );
      setVersions(next);
      setHistoryError('');
      return next;
    };
    try {
      // Serialize history writes across tabs where the browser supports Web Locks.
      return navigator.locks
        ? await navigator.locks.request(worksheetVersionsKey, write)
        : write();
    } catch (error) {
      setHistoryError(
        error instanceof DOMException
          ? 'Chưa lưu được lịch sử phiên bản vào trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ.'
          : (error as Error).message
      );
      return null;
    }
  }

  return {
    initial: initial.working,
    working,
    versions,
    draftError,
    historyError,
    saveWorking,
    updateVersions,
  };
}
