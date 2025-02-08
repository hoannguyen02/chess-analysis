import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import dynamic from 'next/dynamic';
const DragDropSetupChessboard = dynamic(
  () => import('@/components/DragDropSetupChessboard'),
  { ssr: false }
);

const GuidePage = () => {
  return (
    <Layout>
      <DragDropSetupChessboard isGuide />
    </Layout>
  );
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

export default GuidePage;
