import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleListScreen } from '@/screens/puzzles/puzzle-list';

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
