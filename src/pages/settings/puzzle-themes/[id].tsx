import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleThemeFormScreen } from '@/setting-screens/puzzle-themes/form';
import { fetcher } from '@/utils/fetcher';
import { Spinner } from 'flowbite-react';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { useParams } from 'next/navigation';
import { ParsedUrlQuery } from 'querystring';
import { useMemo } from 'react';
import useSWR from 'swr';

const PuzzleThemePage = () => {
  const { apiDomain } = useAppContext();
  const params = useParams();

  const key = useMemo(
    () => `${apiDomain}/v1/puzzle-themes/${params.id}`,
    [apiDomain, params.id]
  );

  const { data, isLoading, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading || isValidating) {
    return <Spinner />;
  }

  return (
    <Layout>
      <PuzzleThemeFormScreen puzzleTheme={data} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async ({
    locale,
  }: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    try {
      const commonMessages = (
        await import(`@/locales/${locale || 'en'}/common.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return { props: { puzzles: [] } };
    }
  }
);

export default PuzzleThemePage;
