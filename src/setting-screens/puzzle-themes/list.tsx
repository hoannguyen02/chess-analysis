import DebouncedInput from '@/components/DebounceInput';
import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { useAppContext } from '@/contexts/AppContext';
import { PaginatedList } from '@/types';
import { PuzzleTheme } from '@/types/puzzle-theme';
import axiosInstance from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { Button, Label, Spinner } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

export const PuzzleThemeListScreen = () => {
  const { apiDomain, locale } = useAppContext();
  const [title, setTitle] = useState<string | ''>('');
  const [puzzleThemes, setPuzzleThemes] = useState<PuzzleTheme[]>([]);
  const [isReordered, setIsReordered] = useState(false);
  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      locale,
      title,
    };

    return filteredQuery(queryObject);
  }, [title, locale]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/puzzle-themes?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading, mutate } = useSWR<PaginatedList<PuzzleTheme>>(
    queryKey,
    fetcher
  );

  useEffect(() => {
    if (data?.items) {
      setPuzzleThemes(data?.items);
    }
  }, [data, data?.items]);

  const router = useRouter();

  const reOrderPuzzleThemes = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...puzzleThemes];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    const prioritizedCourses = updatedItems.map((course, index) => ({
      ...course,
      priority: index + 1,
    }));
    setPuzzleThemes(prioritizedCourses);
    setIsReordered(true);
  };

  const handleSaveOrder = async () => {
    try {
      await axiosInstance.post(`${apiDomain}/v1/puzzle-themes/reorder`, {
        puzzleThemes: (puzzleThemes || []).map(({ _id, priority }) => ({
          _id,
          priority,
        })),
      });
      alert('Puzzle themes order updated!');
      mutate();
      setIsReordered(false);
    } catch (error) {
      console.error('Failed to save puzzle themes order', error);
    }
  };

  if (error || !data) return <div>Error occurred</div>;

  return (
    <>
      <TitlePage>
        Theme List{' '}
        <Button
          onClick={() => {
            router.push('/settings/puzzle-themes/create');
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
      {/* Themes Table */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-[auto_200px]">
          <Label>Title</Label>
          <Label>Actions</Label>
        </div>
        {isLoading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          puzzleThemes?.map((item, index) => (
            <DraggableItem
              itemType="puzzleThemes"
              index={index}
              moveItem={reOrderPuzzleThemes}
              key={`item-${index}`}
              className="mb-4"
            >
              <div className="grid grid-cols-[auto_100px_100px] items-center">
                <Label>{item.title[locale]}</Label>
                <div className="flex gap-2 items-center">
                  <Link
                    href={`/settings/puzzle-themes/${item._id}`}
                    className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                  >
                    Edit
                  </Link>
                  <Button
                    size="xs"
                    disabled={index === 0}
                    onClick={() => reOrderPuzzleThemes(index, index - 1)}
                  >
                    ↑ Move Up
                  </Button>
                  <Button
                    size="xs"
                    disabled={index === puzzleThemes.length - 1}
                    onClick={() => reOrderPuzzleThemes(index, index + 1)}
                  >
                    ↓ Move Down
                  </Button>
                </div>
              </div>
            </DraggableItem>
          ))
        )}
      </DndProvider>

      <Button disabled={!isReordered} onClick={handleSaveOrder}>
        Save themes
      </Button>
    </>
  );
};
