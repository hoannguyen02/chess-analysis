import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleListScreen } from '@/setting-screens/puzzles/list';

const PuzzlesPage = () => {
  return (
    <Layout>
      <PuzzleListScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default PuzzlesPage;
