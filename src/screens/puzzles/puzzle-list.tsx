import useSWR from 'swr';
import { fetcher } from './fetcher';
import { useAppContext } from '@/contexts/AppContext';

export const PuzzleListScreen = () => {
  const { apiDomain } = useAppContext();
  const { data, error, isLoading } = useSWR(`${apiDomain}/v1/puzzles`, fetcher);
  console.log('data', data);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error occurred</div>;
  return <>PuzzleListScreen</>;
};
