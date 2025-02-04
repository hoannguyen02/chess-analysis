import { CourseDetails } from '@/components/CourseDetails';
import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonProgress } from '@/types';
import { CourseExpanded } from '@/types/course';
import { GetServerSidePropsContext } from 'next';

type Props = {
  data: CourseExpanded;
  error: string | null;
  errorCode: number;
  lessonProgresses: LessonProgress[];
};

const LessonDetailsPage = ({
  data,
  error,
  errorCode,
  lessonProgresses,
}: Props) => {
  if (error) return <ErrorBanner error={error} errorCode={errorCode} />;

  return (
    <Layout>
      <CourseDetails data={data} lessonProgresses={lessonProgresses} />
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
    const messages = await loadMessages(locale || 'en');

    return {
      props: {
        messages,
        error: null,
      },
    };
  }
);

export default LessonDetailsPage;
