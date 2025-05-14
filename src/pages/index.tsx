// pages/index.tsx
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { GetServerSidePropsContext } from 'next';

export default function Home() {
  return (
    <Layout>
      <div className="text-center">
        Unleashing Chess Brilliance — Welcome to LIMA Analysis
      </div>
    </Layout>
  );
}
export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    const commonMessages = (await import(`@/locales/${locale}/common.json`))
      .default;
    return {
      props: {
        messages: {
          common: commonMessages,
        },
      },
    };
  }
);
