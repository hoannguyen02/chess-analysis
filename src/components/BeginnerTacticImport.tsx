import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Chess } from 'chess.js';
import { practiceAccessHeaders } from '@/lib/practice-access';
import { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';
import {
  manualInsertionKey,
  type ManualTactic,
} from '@/lib/chess/manual-tactics';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { beginnerSourceLevels } from '@/lib/chess/draw-levels';
import { practiceGoalLabels } from '@/lib/chess/practice-goals';
import { previousDrawPosition } from '@/lib/chess/draw-trainer';
import PracticeBoard, { PreviousMoveControl } from './PracticeBoard';
import { PracticePositionDialog } from './PracticePositionEditor';
import PracticePositionSetup from './PracticePositionSetup';
import {
  PracticeCatalogRefresh,
  type PracticeSaveNotice,
} from './PracticeSaveFeedback';
import styles from '@/styles/SavedGames.module.css';

type Candidate = {
  id: string;
  entry: Omit<ManualTactic, 'id' | 'createdAt' | 'updatedAt'>;
  sourceTitle: string;
  sourceKind: string;
  pieceCount: number;
  suggestedPly: number | null;
  detection: 'explicit' | 'geometry' | 'manual';
  positions: {
    ply: number;
    entry: Candidate['entry'];
    move: string;
    sourceKind: string;
  }[];
};
type Bank = {
  candidates: Candidate[];
  suggestedCount: number;
  sourceSnapshot: string;
  writable: boolean;
  topic: { themeId: string; label: string; scope: string };
  diagnostics?: {
    missingGoal?: number;
    invalid?: number;
    unavailableSource?: number;
  };
};
const initialFen = new Chess().fen();
const sourceLevelList = beginnerSourceLevels.join(', ');
// Topics listed in docs/beginner-one-move-game-requirements.md.
const oneMoveGameScopes = new Set([
  '/tactic-positions?theme=defensiveMove',
  '/hanging-piece',
  '/fork',
  '/pin',
  '/skewer',
  '/tactic-positions?theme=mateIn1',
  '/back-rank-mate',
  '/two-rook-mate',
]);

export default function BeginnerTacticImport({
  writable,
  scope,
  exercises,
  saveFeedback,
  onSaved,
}: {
  writable: boolean;
  scope: string;
  exercises: DrawExercise[];
  saveFeedback: ReactNode;
  onSaved: (notice: PracticeSaveNotice | undefined) => void;
}) {
  const refreshCatalog = useContext(PracticeCatalogRefresh);
  const [step, setStep] = useState<'confirm' | 'import' | null>(null);
  const open = step === 'import';
  const [blank, setBlank] = useState(false);
  const [bank, setBank] = useState<Bank | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [anchors, setAnchors] = useState<Record<string, number>>({});
  const [setup, setSetup] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [width, setWidth] = useState(400);
  const dialog = useRef<HTMLDialogElement>(null);
  const importTrigger = useRef<HTMLButtonElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const current = bank?.candidates[index];
  const currentPly = current
    ? (anchors[current.id] ?? current.suggestedPly)
    : undefined;
  const currentPosition = current?.positions.find(
    (position) => position.ply === currentPly
  );
  const currentEntry = currentPosition?.entry ?? current?.entry;
  const currentKey = current
    ? `${current.id}:${currentPly ?? 'unselected'}`
    : '';
  const displayedFen = currentEntry
    ? (edited[currentKey] ?? currentEntry.fen)
    : initialFen;
  const previousMove =
    currentEntry && displayedFen === currentEntry.fen
      ? currentEntry.previousMove
      : undefined;
  const previous = useMemo(
    () => previousDrawPosition({ fen: displayedFen, previousMove }),
    [displayedFen, previousMove]
  );
  const previewFen = showPrevious && previous ? previous.fen : displayedFen;
  const tools = usePracticeBoardTools(previewFen, {}, false);

  const fetchBank = useCallback(async (): Promise<Bank> => {
    const response = await fetch(
      `/api/beginner-tactic-candidates?scope=${encodeURIComponent(scope)}`,
      {
        headers: practiceAccessHeaders(),
        cache: 'no-store',
      }
    );
    if (!response.ok)
      throw new Error('Không tải được thế cờ nguồn. Hãy thử lại.');
    return response.json();
  }, [scope]);
  async function openBlank() {
    setBusy(true);
    setMessage('');
    onSaved(undefined);
    try {
      setBank(await fetchBank());
      setBlank(true);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!step) return;
    const element = dialog.current!;
    const trigger = importTrigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [step]);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setBusy(true);
    setMessage('');
    setEdited({});
    setAnchors({});
    setBank(null);
    setIndex(0);
    setShowPrevious(false);
    fetchBank()
      .then((data) => {
        if (!live) return;
        setBank(data);
        setSelected(
          new Set(
            data.candidates
              .filter((row) => row.suggestedPly !== null)
              .slice(0, data.suggestedCount)
              .map((row) => row.id)
          )
        );
      })
      .catch((error) => {
        if (live) setMessage(error.message);
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [open, fetchBank]);
  useEffect(() => {
    if (!open || !boardBox.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(boardBox.current);
    return () => observer.disconnect();
  }, [open, bank]);

  async function addSelected() {
    if (!bank || busy || !selected.size) return;
    setBusy(true);
    setMessage('');
    onSaved(undefined);
    let count = 0,
      skipped = 0,
      destination = '';
    try {
      const fresh = await fetchBank();
      if (fresh.sourceSnapshot !== bank.sourceSnapshot)
        throw new Error(
          'Danh sách nguồn đã thay đổi. Hãy đóng rồi mở lại để xem bản mới.'
        );
      for (const candidate of bank.candidates.filter((row) =>
        selected.has(row.id)
      )) {
        const ply = anchors[candidate.id] ?? candidate.suggestedPly;
        const position = candidate.positions.find((item) => item.ply === ply);
        if (!position)
          throw new Error('Chọn nước tạo đòn chiến thuật trước khi thêm.');
        const entry = position.entry;
        const fen = edited[`${candidate.id}:${ply}`] ?? entry.fen;
        const response = await fetch('/api/manual-tactics', {
          method: 'POST',
          headers: {
            ...practiceAccessHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...entry,
            fen,
            ...(fen !== entry.fen ? { previousMove: null } : {}),
            expectedUpdatedAt: null,
          }),
        });
        const result = await response.json();
        if (response.status === 409) {
          skipped += 1;
          continue;
        }
        if (!response.ok)
          throw new Error(result.error || 'Không thêm được thế cờ.');
        count += 1;
        destination = result.href;
        setMessage(`Đã thêm ${count} thế cờ…`);
        setSelected((old) => {
          const next = new Set(old);
          next.delete(candidate.id);
          return next;
        });
      }
      onSaved({
        message: `Đã thêm ${count} thế cờ.${skipped ? ` Bỏ qua ${skipped} thế đã có.` : ''}`,
        href: destination,
      });
      setMessage('');
      setStep(null);
    } catch (error) {
      if (count)
        onSaved({ message: `Đã thêm ${count} thế cờ.`, href: destination });
      setMessage((error as Error).message);
    } finally {
      if (count || skipped) refreshCatalog();
      setBusy(false);
    }
  }

  return (
    <section className={styles.saveControl} aria-label="Thêm thế cờ Nhập môn">
      <div className={styles.setupActions}>
        <button
          type="button"
          ref={importTrigger}
          disabled={!writable || busy}
          aria-expanded={step !== null}
          aria-haspopup="dialog"
          onClick={() => {
            onSaved(undefined);
            setStep(oneMoveGameScopes.has(scope) ? 'confirm' : 'import');
          }}
        >
          Lấy thế cờ từ {sourceLevelList}
        </button>
        <button
          type="button"
          disabled={!writable || busy}
          aria-expanded={blank}
          aria-haspopup="dialog"
          onClick={() => void openBlank()}
        >
          Thêm thế cờ Nhập môn
        </button>
      </div>
      {!open && message && <p role="status">{message}</p>}
      {blank && bank && (
        <PracticePositionDialog
          title="Thêm thế cờ Nhập môn"
          onClose={() => setBlank(false)}
          onSaved={onSaved}
          fen={initialFen}
          hideDestinationFields
          insertionTargets={exercises.map(manualInsertionKey)}
          defaults={{
            themeId: bank.topic.themeId,
            level: 'Beginner',
            solution: '',
          }}
        />
      )}
      {step === 'confirm' && (
        <dialog
          ref={dialog}
          className={`${styles.variationDialog} ${styles.beginnerImportConfirmation}`}
          aria-labelledby="beginner-tactic-confirm-title"
          aria-describedby="beginner-tactic-confirm-description"
          onKeyDown={(event) => event.stopPropagation()}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setStep(null);
          }}
        >
          <header className={styles.variationHeader}>
            <h3 id="beginner-tactic-confirm-title">
              Kiểm tra thế cờ trước khi thêm
            </h3>
          </header>
          <p id="beginner-tactic-confirm-description">
            Khi chọn bài Nhập môn một nước, hãy dùng thế cờ gốc từ ván đấu với
            tối đa 10 quân (tính cả Vua và Tốt) và đúng một nước đi hợp lệ đạt
            mục tiêu.
          </p>
          <div className={styles.setupActions}>
            <button type="button" onClick={() => setStep(null)}>
              Hủy
            </button>
            <button type="button" onClick={() => setStep('import')}>
              Tiếp tục
            </button>
          </div>
        </dialog>
      )}
      {open && (
        <dialog
          ref={dialog}
          className={styles.variationDialog}
          aria-labelledby="beginner-tactic-import-title"
          onKeyDown={(e) => e.stopPropagation()}
          onCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) setStep(null);
          }}
        >
          <header className={styles.variationHeader}>
            <h3 id="beginner-tactic-import-title">
              Thêm thế cờ Nhập môn từ {sourceLevelList}
            </h3>
            <button
              type="button"
              aria-label="Đóng danh sách thế cờ"
              disabled={busy}
              onClick={() => setStep(null)}
            >
              ✕
            </button>
          </header>
          <p>
            Chọn các thế cờ muốn thêm. Bạn có thể chỉnh sửa quân và ghi lời giải
            sau. Chỉ thêm vào Nhập môn; bài nguồn được giữ nguyên.
          </p>
          {bank && (
            <p>
              <strong>{bank.topic.label}</strong> · Chọn thế cờ trước nước tạo
              đòn chiến thuật.
            </p>
          )}
          {bank && current && (
            <div className={styles.setupGrid}>
              <div ref={boardBox} className={styles.setupBoard}>
                <PracticeBoard
                  id="beginner-tactic-source-preview"
                  fen={previewFen}
                  width={width}
                  orientation={
                    displayedFen.split(' ')[1] === 'w' ? 'white' : 'black'
                  }
                  tools={tools}
                  squareStyles={
                    previous && !showPrevious
                      ? {
                          [previous.move.from]: { backgroundColor: '#e5cf65' },
                          [previous.move.to]: { backgroundColor: '#e5cf65' },
                        }
                      : undefined
                  }
                  canMove={false}
                  pendingPromotion={null}
                  onSquareClick={() => {}}
                  onPieceDrop={() => false}
                  onPromotionPieceSelect={() => false}
                />
                <p>
                  {displayedFen.split(' ')[1] === 'w' ? 'Trắng đi' : 'Đen đi'} ·
                  Mục tiêu:{' '}
                  {currentEntry && practiceGoalLabels[currentEntry.goal]}
                </p>
                {previous && (
                  <PreviousMoveControl
                    fen={displayedFen}
                    previousMove={previousMove}
                    showingPrevious={showPrevious}
                    onToggle={() => setShowPrevious(!showPrevious)}
                  />
                )}
                <p>
                  {current.sourceTitle} · Trích từ cấp độ{' '}
                  {currentEntry?.beginnerSourceLevel}
                  {(currentPosition?.sourceKind ?? current.sourceKind) ===
                  'analysis'
                    ? ' · Phương án minh họa'
                    : ''}
                </p>
                <button
                  type="button"
                  disabled={busy || showPrevious || !currentPosition}
                  onClick={() => setSetup(true)}
                >
                  Chỉnh sửa thế cờ đang xem
                </button>
              </div>
              <div className={styles.setupControls}>
                <label>
                  Chọn nước tạo đòn chiến thuật
                  <select
                    aria-label="Chọn nước tạo đòn chiến thuật"
                    disabled={busy || showPrevious}
                    value={currentPly ?? ''}
                    onChange={(event) => {
                      setAnchors((old) => ({
                        ...old,
                        [current.id]: Number(event.target.value),
                      }));
                      setShowPrevious(false);
                    }}
                  >
                    <option value="" disabled>
                      Chọn nước đi để xác định thế cờ
                    </option>
                    {current.positions.map((position) => (
                      <option key={position.ply} value={position.ply}>
                        Trước {position.entry.fen.split(' ')[5]}
                        {position.entry.fen.split(' ')[1] === 'w'
                          ? '.'
                          : '…'}{' '}
                        {position.move}
                        {position.ply === current.suggestedPly
                          ? ' · Đề xuất'
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {current.suggestedPly === null && currentPly == null && (
                  <p>
                    Chưa xác định được nước tạo đòn. Chọn một nước trong phương
                    án để lấy thế cờ ngay trước nước đó.
                  </p>
                )}
                <div className={styles.setupActions}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setSelected(
                        new Set(
                          bank.candidates
                            .filter(
                              (row) =>
                                anchors[row.id] !== undefined ||
                                row.suggestedPly !== null
                            )
                            .map((row) => row.id)
                        )
                      )
                    }
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSelected(new Set())}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
                <div className={styles.candidateList}>
                  {bank.candidates.map((candidate, i) => (
                    <div key={candidate.id} className={styles.candidateRow}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn thế ${i + 1}`}
                        disabled={
                          busy ||
                          (anchors[candidate.id] === undefined &&
                            candidate.suggestedPly === null)
                        }
                        checked={selected.has(candidate.id)}
                        onChange={(e) =>
                          setSelected((old) => {
                            const next = new Set(old);
                            if (e.target.checked) next.add(candidate.id);
                            else next.delete(candidate.id);
                            return next;
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-pressed={index === i}
                        disabled={busy}
                        onClick={() => {
                          setIndex(i);
                          setShowPrevious(false);
                        }}
                      >
                        {i + 1}. {candidate.sourceTitle} ·{' '}
                        {candidate.entry.beginnerSourceLevel}
                        {Object.keys(edited).some((key) =>
                          key.startsWith(`${candidate.id}:`)
                        )
                          ? ' · Đã sửa'
                          : ''}
                        {candidate.suggestedPly === null &&
                        anchors[candidate.id] === undefined
                          ? ' · Chọn nước đi'
                          : ''}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy || !bank.writable || !selected.size}
                  onClick={addSelected}
                >
                  {busy
                    ? 'Đang thêm…'
                    : `Xác nhận thêm ${selected.size} thế cờ vào Nhập môn`}
                </button>
              </div>
            </div>
          )}
          {bank && !bank.candidates.length && (
            <p>Không còn thế cờ nguồn mới trong danh sách hiện tại.</p>
          )}
          {!!bank?.diagnostics?.missingGoal && (
            <p>
              Một số bài chưa ghi mục tiêu; hãy bổ sung mục tiêu trước khi lấy
              thế cờ.
            </p>
          )}
          {!!bank?.diagnostics?.invalid && (
            <p>
              Một số bài có thế cờ hoặc phương án chưa hợp lệ; các bài đó chưa
              được dùng.
            </p>
          )}
          {!!bank?.diagnostics?.unavailableSource && (
            <p>
              Một số ván nguồn chưa thể kiểm tra; các bài đó chưa được dùng.
            </p>
          )}
          <p role="status">{message}</p>
          {saveFeedback}
          {setup && current && (
            <PracticePositionSetup
              fen={displayedFen}
              hasLines={false}
              onClose={() => setSetup(false)}
              onConfirm={(fen) => {
                setEdited((old) => ({ ...old, [currentKey]: fen }));
                setShowPrevious(false);
                setSetup(false);
              }}
            />
          )}
        </dialog>
      )}
    </section>
  );
}
