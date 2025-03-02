import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { PhaseOptions, RatingOptions, StatusOptions } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { DifficultyType, PhaseType } from '@/types';
import { Puzzle, PuzzlePhase } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import axiosInstance from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { previewPuzzle } from '@/utils/previewPuzzle';
import { Button, Checkbox, Pagination, Spinner, Table } from 'flowbite-react';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { VscCopy } from 'react-icons/vsc';
import Select from 'react-select';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const PuzzleListScreen = () => {
  const { apiDomain, locale, themes: themeOptions } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [phase, setPhase] = useState<PuzzlePhase | ''>('');
  const [status, setStatus] = useState<StatusType | ''>('');
  const [themes, setThemes] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [isPublic, setIsPublic] = useState<boolean | undefined>();
  const [title, setTitle] = useState<string | ''>('');
  const [, setLoading] = useState(false);

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      phase,
      themes: themes.join(','),
      difficulty,
      status,
      page: currentPage,
      isPublic,
      title,
      locale,
    };

    return filteredQuery(queryObject);
  }, [phase, themes, difficulty, status, currentPage, isPublic, title, locale]);

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

  const duplicatePuzzle = async (puzzle: Puzzle) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title, _id, created_at, updated_at, solutions, ...rest } = puzzle;
    try {
      setLoading(true);
      const newPuzzleResult = await axiosInstance.post(
        `${apiDomain}/v1/puzzles`,
        {
          ...rest,
          title: {
            en: `${title?.en} (Copy)`,
            vi: `${title?.vi} (Copy)`,
          },
          status: 'Draft',
          solutions: [
            {
              player: 'user',
              moves: [
                {
                  move: 'd5',
                  from: 'c3',
                  to: 'd5',
                },
              ],
            },
          ], // Just default solution
        }
      );

      router.push(`/settings/puzzles/${newPuzzleResult.data._id}`);
    } catch (error) {
      console.error('Failed to duplicate puzzle', error);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Themes Filter */}
        <div className="flex flex-col">
          Themes:
          <Select
            isMulti
            options={themeOptions}
            value={themeOptions.filter((option) =>
              themes.includes(option.value)
            )}
            onChange={(selectedOptions) =>
              setThemes(selectedOptions.map((option) => option.value))
            }
            placeholder="Select themes..."
          />
        </div>
        {/* Status Filter */}
        <div className="flex flex-col">
          Status:
          <Select
            options={StatusOptions}
            value={StatusOptions.find((option) => option.value === status)}
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
            options={RatingOptions}
            value={RatingOptions.find((option) => option.value === difficulty)}
            onChange={(selectedOption) =>
              setDifficulty(selectedOption?.value as DifficultyType)
            }
            placeholder="Select rating..."
            isClearable
          />
        </div>
        {/* Phase Filter */}
        <div className="flex flex-col">
          Phase:
          <Select
            options={PhaseOptions}
            value={PhaseOptions.find((option) => option.value === difficulty)}
            onChange={(selectedOption) =>
              setPhase(selectedOption?.value as PhaseType)
            }
            placeholder="Select phase..."
            isClearable
          />
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
                    <Button
                      size="xs"
                      gradientDuoTone="cyanToBlue"
                      outline
                      onClick={() => previewPuzzle(puzzle)}
                    >
                      {locale === 'vi' ? 'Xem thử' : 'Preview'}
                    </Button>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="xs"
                      outline
                      onClick={() => duplicatePuzzle(puzzle)}
                    >
                      <VscCopy className="mr-2" />{' '}
                      {locale === 'vi' ? 'Tạo mới bản sao' : 'Create new copy'}
                    </Button>
                  </Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/settings/puzzles/${puzzle._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                    >
                      {locale === 'vi' ? 'Sửa thông tin' : 'Edit / Update'}
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
