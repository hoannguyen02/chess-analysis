// pages/index.tsx
import Layout from '@/components/Layout';
import { GetServerSidePropsContext } from 'next';

export default function Home() {
  return <Layout>Home Page</Layout>;
}

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  return {
    props: {
      messages: {
        common: commonMessages,
      },
    },
  };
};
