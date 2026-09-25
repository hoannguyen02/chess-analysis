import EnglishStudio from '@/components/english/EnglishStudio';
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import Head from 'next/head';

export default function EnglishPracticePage() {
  return (
    <Layout>
      <Head>
        <title>English practice · LIMA</title>
        <meta
          name="description"
          content="Create your own English lessons and practice listening, speaking, writing, and reading."
        />
      </Head>
      <EnglishStudio />
    </Layout>
  );
}

export const getServerSideProps = withThemes(async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'en'}/common.json`)).default,
    },
  },
}));
