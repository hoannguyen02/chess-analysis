import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseListScreen } from '@/setting-screens/courses/list';

const CoursesPage = () => {
  return (
    <Layout>
      <CourseListScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default CoursesPage;
