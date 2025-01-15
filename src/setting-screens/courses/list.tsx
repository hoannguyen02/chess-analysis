import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Course } from '@/types/course';
import { PuzzleDifficulty } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { Button, Pagination, Spinner, Table } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import Select from 'react-select';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const CourseListScreen = () => {
  const { apiDomain, locale, tags: tagOptions } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');
  const [title, setTitle] = useState<string | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');

  // Options for Status
  const statusOptions = Statues.map((status) => ({
    value: status,
    label: status,
  }));

  // Options for Difficulty
  const difficultyOptions = Object.entries(LEVEL_RATING).map(
    ([rating, title]) => ({
      value: rating,
      label: title,
    })
  );

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      search: title,
      locale,
      page: currentPage,
      tags: tags.join(','),
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value)
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      )
      .join('&');

    return filteredQuery;
  }, [difficulty, status, title, locale, currentPage, tags]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/courses?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
    items: Course[];
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
        Course List{' '}
        <Button
          onClick={() => {
            router.push('/settings/courses/create');
          }}
        >
          Add new
        </Button>
      </TitlePage>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Title Search */}
        <div className="flex flex-col">
          Title:
          <DebouncedInput
            placeholder="Enter a title"
            initialValue={title}
            onChange={(value) => setTitle(value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col">
          Status:
          <Select
            options={statusOptions}
            value={statusOptions.find((option) => option.value === status)}
            onChange={(selectedOption) =>
              setStatus(selectedOption?.value as StatusType)
            }
            placeholder="Select status..."
            isClearable
          />
        </div>

        {/* Rating Filter */}
        <div className="flex flex-col">
          Rating:
          <Select
            options={difficultyOptions}
            value={difficultyOptions.find(
              (option) => option.value === difficulty
            )}
            onChange={(selectedOption) =>
              setDifficulty(selectedOption?.value as PuzzleDifficulty)
            }
            placeholder="Select rating..."
            isClearable
          />
        </div>

        {/* Tags Filter */}
        <div className="flex flex-col">
          Tags:
          <Select
            isMulti
            options={tagOptions}
            value={tagOptions.filter((option) => tags.includes(option.value))}
            onChange={(selectedOptions) =>
              setTags(selectedOptions.map((option) => option.value))
            }
            placeholder="Select tags..."
          />
        </div>
      </div>

      {/* Courses Table */}
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
            data.items.map((item, index) => (
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
                  <Link
                    href={`/settings/courses/${item._id}`}
                    className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                  >
                    Edit
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {/* Pagination */}
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
