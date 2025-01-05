import useSWR from 'swr';
import { fetcher } from './fetcher';
import { useAppContext } from '@/contexts/AppContext';
import { useMemo, useState } from 'react';
import { PuzzleDifficulty, PuzzlePhase, PuzzleStatus } from '@/types/puzzle';
import { PuzzleTheme } from '@/types/puzzle-theme';

export const PuzzleListScreen = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [phase, setPhase] = useState<PuzzlePhase | undefined>();
  const [status, setStatus] = useState<PuzzleStatus | undefined>();
  const [theme, setTheme] = useState<PuzzleTheme | undefined>();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | undefined>();

  const queryString = useMemo(() => {
    return `phase=${phase}&theme=${theme}&difficulty=${difficulty}&status=${status}&page=${currentPage}`;
  }, [phase, theme, difficulty, status, currentPage]);

  const { apiDomain } = useAppContext();
  const { data, error, isLoading } = useSWR(
    `${apiDomain}/v1/puzzles?${queryString}`,
    fetcher
  );
  console.log('data', data);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error occurred</div>;
  return <>PuzzleListScreen</>;
};
