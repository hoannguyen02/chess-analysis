import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { FenBuilderScreen } from '@/setting-screens/FenBuilder';

const FenBuilderPage = () => {
  return (
    <Layout>
      <FenBuilderScreen />
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

export default FenBuilderPage;
