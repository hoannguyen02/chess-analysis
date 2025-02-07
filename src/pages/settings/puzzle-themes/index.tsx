import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleThemeListScreen } from '@/setting-screens/puzzle-themes/list';

const PuzzleThemesPage = () => {
  return (
    <Layout>
      <PuzzleThemeListScreen />
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

export default PuzzleThemesPage;
