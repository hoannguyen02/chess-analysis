import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { AnalysisScreen } from '@/view-screens/AnalysisScreen';

const GuidePage = () => {
  return (
    <Layout>
      <AnalysisScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  const analysisMessages = (await import(`@/locales/${locale}/analysis.json`))
    .default;
  return {
    props: {
      messages: {
        common: commonMessages,
        analysis: analysisMessages,
      },
    },
  };
});

export default GuidePage;
