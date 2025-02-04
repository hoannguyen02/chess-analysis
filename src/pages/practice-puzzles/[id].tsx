import { AuthenticatedWrap } from '@/components/AuthenticatedWrap';
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { SolvePracticePuzzleScreen } from '@/view-screens/homepage/SolvePracticePuzzleScreen';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

const PracticePuzzlePage = () => {
  return (
    <Layout>
      <AuthenticatedWrap>
        <SolvePracticePuzzleScreen />
      </AuthenticatedWrap>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const { locale } = ctx;
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

    try {
      return {
        props: {
          messages,
          error: null,
        },
      };
    } catch {
      return {
        props: {
          messages,
        },
      };
    }
  }
);

export default PracticePuzzlePage;
