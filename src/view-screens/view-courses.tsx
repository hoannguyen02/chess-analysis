import DebouncedInput from '@/components/DebounceInput';
import { PUZZLE_RATING } from '@/constants/puzzle';
import { useAppContext } from '@/contexts/AppContext';
import { Course } from '@/types/course';
import { PuzzleDifficulty } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import { Pagination, Select, Spinner, Table } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

export const ViewCoursesScreen = () => {
  const t = useTranslations();
  const { apiDomain, locale } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [title, setTitle] = useState<string | ''>('');
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
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
  }, [difficulty, title, locale, currentPage]);

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

  const onPageChange = (page: number) => setCurrentPage(page);

  if (error || !data) return <div>Error occurred</div>;

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col">
          <DebouncedInput
            placeholder={t('common.title.search')}
            initialValue={title}
            onChange={(value) => {
              setTitle(value);
            }}
          />
        </div>
        <div className="flex flex-col">
          {t('common.title.rating')}
          <Select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as PuzzleDifficulty)
            }
          >
            <option value="">{t('common.title.select-rating')}</option>
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
                    <Link
                      href={`/settings/courses/${item._id}`}
                      className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                    >
                      Edit
                    </Link>
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
