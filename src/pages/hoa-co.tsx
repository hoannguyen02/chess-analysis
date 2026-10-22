import type { DrawCategory } from '@/lib/chess/draw-practice';
import DrawPractice from '@/components/DrawPractice';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function DrawPracticePage({
  categories,
}: {
  categories: DrawCategory[];
}) {
  return (
    <>
      <Head>
        <title>Luyện cứu hòa | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>LIMA CHESS · LUYỆN TẬP</p>
            <h1>Luyện cứu hòa</h1>
            <p className={styles.intro}>Chiến thuật và kỹ năng phòng thủ</p>
          </header>
          <section
            className={styles.section}
            aria-label="Luyện kỹ năng cứu hòa"
          >
            <DrawPractice categories={categories} />
          </section>
        </article>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const { drawCategories } = await import('@/lib/chess/draw-practice');
  const { gameReference } = await import('@/lib/chess/draw-game-reference');
  return {
    props: {
      categories: drawCategories.map((category) => ({
        ...category,
        exercises: category.exercises.map((exercise) => ({
          ...exercise,
          gameReference: gameReference(exercise.fen) ?? null,
        })),
      })),
      messages: {
        common: (await import(`@/locales/${locale || 'vi'}/common.json`))
          .default,
      },
    },
  };
};
