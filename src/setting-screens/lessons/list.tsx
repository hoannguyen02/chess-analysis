import DebouncedInput from '@/components/DebounceInput';
import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { DifficultyType } from '@/types';
import { Lesson } from '@/types/lesson';
import { StatusType } from '@/types/status';
import axiosInstance from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { Button, Label, Pagination, Select, Spinner } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const LessonsListScreen = () => {
  const { apiDomain, locale } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');
  const [title, setTitle] = useState<string | ''>('');
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isReordered, setIsReordered] = useState(false);
  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      search: title,
      locale,
      page: currentPage,
    };

    return filteredQuery(queryObject);
  }, [difficulty, status, title, locale, currentPage]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/lessons?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading, mutate } = useSWR<{
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

  useEffect(() => {
    if (data?.items) {
      setLessons(data.items);
    }
  }, [data?.items]);

  const reOrderLessons = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...lessons];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    const prioritizedLessons = updatedItems.map((course, index) => ({
      ...course,
      priority: index + 1,
    }));
    setLessons(prioritizedLessons);
    setIsReordered(true);
  };

  const handleSaveOrder = async () => {
    try {
      await axiosInstance.post(`${apiDomain}/v1/lessons/reorder`, {
        lessons: lessons.map(({ _id, priority }) => ({ _id, priority })),
      });
      alert('Lessons order updated!');
      mutate();
      setIsReordered(false);
    } catch (error) {
      console.error('Failed to save course order', error);
    }
  };

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
            {Statues.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col">
          Rating:
          <Select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as DifficultyType)
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
      </div>
      {/* Courses Table */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-5 mb-4">
          <Label className="font-bold">Title</Label>
          <Label className="font-bold">Difficulty</Label>
          <Label className="font-bold">Status</Label>
          <Label className="font-bold">Actions</Label>
        </div>
        {isLoading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          lessons.map((item, index) => (
            <DraggableItem
              itemType="lessons"
              index={index}
              moveItem={reOrderLessons}
              key={`item-${index}`}
              className="mb-4"
            >
              <div className="grid grid-cols-5">
                <Label>{item.title[locale]}</Label>
                <Label>{item.difficulty}</Label>
                <Label>{item.status}</Label>
                <Link
                  href={`/lessons/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                >
                  Preview / Xem
                </Link>
                <Link
                  href={`/settings/lessons/${item._id}`}
                  className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                >
                  Edit
                </Link>
              </div>
            </DraggableItem>
          ))
        )}
      </DndProvider>

      <Button disabled={!isReordered} onClick={handleSaveOrder}>
        Save lessons
      </Button>
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
