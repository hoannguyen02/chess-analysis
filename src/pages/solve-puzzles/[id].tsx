import PuzzleWithAttempts from '@/components/PuzzleWithAttempts';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

const SolvePuzzlePage = ({ puzzle }: any) => {
  return <PuzzleWithAttempts puzzle={puzzle} />;
};

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
  const { id } = context.params as { id: string };

  try {
    const res = await fetch(`${apiDomain}/v1/puzzles/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch puzzles: ${res.statusText}`);
    }
    const data = await res.json();
    return { props: { puzzle: data } };
  } catch (error) {
    console.error('Fetch error:', error);
    return { props: { puzzles: [] } }; // Fallback to empty puzzles
  }
};

export default SolvePuzzlePage;
