import PromotionTopics from '@/components/PromotionTopics';
import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function PromotionMatePage() {
  return (
    <>
      <Head>
        <title>Phong cấp chiếu hết | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PromotionTopics active="promotion-mate" />
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
          }> endpoint="/api/promotion-mate-exercises">
            {({ categories }) => (
              <section
                className={styles.section}
                aria-label="Luyện phong cấp chiếu hết"
              >
                <ChessPractice categories={categories} variant="promotion" />
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
