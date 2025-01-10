import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonsListScreen } from '@/setting-screens/lessons/list';

const LessonsPage = () => {
  return (
    <Layout>
      <LessonsListScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  return {
    props: {
      messages: {
        ...commonMessages,
      },
    },
  };
});

export default LessonsPage;
