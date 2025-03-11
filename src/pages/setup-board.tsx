import Layout from '@/components/Layout';
import { SubscriptionWrap } from '@/components/SubscriptionWrap';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { FenBuilderScreen } from '@/setting-screens/FenBuilder';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

const SetupBoardPage = () => {
  return (
    <Layout>
      <SubscriptionWrap>
        <FenBuilderScreen />
      </SubscriptionWrap>
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

        const setupBoardMessages = (
          await import(`@/locales/${locale}/setup-board.json`)
        ).default;

        return {
          common: commonMessages,
          'setup-board': setupBoardMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || DefaultLocale);

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
export default SetupBoardPage;
