import ChessPractice from '@/components/ChessPractice';
import PrivateContent from '@/components/PrivateContent';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import type { DrawThemeLink } from '@/lib/chess/draw-practice-view';
import styles from '@/styles/TournamentNotice.module.css';
import Head from 'next/head';

export default function DrawThemePracticePage({
  title,
  endpoint,
  label,
}: {
  title: string;
  endpoint: string;
  label: string;
}) {
  return (
    <>
      <Head>
        <title>{title} | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<{
            hubPath: string;
            categories: DrawCategory[];
            themeLinks: DrawThemeLink[];
          }>
            endpoint={endpoint}
          >
            {({ categories, themeLinks }) => (
              <section className={styles.section} aria-label={label}>
                <ChessPractice
                  categories={categories}
                  categoryLinks={themeLinks}
                />
              </section>
            )}
          </PrivateContent>
        </article>
      </main>
    </>
  );
}
