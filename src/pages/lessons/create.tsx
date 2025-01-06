import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/screens/lessons/form';

const CreatePuzzlePage = () => {
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

export default CreatePuzzlePage;
