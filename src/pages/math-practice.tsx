import Layout from '@/components/Layout';
import MathStudio from '@/components/math/MathStudio';
import { withThemes } from '@/HOF/withThemes';
import { isMathPracticeEnabled } from '@/lib/math/availability';
import Head from 'next/head';

export default function MathPracticePage() {
  return (
    <Layout>
      <Head>
        <title>Toán học · LIMA</title>
        <meta
          name="description"
          content="Học cộng phân số qua hình ảnh, hướng dẫn từng bước và bài tập tự kiểm tra bằng tiếng Việt."
        />
      </Head>
      <MathStudio />
    </Layout>
  );
}

export const getServerSideProps = withThemes(async ({ locale }) => {
  if (!isMathPracticeEnabled()) return { notFound: true };

  return {
    props: {
      messages: {
        common: (await import(`@/locales/${locale || 'en'}/common.json`))
          .default,
      },
    },
  };
});
