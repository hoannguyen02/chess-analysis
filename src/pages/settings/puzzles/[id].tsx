import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleFormScreen } from '@/setting-screens/puzzles/form';
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

const PuzzlePage = () => {
  const { apiDomain } = useAppContext();
  const params = useParams();

  const key = useMemo(
    () => `${apiDomain}/v1/puzzles/${params.id}`,
    [apiDomain, params.id]
  );

  const { data, mutate, isLoading, isValidating } = useSWR(key, fetcher);

  if (isLoading || isValidating) {
    return <Spinner />;
  }

  return (
    <Layout>
      <PuzzleFormScreen
        isValidating={isValidating}
        onSaveSuccess={mutate}
        puzzle={data}
      />
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

export default PuzzlePage;
