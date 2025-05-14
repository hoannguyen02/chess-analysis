// pages/index.tsx
import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations();
  return (
    <Layout>
      <div className="text-center">{t('common.title.heading')}</div>
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
