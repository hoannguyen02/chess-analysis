import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { ShareFacebookButton } from '@/components/ShareFacebookButton';
import SolvePuzzle from '@/components/SolvePuzzle';
import { withThemes } from '@/HOF/withThemes';
import { createServerAxios } from '@/utils/axiosInstance';
import { Clipboard } from 'flowbite-react';
import { isEmpty } from 'lodash';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { useMemo } from 'react';

const SolvePuzzlePage = ({ puzzle, errorCode, error }: any) => {
  const t = useTranslations('common');
  const router = useRouter();
  const { locale, asPath } = router;
  const fullUrl = useMemo(
    () => `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}${asPath}`,
    [asPath, locale]
  );

  if (isEmpty(puzzle)) {
    return <ErrorBanner error={error} errorCode={errorCode} />;
  }

  return (
    <Layout>
      <div className="flex flex-col">
        <div className="flex mb-6 justify-center">
          <ShareFacebookButton url={fullUrl} />
          <Clipboard
            valueToCopy={fullUrl}
            label={t('button.copy-link')}
            className="ml-2"
          />
        </div>
        <SolvePuzzle puzzle={puzzle} />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (
    ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
    { apiDomain }
  ) => {
    const { locale, params } = ctx;
    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;

        const solvePuzzleMessages = (
          await import(`@/locales/${locale || 'en'}/solve-puzzle.json`)
        ).default;

        return {
          common: commonMessages,
          'solve-puzzle': solvePuzzleMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || 'en');
    const id = params?.id;

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`${apiDomain}/v1/puzzles/${id}`);

      return {
        props: {
          messages,
          puzzle: response.data,
          error: null,
        },
      };
    } catch (error: any) {
      return {
        props: {
          messages,
          error:
            error.response?.data.message || error.response?.data.message?.error,
          errorCode: error.response?.status,
          puzzle: [],
        },
      };
    }
  }
);

export default SolvePuzzlePage;
