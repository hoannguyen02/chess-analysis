import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import PrivateContent from '@/components/PrivateContent';
import type { LondonCourseData } from '@/lib/chess/london-course';
import styles from '@/styles/LondonCourse.module.css';

const LondonCourse = dynamic(() => import('@/components/LondonCourse'), {
  ssr: false,
});
export default function LondonPage() {
  return (
    <>
      <Head>
        <title>London System · LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <div className={styles.container}>
          <PrivateContent<LondonCourseData> endpoint="/api/london-course">
            {(data) => <LondonCourse data={data} />}
          </PrivateContent>
        </div>
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
