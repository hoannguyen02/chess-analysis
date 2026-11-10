import Link from 'next/link';
import { createContext, useEffect, useState } from 'react';
import styles from '@/styles/PracticeSaveFeedback.module.css';

export type PracticeSaveNotice = { message: string; href?: string };

export const PracticeCatalogRefresh = createContext<() => void>(() => {});

export function usePracticeSaveNotice() {
  const [notice, setNotice] = useState<PracticeSaveNotice>();

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => {
      setNotice((current) => (current === notice ? undefined : current));
    }, 30_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return [notice, setNotice] as const;
}

export default function PracticeSaveFeedback({
  notice,
  onDismiss,
}: {
  notice: PracticeSaveNotice | undefined;
  onDismiss: () => void;
}) {
  return (
    <div className={notice ? styles.toast : 'sr-only'}>
      <div className={styles.content}>
        <p role="status">{notice?.message}</p>
        {notice?.href && (
          <Link href={notice.href} prefetch={false} className={styles.link}>
            Mở bài tập →
          </Link>
        )}
      </div>
      {notice && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Đóng thông báo"
          title="Đóng thông báo"
          onClick={onDismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
