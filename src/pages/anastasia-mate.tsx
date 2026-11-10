import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function AnastasiaMatePracticePage() {
  return (
    <>
      <Head>
        <title>Chiếu hết kiểu Anastasia | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
          }> endpoint="/api/anastasia-mate-exercises">
            {({ categories }) => (
              <section
                className={styles.section}
                aria-label="Luyện chiếu hết kiểu Anastasia"
              >
                <ChessPractice categories={categories} variant="checkmate" />
              </section>
            )}
          </PrivateContent>
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
