import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { LessonDetails } from '@/components/LessonDetails';
import { withThemes } from '@/HOF/withThemes';
import { LessonExpanded } from '@/types/lesson';
import { createServerAxios } from '@/utils/axiosInstance';
import { GetServerSidePropsContext } from 'next';

type Props = {
  data: LessonExpanded;
  error: string | null;
  errorCode: number;
};
const LessonDetailsPage = ({ data, error, errorCode }: Props) => {
  if (error) return <ErrorBanner error={error} errorCode={errorCode} />;

  return (
    <Layout>
      <LessonDetails data={data} />
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
        const solvePuzzleMessages = (
          await import(`@/locales/${locale}/solve-puzzle.json`)
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
    const slug = params?.lessonSlug;

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`/v1/lessons/public/slug/${slug}`);

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
          error: error.message || error,
          errorCode: error.response?.status,
          data: null,
        },
      };
    }
  }
);

export default LessonDetailsPage;
