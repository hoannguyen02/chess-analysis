// pages/index.tsx
import Layout from '@/components/Layout';
import SloganAnimation from '@/components/SloganAnimation';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance, { setAxiosLocale } from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Dropdown } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToast();
  const { session, locale, apiDomain } = useAppContext();
  const handleLogout = useCallback(async () => {
    const result = await handleSubmission(
      async () => {
        setAxiosLocale(locale);
        return await axiosInstance.post(`${apiDomain}/v1/auth/logout`);
      },
      addToast, // Pass addToast to show toast notifications
      t('title.logout-success') // Success message
    );
    if (result !== undefined) {
      router.push('/');
    }
  }, [addToast, apiDomain, locale, router, t]);

  const headline = t.rich('home.headline', {
    b: () => `<b class="text-[var(--p-text)]">${t('home.basics')}</b>`,
    small: () => `<b class="text-[var(--p-text)]">${t('home.brilliance')}</b>!`,
  });

  return (
    <Layout>
      {session?.username ? (
        <div className="mt-4 flex justify-end">
          <Dropdown label={t('common.title.profile')}>
            <Dropdown.Item onClick={() => router.push('/change-password')}>
              {t('common.navigation.change-password')}
            </Dropdown.Item>
            <Dropdown.Item onClick={handleLogout}>
              {t('common.navigation.logout')}
            </Dropdown.Item>
          </Dropdown>
        </div>
      ) : (
        <>
          {/* <h1 className="text-center mt-4 text-[24px] lg:text-[50px]">
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
          </div> */}
          <SloganAnimation />
        </>
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
    return {
      props: {
        messages: {
          common: commonMessages,
          home: homeMessages,
        },
      },
    };
  }
);
