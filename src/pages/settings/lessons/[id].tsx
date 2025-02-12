import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/setting-screens/lessons/form';
import { LessonExpanded } from '@/types/lesson';
import { createServerAxios } from '@/utils/axiosInstance';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  lesson: LessonExpanded;
  error: string | null;
  errorCode: number;
};
const LessonPage = ({ lesson, error, errorCode }: Props) => {
  if (error) return <ErrorBanner error={error} errorCode={errorCode} />;

  return (
    <Layout>
      <LessonFormScreen lesson={lesson} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (
    ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
    { apiDomain }
  ) => {
    const { locale, params } = ctx;
    const { id } = params as { id: string };
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

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`${apiDomain}/v1/lessons/${id}`);

      return {
        props: {
          messages,
          lesson: response.data,
          error: null,
        },
      };
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      return {
        props: {
          messages,
          error:
            error.response?.data.message || error.response?.data.message?.error,
          errorCode: error.response?.status,
          data: null,
        },
      };
    }
  }
);

export default LessonPage;
