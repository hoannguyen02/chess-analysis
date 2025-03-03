import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { DefaultLocale } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { Button } from 'flowbite-react';
import { useRouter } from 'next/router';

const PreviewPuzzlePage = () => {
  const router = useRouter();
  const { locale, isAdminRole } = useAppContext();
  const data = router.query.data
    ? JSON.parse(router.query.data as string)
    : null;

  if (data) {
    return (
      <Layout>
        {isAdminRole && (
          <Button
            onClick={() => {
              router.push(`/settings/puzzles/${data._id}`);
            }}
          >
            {locale === 'vi' ? 'Sửa thông tin' : 'Edit / Update'}
          </Button>
        )}

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
