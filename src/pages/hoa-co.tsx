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
        <title>Luyện cứu hòa | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>LIMA Chess · LUYỆN TẬP</p>
            <h1>Luyện cứu hòa</h1>
            <p className={styles.intro}>Chiến thuật và kỹ năng phòng thủ</p>
          </header>
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
