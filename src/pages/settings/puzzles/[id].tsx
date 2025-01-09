import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { PuzzleFormScreen } from '@/screens/puzzles/form';
import { Puzzle } from '@/types/puzzle';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  puzzle: Puzzle;
};
const PuzzlePage = ({ puzzle }: Props) => {
  return (
    <Layout>
      <PuzzleFormScreen puzzle={puzzle} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
    const { id } = context.params as { id: string };

    try {
      const res = await fetch(`${apiDomain}/v1/puzzles/${id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }

      const data = await res.json();

      return { props: { puzzle: data } };
    } catch (error) {
      console.error('Fetch error:', error);
      return { props: { puzzles: [] } };
    }
  }
);

export default PuzzlePage;
