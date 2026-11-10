import {
  practiceAccessHeaders,
  readPracticeToken,
  savePracticeToken,
} from '@/lib/practice-access';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const PrivateContentRefresh = createContext<() => void>(() => {});
export const usePrivateContentRefresh = () => useContext(PrivateContentRefresh);

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
  const load = useRef<() => void>(() => {});
  const refresh = useCallback(() => load.current(), []);
  const { isReady, asPath, locale, replace } = router;

  useEffect(() => {
    if (!isReady) return;
    let request: AbortController | undefined;
    setData(null);
    const login = () =>
      void replace(
        { pathname: '/access', query: { next: asPath } },
        undefined,
        { locale }
      );
    load.current = () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      setError('');
      if (!readPracticeToken()) {
        login();
        return;
      }
      void fetch(endpoint, {
        headers: practiceAccessHeaders(),
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          if (controller.signal.aborted) return;
          if (response.status === 401) {
            savePracticeToken('');
            login();
            return;
          }
          if (!response.ok)
            throw new Error('Không tải được nội dung. Vui lòng thử lại.');
          const result: T = await response.json();
          if (!controller.signal.aborted) setData(result);
        })
        .catch((error: Error) => {
          if (!controller.signal.aborted) setError(error.message);
        });
    };
    load.current();
    const syncAccess = (event: StorageEvent) => {
      if (event.key === 'lima-practice-access' || event.key === null)
        window.location.reload();
    };
    window.addEventListener('storage', syncAccess);
    return () => {
      request?.abort();
      load.current = () => {};
      window.removeEventListener('storage', syncAccess);
    };
  }, [endpoint, isReady, asPath, locale, replace]);

  if (!data)
    return (
      <div className="my-8" role="status">
        {error ? (
          <>
            {error}{' '}
            <button
              type="button"
              className="underline"
              onClick={refresh}
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
      {error && (
        <p role="alert">
          Không tải được nội dung mới.{' '}
          <button
            type="button"
            className="underline"
            onClick={refresh}
          >
            Thử tải lại danh sách
          </button>
        </p>
      )}
      <PrivateContentRefresh.Provider value={refresh}>
        {children(data)}
      </PrivateContentRefresh.Provider>
    </>
  );
}
