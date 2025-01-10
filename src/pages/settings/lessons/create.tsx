import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/setting-screens/lessons/form';

const CreateLessonPage = () => {
  return (
    <Layout>
      <LessonFormScreen />
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

export default CreateLessonPage;
