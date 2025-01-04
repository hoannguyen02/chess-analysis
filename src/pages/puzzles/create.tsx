import Layout from '@/components/Layout';
import { CreatePuzzleScreen } from '@/screens/puzzles/create/create-puzzle-screen';
import { PuzzleTheme } from '@/types/puzzle-theme';
import { GetServerSideProps } from 'next';

type Props = {
  themes: PuzzleTheme[];
};
const CreatePuzzlePage = ({ themes }: Props) => {
  return (
    <Layout>
      <CreatePuzzleScreen themes={themes} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;

  try {
    const res = await fetch(`${apiDomain}/v1/puzzle-themes`);
    if (!res.ok) {
      throw new Error(`Failed to fetch puzzle themes: ${res.statusText}`);
    }
    const data = await res.json();
    return { props: { themes: data } };
  } catch (error) {
    console.error('Fetch error:', error);
    return { props: { themes: [] } }; // Fallback to empty puzzles
  }
};

export default CreatePuzzlePage;
