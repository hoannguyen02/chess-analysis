import Link from 'next/link';
import { createContext } from 'react';

export type PracticeSaveNotice = { message: string; href?: string };

export const PracticeCatalogRefresh = createContext<() => void>(() => {});

export default function PracticeSaveFeedback({
  notice,
}: {
  notice: PracticeSaveNotice | undefined;
}) {
  return (
    <div role="status">
      {notice && (
        <p>
          {notice.message}{' '}
          {notice.href && (
            <Link
              href={notice.href}
              prefetch={false}
              className="inline-flex min-h-11 items-center underline"
            >
              Mở bài tập →
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
