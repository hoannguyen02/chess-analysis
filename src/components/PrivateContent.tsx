import {
  practiceAccessHeaders,
  readPracticeToken,
  savePracticeToken,
} from '@/lib/practice-access';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';

/** Browser-stored access is checked before loading any private data. */
export default function PrivateContent<T extends { hubPath: string }>({
  endpoint,
  hub = false,
  showNavigation = true,
  children,
}: {
  endpoint: string;
  hub?: boolean;
  showNavigation?: boolean;
  children: (data: T) => ReactNode;
}) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { isReady, asPath, locale, replace } = router;

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    let active = true;
    setData(null);
    setError('');
    const login = () =>
      void replace(
        { pathname: '/access', query: { next: asPath } },
        undefined,
        { locale }
      );
    if (!readPracticeToken()) login();
    else {
      void fetch(endpoint, {
        headers: practiceAccessHeaders(),
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!active) return;
          if (response.status === 401) {
            savePracticeToken('');
            login();
            return;
          }
          if (!response.ok)
            throw new Error('Không tải được nội dung. Vui lòng thử lại.');
          const result: T = await response.json();
          if (active) setData(result);
        })
        .catch((error: Error) => {
          if (active) setError(error.message);
        });
    }
    const syncAccess = (event: StorageEvent) => {
      if (event.key === 'lima-practice-access' || event.key === null)
        window.location.reload();
    };
    window.addEventListener('storage', syncAccess);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('storage', syncAccess);
    };
  }, [endpoint, isReady, asPath, locale, replace, attempt]);

  if (!data)
    return (
      <div className="my-8" role="status">
        {error ? (
          <>
            {error}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Thử lại
            </button>
          </>
        ) : (
          'Đang kiểm tra truy cập…'
        )}
      </div>
    );

  return (
    <>
      {showNavigation && (
        <nav
          className="my-1 flex items-center justify-between gap-1"
          aria-label="Tất cả"
        >
          {!hub && data.hubPath && (
            <Link
              href={data.hubPath}
              prefetch={false}
              className="font-medium underline underline-offset-4"
            >
              ← Tất cả
            </Link>
          )}
        </nav>
      )}
      {children(data)}
    </>
  );
}
