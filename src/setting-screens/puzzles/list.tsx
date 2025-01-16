import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Phases, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Puzzle, PuzzleDifficulty, PuzzlePhase } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { filteredQuery } from '@/utils/filteredQuery';
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
  const { themes, apiDomain, locale } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [phase, setPhase] = useState<PuzzlePhase | ''>('');
  const [status, setStatus] = useState<StatusType | ''>('');
  const [theme, setTheme] = useState<string | ''>('');
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');
  const [isPublic, setIsPublic] = useState<boolean | undefined>();
  const [title, setTitle] = useState<string | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      phase,
      theme,
      difficulty,
      status,
      page: currentPage,
      isPublic,
      search: title,
    };

    return filteredQuery(queryObject);
  }, [phase, theme, difficulty, status, currentPage, isPublic, title]);

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
            router.push('/settings/puzzles/create');
          }}
        >
          Add new
        </Button>
      </TitlePage>
      {/* Title Search */}
      <div className="flex flex-col mb-2">
        Title:
        <DebouncedInput
          placeholder="Enter a title"
          initialValue={title}
          onChange={(value) => setTitle(value)}
        />
      </div>
      <div className="flex flex-col mb-2">
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
            {Statues.map((status) => (
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
              <option key={`${theme.code}-${idx}`} label={theme.title[locale]}>
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
            {Object.entries(LEVEL_RATING).map(([rating, title]) => (
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
            {Phases.map((phase) => (
              <option key={phase}>{phase}</option>
            ))}
          </Select>
        </div>
      </div>
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Title</Table.HeadCell>
          <Table.HeadCell>Difficulty</Table.HeadCell>
          <Table.HeadCell></Table.HeadCell>
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
                  <Table.Cell>{puzzle?.title?.[locale]}</Table.Cell>
                  <Table.Cell>{puzzle.difficulty}</Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/settings/puzzles/${puzzle._id}`}
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
          totalPages={data.lastPage}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};
