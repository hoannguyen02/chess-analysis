import Layout from '@/components/Layout';
import { PuzzleFormScreen } from '@/screens/puzzles/puzzle-form';
import { Puzzle } from '@/types/puzzle';
import { PuzzleTheme } from '@/types/puzzle-theme';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  puzzle: Puzzle;
  themes: PuzzleTheme[];
};
const PuzzlePage = ({ puzzle, themes }: Props) => {
  return (
    <Layout>
      <PuzzleFormScreen themes={themes} puzzle={puzzle} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
  const { id } = context.params as { id: string };

  try {
    // Perform both requests concurrently using Promise.all
    const [res, themeRes] = await Promise.all([
      fetch(`${apiDomain}/v1/puzzles/${id}`),
      fetch(`${apiDomain}/v1/puzzle-themes`),
    ]);

    // Check if both requests are successful
    if (!res.ok || !themeRes.ok) {
      throw new Error(
        `Failed to fetch data: ${res.statusText} or ${themeRes.statusText}`
      );
    }

    // Parse JSON responses for both requests
    const data = await res.json();
    const themes = await themeRes.json();

    // Return the combined props
    return { props: { puzzle: data, themes } };
  } catch (error) {
    console.error('Fetch error:', error);
    return { props: { puzzles: [], themes: [] } }; // Fallback to empty arrays
  }
};

export default PuzzlePage;
