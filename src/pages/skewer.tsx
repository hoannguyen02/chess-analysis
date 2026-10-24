import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function SkewerPracticePage() {
  return (
    <>
      <Head>
        <title>Đòn xiên | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
          }> endpoint="/api/skewer-exercises">
            {({ categories }) => (
              <section className={styles.section} aria-label="Luyện đòn xiên">
                <ChessPractice categories={categories} variant="skewer" />
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
