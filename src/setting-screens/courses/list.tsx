import DebouncedInput from '@/components/DebounceInput';
import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Course } from '@/types/course';
import { PuzzleDifficulty } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { filteredQuery } from '@/utils/filteredQuery';
import axios from 'axios';
import { Button, Label, Pagination, Spinner } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [isReordered, setIsReordered] = useState(false);

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

    return filteredQuery(queryObject);
  }, [difficulty, status, title, locale, currentPage, tags]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/courses?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading, mutate } = useSWR<{
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

  useEffect(() => {
    if (data?.items) {
      setCourses(data.items);
    }
  }, [data?.items]);

  const onPageChange = (page: number) => setCurrentPage(page);

  const reOrderCourses = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...courses];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    const prioritizedCourses = updatedItems.map((course, index) => ({
      ...course,
      priority: index + 1,
    }));
    setCourses(prioritizedCourses);
    setIsReordered(true);
  };

  const handleSaveOrder = async () => {
    try {
      await axios.post(`${apiDomain}/v1/courses/reorder`, {
        courses: courses.map(({ _id, priority }) => ({ _id, priority })),
      });
      alert('Courses order updated!');
      mutate();
      setIsReordered(false);
    } catch (error) {
      console.error('Failed to save course order', error);
    }
  };

  if (error || !courses.length) return <div>Error occurred</div>;

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
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-4">
          <Label>Title</Label>
          <Label>Difficulty</Label>
          <Label>Status</Label>
          <Label>Actions</Label>
        </div>
        {isLoading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          courses.map((item, index) => (
            <DraggableItem
              itemType="courses"
              index={index}
              moveItem={reOrderCourses}
              key={`item-${index}`}
              className="mb-4"
            >
              <div className="grid grid-cols-4">
                <Label>{item.title[locale]}</Label>
                <Label>{item.difficulty}</Label>
                <Label>{item.status}</Label>
                <Link
                  href={`/settings/courses/${item._id}`}
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
        Save courses
      </Button>

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
