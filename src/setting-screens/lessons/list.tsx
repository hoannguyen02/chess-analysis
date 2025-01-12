import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzleStatues } from '@/constants/puzzle';
import { useAppContext } from '@/contexts/AppContext';
import { Lesson } from '@/types/lesson';
import { PuzzleDifficulty } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { Button, Pagination, Select, Spinner, Table } from 'flowbite-react';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const LessonsListScreen = () => {
  const { apiDomain, locale } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');
  const [title, setTitle] = useState<string | ''>('');
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      search: title,
      locale,
      page: currentPage,
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value) // Exclude undefined values
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      ) // Encode values for safety
      .join('&');

    return filteredQuery;
  }, [difficulty, status, title, locale, currentPage]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/lessons?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
    items: Lesson[];
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
        Lessons List{' '}
        <Button
          onClick={() => {
            router.push('/settings/lessons/create');
          }}
        >
          Add new
        </Button>
      </TitlePage>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col">
          Title:
          <DebouncedInput
            placeholder="Enter a title"
            initialValue={title}
            onChange={(value) => {
              setTitle(value);
            }}
          />
        </div>
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
      </div>
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Title</Table.HeadCell>
          <Table.HeadCell>Difficulty</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
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
            data.items.map((item, index) => {
              return (
                <Table.Row
                  key={`item-${index}`}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {item.title[locale]}
                  </Table.Cell>
                  <Table.Cell>{item.difficulty}</Table.Cell>
                  <Table.Cell>{item.status}</Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/settings/lessons/${item._id}`}
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
