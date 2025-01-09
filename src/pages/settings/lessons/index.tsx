import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonsListScreen } from '@/screens/lessons/list';

const LessonsPage = () => {
  return (
    <Layout>
      <LessonsListScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default LessonsPage;
