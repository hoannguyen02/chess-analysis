import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import enCommon from '@/locales/en/common.json';
import viCommon from '@/locales/vi/common.json';
import { LocaleType } from '@/types/locale';
import { LessonsScreen } from '@/view-screens/lessons/LessonsScreen';
import { GetServerSidePropsContext } from 'next';

const LessonsPage = () => {
  return (
    <Layout>
      <LessonsScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale } = ctx;
    try {
      // Use fallback translations if import fails
      const translations: Record<LocaleType, any> = {
        en: enCommon,
        vi: viCommon,
      };
      const commonMessages = translations[locale as LocaleType];

      return {
        props: {
          messages: {
            common: commonMessages,
          },
          locale,
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

export default LessonsPage;
