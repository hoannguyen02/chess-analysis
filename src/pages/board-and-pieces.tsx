import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';

const BoardAndPiecesPage = () => {
  const t = useTranslations();
  return (
    <Layout>
      <h1 className="font-bold text-[24px]">{t('board-pieces.title')}</h1>
      <p className="mt-4">{t('board-pieces.board-description')}</p>
      <p className="mt-4">{t('board-pieces.player-description')}</p>
      {/* Pieces like book */}
      {/* Capture board with start positions */}
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    try {
      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;

      const boardAndPieceMessages = (
        await import(`@/locales/${locale}/board-pieces.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
            'board-pieces': boardAndPieceMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default BoardAndPiecesPage;
