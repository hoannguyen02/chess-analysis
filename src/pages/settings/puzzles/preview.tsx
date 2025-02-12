import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { useRouter } from 'next/router';

const PreviewPuzzlePage = () => {
  const router = useRouter();
  const data = router.query.data
    ? JSON.parse(router.query.data as string)
    : null;

  if (data) {
    return (
      <Layout>
        <SolvePuzzle puzzle={data} highlightPossibleMoves />
      </Layout>
    );
  }

  return null;
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  const solvePuzzleMessages = (
    await import(`@/locales/${locale || DefaultLocale}/solve-puzzle.json`)
  ).default;

  return {
    props: {
      messages: {
        common: commonMessages,
        'solve-puzzle': solvePuzzleMessages,
      },
    },
  };
});
export default PreviewPuzzlePage;
