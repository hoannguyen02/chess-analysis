import Layout from '@/components/Layout';
import SolvePuzzle from '@/components/SolvePuzzle';
import { withThemes } from '@/HOF/withThemes';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

const SolvePuzzlePage = ({ puzzle }: any) => {
  return (
    <Layout>
      <SolvePuzzle puzzle={puzzle} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async ({
    params,
    locale,
  }: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
    const { id } = params as {
      id: string;
    };

    try {
      const res = await fetch(`${apiDomain}/v1/puzzles/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch puzzles: ${res.statusText}`);
      }
      const data = await res.json();
      const commonMessages = (
        await import(`@/locales/${locale || 'en'}/common.json`)
      ).default;
      const solvePuzzleMessages = (
        await import(`@/locales/${locale || 'en'}/solve-puzzle.json`)
      ).default;
      return {
        props: {
          puzzle: data,
          messages: {
            common: commonMessages,
            'solve-puzzle': solvePuzzleMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return { props: { puzzles: [] } }; // Fallback to empty puzzles
    }
  }
);

export default SolvePuzzlePage;
