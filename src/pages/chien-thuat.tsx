import { topicGroups } from '@/lib/server/private-tactics';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

export default function TacticsPractice() {
  return (
    <>
      <Head>
        <title>Luyện chiến thuật | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Bài tập chiến thuật cờ vua theo chủ đề, từ cơ bản đến nâng cao trên Lichess."
        />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>LIMA Chess · LUYỆN TẬP</p>
            <h1>Luyện chiến thuật</h1>
            <p className={styles.intro}>Bài tập theo chủ đề · Lichess</p>
          </header>
          <section
            className={styles.section}
            aria-label="Chủ đề luyện chiến thuật"
          >
            <p className={styles.kicker}>CHỦ ĐỀ LUYỆN TẬP</p>
            <p>
              Ôn nhóm cơ bản trước, rồi chọn thêm chủ đề đã học. Đây là thứ tự
              ôn gợi ý; mỗi chủ đề vẫn có bài dễ và khó.
            </p>
            {topicGroups.map((group, groupIndex) => (
              <details
                key={group.title}
                className={styles.topicGroup}
                open={groupIndex === 0}
              >
                <summary>
                  {group.title}
                  <span className={styles.topicCount}>
                    {' '}
                    · {group.topics.length} chủ đề
                  </span>
                </summary>
                {group.description && (
                  <p className="mt-3 text-sm">{group.description}</p>
                )}
                <div className={styles.topics}>
                  {group.topics.map(([label, theme], topicIndex) => (
                    <a
                      key={theme}
                      href={`https://lichess.org/training/${theme}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.topicNumber}>
                        {String(topicIndex + 1).padStart(2, '0')}
                      </span>
                      <span>{label}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </details>
            ))}
          </section>
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
