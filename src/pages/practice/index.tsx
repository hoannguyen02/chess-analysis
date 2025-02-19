import Layout from '@/components/Layout';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { PracticePuzzlesScreen } from '@/view-screens/PracticePuzzlesScreen';
import { GetServerSidePropsContext } from 'next';

const PracticePuzzlesPage = () => {
  return (
    <Layout>
      <PracticePuzzlesScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale } = ctx;
    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;

        return {
          common: commonMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || DefaultLocale);

    return {
      props: {
        messages,
        error: null,
      },
    };
  }
);

export default PracticePuzzlesPage;
