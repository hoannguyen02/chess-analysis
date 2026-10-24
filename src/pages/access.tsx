import {
  practiceAccessHeaders,
  readPracticeToken,
  savePracticeToken,
} from '@/lib/practice-access';
import { privateReturnPath } from '@/lib/private-navigation';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';

export default function PrivateAccessPage() {
  const { isReady, query, locale, replace } = useRouter();
  const next = typeof query.next === 'string' ? query.next : '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady) return;
    if (!readPracticeToken()) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setBusy(true);
    void fetch('/api/private-pages', {
      headers: practiceAccessHeaders(),
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          savePracticeToken('');
          setBusy(false);
          return;
        }
        if (!response.ok)
          throw new Error('Không thể kiểm tra truy cập. Vui lòng thử lại.');
        const data: { hubPath: string; pages: { href: string }[] } =
          await response.json();
        if (!active) return;
        const destination = privateReturnPath(
          next,
          locale,
          [
            ...data.pages.map((page) => page.href),
            ...(data.hubPath ? [data.hubPath] : []),
          ],
          data.hubPath || '/skewer'
        );
        await replace(destination, undefined, { locale: false });
      })
      .catch((error: Error) => {
        if (active) {
          setError(error.message);
          setBusy(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [isReady, next, locale, replace]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/practice-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, next, locale }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Không thể mở nội dung.');
      savePracticeToken(result.token);
      setPassword('');
      await replace(result.redirectTo, undefined, { locale: false });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối. Vui lòng thử lại.'
      );
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Đăng nhập | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <form
            onSubmit={unlock}
            className="mx-auto my-8 flex max-w-sm flex-col gap-3"
            aria-busy={busy}
          >
            <label htmlFor="practice-password">Mật khẩu</label>
            <input
              id="practice-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border p-3"
              disabled={busy}
            />
            <p className="text-sm text-gray-600">
              Ghi nhớ truy cập trên trình duyệt này trong 30 ngày.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !isReady}
              className="rounded-lg bg-green-800 p-3 text-white disabled:opacity-50"
            >
              {busy ? 'Đang mở…' : 'Tiếp tục'}
            </button>
          </form>
        </article>
      </main>
    </>
  );
}
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
