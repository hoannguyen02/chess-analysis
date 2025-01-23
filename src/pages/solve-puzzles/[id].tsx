import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { withThemes } from '@/HOF/withThemes';
import { createServerAxios } from '@/utils/axiosInstance';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

const SolvePuzzlePage = ({ puzzle }: any) => {
  return (
    <Layout>
      <SolvePuzzle puzzle={puzzle} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (
    ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
    { apiDomain }
  ) => {
    const { locale, params } = ctx;
    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;

        const solvePuzzleMessages = (
          await import(`@/locales/${locale || 'en'}/solve-puzzle.json`)
        ).default;

        return {
          common: commonMessages,
          'solve-puzzle': solvePuzzleMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || 'en');
    const id = params?.id;

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`${apiDomain}/v1/puzzles/${id}`);

      return {
        props: {
          messages,
          puzzle: response.data,
          error: null,
        },
      };
    } catch (error: any) {
      return {
        props: {
          messages,
          error:
            error.response?.data.message || error.response?.data.message?.error,
          errorCode: error.response?.status,
          puzzle: [],
        },
      };
    }
  }
);

export default SolvePuzzlePage;
