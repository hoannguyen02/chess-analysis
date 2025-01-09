import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { withThemes } from '@/HOF/withThemes';
import { useRouter } from 'next/router';

const PreviewLessonPage = () => {
  const router = useRouter();
  const data = router.query.data
    ? JSON.parse(router.query.data as string)
    : null;

  if (data) {
    return (
      <Layout>
        <SolvePuzzle puzzle={data} />
      </Layout>
    );
  }

  return null;
};

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});
export default PreviewLessonPage;
