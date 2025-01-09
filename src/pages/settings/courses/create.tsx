import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseFormScreen } from '@/screens/courses/form';

const CreateCoursePage = () => {
  return (
    <Layout>
      <CourseFormScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default CreateCoursePage;
