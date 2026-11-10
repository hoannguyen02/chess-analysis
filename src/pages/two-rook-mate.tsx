import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function TwoRookMatePracticePage() {
  return (
    <>
      <Head>
        <title>Chiếu hết bằng hai Xe | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
          }> endpoint="/api/two-rook-mate-exercises">
            {({ categories }) => (
              <section
                className={styles.section}
                aria-label="Luyện chiếu hết bằng hai Xe"
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

// The public page and Next data payload contain no private exercise data.
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
