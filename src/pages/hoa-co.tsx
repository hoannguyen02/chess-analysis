import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function DrawPracticePage() {
  return (
    <>
      <Head>
        <title>Hoà cờ | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
          }> endpoint="/api/draw-exercises">
            {({ categories }) => (
              <section
                className={styles.section}
                aria-label="Luyện kỹ năng cứu hòa"
              >
                <ChessPractice categories={categories} />
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
