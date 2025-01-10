import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleFormScreen } from '@/setting-screens/puzzles/form';

const CreatePuzzlePage = () => {
  return (
    <Layout>
      <PuzzleFormScreen />
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

export default CreatePuzzlePage;
