import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseFormScreen } from '@/setting-screens/courses/form';
import { useRouter } from 'next/router';

const PreviewCoursePage = () => {
  const router = useRouter();
  const data = router.query.data
    ? JSON.parse(router.query.data as string)
    : null;

  if (data) {
    return (
      <Layout>
        <CourseFormScreen course={data} />
      </Layout>
    );
  }

  return null;
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  return {
    props: {
      messages: {
        common: commonMessages,
      },
    },
  };
});
export default PreviewCoursePage;
