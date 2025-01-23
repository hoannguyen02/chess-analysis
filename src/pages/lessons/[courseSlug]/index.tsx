import { CourseDetails } from '@/components/CourseDetails';
import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseExpanded } from '@/types/course';
import { createServerAxios } from '@/utils/axiosInstance';
import { GetServerSidePropsContext } from 'next';

type Props = {
  data: CourseExpanded;
  error: string | null;
  errorCode: number;
};

const LessonDetailsPage = ({ data, error, errorCode }: Props) => {
  if (error) return <ErrorBanner error={error} errorCode={errorCode} />;

  return (
    <Layout>
      <CourseDetails data={data} />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale, params } = ctx;
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
    const messages = await loadMessages(locale || 'en');
    const slug = params?.courseSlug;

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`/v1/courses/public/slug/${slug}`);

      return {
        props: {
          messages,
          data: response.data,
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
          data: null,
        },
      };
    }
  }
);

export default LessonDetailsPage;
