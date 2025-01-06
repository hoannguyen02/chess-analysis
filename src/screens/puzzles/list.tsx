import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzlePhases, PuzzleStatues } from '@/constants/puzzle';
import { useAppContext } from '@/contexts/AppContext';
import { Puzzle, PuzzleDifficulty, PuzzlePhase } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import {
  Button,
  Checkbox,
  Pagination,
  Select,
  Spinner,
  Table,
} from 'flowbite-react';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const PuzzleListScreen = () => {
  const { themes, apiDomain, themeMap } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [phase, setPhase] = useState<PuzzlePhase | ''>('');
  const [status, setStatus] = useState<StatusType | ''>('');
  const [theme, setTheme] = useState<string | ''>('');
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');
  const [isPublic, setIsPublic] = useState<boolean | undefined>();

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      phase,
      theme,
      difficulty,
      status,
      page: currentPage,
      isPublic,
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value) // Exclude undefined values
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      ) // Encode values for safety
      .join('&');

    return filteredQuery;
  }, [currentPage, phase, status, theme, difficulty, isPublic]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/puzzles?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
    items: Puzzle[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
    nextPage: number;
    prevPage: number;
    lastPage: number;
  }>(queryKey, fetcher);

  const router = useRouter();

  const onPageChange = (page: number) => setCurrentPage(page);

  if (error || !data) return <div>Error occurred</div>;

  return (
    <>
      <TitlePage>
        Puzzle List{' '}
        <Button
          onClick={() => {
            router.push('/puzzles/create');
          }}
        >
          Add new
        </Button>
      </TitlePage>
      <div className="flex flex-col">
        Public:
        <Checkbox
          checked={isPublic}
          onChange={(event) => {
            setIsPublic(event.target.checked);
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col">
          Status:
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusType)}
          >
            <option value="">Select a status</option>
            {PuzzleStatues.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col">
          Theme:
          <Select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="">Select a theme</option>
            {themes.map((theme, idx) => (
              <option key={`${theme.code}-${idx}`} label={theme.title}>
                {theme.code}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col">
          Rating:
          <Select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as PuzzleDifficulty)
            }
          >
            <option value="">Select a rating</option>
            {Object.entries(PUZZLE_RATING).map(([rating, title]) => (
              <option key={rating} label={title}>
                {rating}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col">
          Phase:
          <Select
            value={phase}
            onChange={(event) => setPhase(event.target.value as PuzzlePhase)}
          >
            <option value="">Select a phase</option>
            {PuzzlePhases.map((phase) => (
              <option key={phase}>{phase}</option>
            ))}
          </Select>
        </div>
      </div>
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Theme</Table.HeadCell>
          <Table.HeadCell>Phase</Table.HeadCell>
          <Table.HeadCell>Difficulty</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Public</Table.HeadCell>
          <Table.HeadCell>
            <span className="sr-only">Edit</span>
          </Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {isLoading ? (
            <div className="text-center">
              <Spinner />
            </div>
          ) : (
            data.items.map((puzzle, index) => {
              return (
                <Table.Row
                  key={`puzzle-${index}`}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {themeMap[puzzle.theme]?.title || puzzle.theme}
                  </Table.Cell>
                  <Table.Cell>{puzzle.phase}</Table.Cell>
                  <Table.Cell>{puzzle.difficulty}</Table.Cell>
                  <Table.Cell>
                    <Checkbox checked={puzzle.isPublic} />
                  </Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/puzzles/${puzzle._id}`}
                      className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                    >
                      Edit
                    </a>
                  </Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>
      <div className="flex justify-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={data.total}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};
