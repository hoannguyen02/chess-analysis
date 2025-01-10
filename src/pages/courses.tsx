import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseListScreen } from '@/setting-screens/courses/list';
import { GetServerSidePropsContext } from 'next';

const CoursesPage = () => {
  return (
    <Layout>
      <CourseListScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    const commonMessages = (await import(`@/locales/${locale}/common.json`))
      .default;
    return {
      props: {
        messages: {
          ...commonMessages,
        },
      },
    };
  }
);

export default CoursesPage;
