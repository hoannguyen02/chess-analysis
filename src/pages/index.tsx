// pages/index.tsx
import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { GetServerSidePropsContext } from 'next';

import dynamic from 'next/dynamic';
import { SWRConfig } from 'swr';

const UserHomeScreen = dynamic(() =>
  import('@/view-screens/homepage/UserHomeScreen').then(
    (components) => components.UserHomeScreen
  )
);
const GuestHomeScreen = dynamic(() =>
  import('@/view-screens/homepage/GuestHomeScreen').then(
    (components) => components.GuestHomeScreen
  )
);

export default function Home() {
  const { session } = useAppContext();

  return (
    <Layout>
      {session?.username ? (
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            dedupingInterval: 10000,
            shouldRetryOnError: false,
          }}
        >
          <UserHomeScreen />
        </SWRConfig>
      ) : (
        <GuestHomeScreen />
      )}
    </Layout>
  );
}
export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    const commonMessages = (await import(`@/locales/${locale}/common.json`))
      .default;
    const homeMessages = (await import(`@/locales/${locale}/home.json`))
      .default;
    const solvePuzzleMessages = (
      await import(`@/locales/${locale}/solve-puzzle.json`)
    ).default;
    return {
      props: {
        messages: {
          common: commonMessages,
          home: homeMessages,
          'solve-puzzle': solvePuzzleMessages,
        },
      },
    };
  }
);
