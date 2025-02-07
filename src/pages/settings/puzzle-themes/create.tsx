import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleThemeFormScreen } from '@/setting-screens/puzzle-themes/form';

const CreatePuzzlePage = () => {
  return (
    <Layout>
      <PuzzleThemeFormScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  return {
    props: {
      messages: {
        common: commonMessages,
      },
    },
  };
});

export default CreatePuzzlePage;
