import Head from 'next/head';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import PrivateContent from '@/components/PrivateContent';
import ChessPractice from '@/components/ChessPractice';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import { mateInOneTheme } from '@/lib/chess/manual-tactics';
import styles from '@/styles/TournamentNotice.module.css';

export default function TacticPositionsPage() {
  const router = useRouter();
  const theme =
    typeof router.query.theme === 'string' ? router.query.theme : '';
  return (
    <>
      <Head>
        <title>Luyện chiến thuật | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          {router.isReady && (
            <PrivateContent<{ hubPath: string; categories: DrawCategory[] }>
              endpoint={`/api/manual-tactic-exercises?theme=${encodeURIComponent(theme)}`}
            >
              {({ categories }) => (
                <>
                  <Head>
                    <title>
                      {categories[0]?.title ?? 'Luyện chiến thuật'} | LIMA Chess
                    </title>
                  </Head>
                  <ChessPractice
                    key={theme}
                    categories={categories}
                    variant={theme === mateInOneTheme ? 'checkmate' : 'manual'}
                  />
                </>
              )}
            </PrivateContent>
          )}
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
