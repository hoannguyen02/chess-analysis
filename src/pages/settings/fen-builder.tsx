import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { FenBuilderScreen } from '@/screens/FenBuilder';

const FenBuilderPage = () => {
  return (
    <Layout>
      <FenBuilderScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default FenBuilderPage;
