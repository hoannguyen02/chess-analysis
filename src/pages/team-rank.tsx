import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import TeamRankScreen from '@/view-screens/TeamRankScreen';

const TeamRankPage = () => {
  return (
    <Layout>
      <TeamRankScreen />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async ({ locale }) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  const teamRankMessages = (await import(`@/locales/${locale}/team-rank.json`))
    .default;

  return {
    props: {
      messages: {
        common: commonMessages,
        'team-rank': teamRankMessages,
      },
    },
  };
});

export default TeamRankPage;
