// pages/index.tsx
import Layout from '@/components/Layout';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations();

  const headline = t.rich('home.headline', {
    b: () => `<b class="text-[var(--p-text)]">${t('home.basics')}</b>`,
    small: () => `<b class="text-[var(--p-text)]">${t('home.brilliance')}</b>!`,
  });

  return (
    <Layout>
      <h1 className="text-center mt-8 text-[24px] lg:text-[50px]">
        <div
          dangerouslySetInnerHTML={{
            __html: headline as TrustedHTML,
          }}
        />
      </h1>
      <div className="flex justify-center mt-8">
        <Link
          color="primary"
          className="text-[40px] py-[10px] flex px-[40px] text-white rounded-[20px] border-1 bg-[var(--p-bg)]"
          href="/"
        >
          {t('home.button.get-started')}
        </Link>
      </div>
    </Layout>
  );
}

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;
  const homeMessages = (await import(`@/locales/${locale}/home.json`)).default;
  return {
    props: {
      messages: {
        common: commonMessages,
        home: homeMessages,
      },
    },
  };
};
