import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { useRouter } from 'next/router';

const PreviewPuzzlePage = () => {
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
export default PreviewPuzzlePage;
