import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseFormScreen } from '@/setting-screens/courses/form';

const CreateCoursePage = () => {
  return (
    <Layout>
      <CourseFormScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  return {
    props: {
      messages: {
        ...commonMessages,
      },
    },
  };
});

export default CreateCoursePage;
