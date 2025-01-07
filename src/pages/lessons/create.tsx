import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/screens/lessons/form';

const CreateLessonPage = () => {
  return (
    <Layout>
      <LessonFormScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});

export default CreateLessonPage;
