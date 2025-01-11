import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzleStatues } from '@/constants/puzzle';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import useDialog from '@/hooks/useDialog';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Course } from '@/types/course';
import { Lesson, LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import {
  Button,
  Checkbox,
  Label,
  Select,
  Textarea,
  TextInput,
} from 'flowbite-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import useSWR from 'swr';
import { AddToCoursesModal } from './AddToCoursesModal';
import { PuzzlesSearchModal } from './PuzzlesSearchModal';

type Props = {
  lesson?: LessonExpanded;
};

type LessonForm = Lesson & {
  puzzles: Puzzle[];
};
export const LessonFormScreen = ({ lesson }: Props) => {
  const { apiDomain, locale } = useAppContext();

  const {
    data: courses,
    error,
    isLoading,
    mutate: refreshCourses,
  } = useSWR<Course[]>(
    lesson?._id ? `${apiDomain}/v1/lessons/${lesson?._id}/courses` : undefined,
    fetcher
  );

  const [addPuzzlesPopup, setAddPuzzlePopup] = useState(false);
  const [addToCoursesPopup, setAddToCoursesPopup] = useState(false);
  const {
    open: isOpenContentPuzzle,
    data: addContentPuzzleData,
    onCloseDialog: closeContentPuzzleDialog,
    onOpenDialog: openContentPuzzleDialog,
  } = useDialog<{
    puzzles: Puzzle[];
    contentIdex: number;
  }>();

  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
  } = useForm<LessonForm>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    defaultValues: lesson
      ? {
          ...lesson,
          puzzles: lesson.puzzles.map((puzzle) => ({
            ...puzzle.puzzleId,
            puzzleId: puzzle.puzzleId._id,
          })),
        }
      : {
          status: 'Draft',
          difficulty: 'Easy',
        },
  });

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  const { fields: puzzleFields, remove: removePuzzle } = useFieldArray({
    control,
    name: 'puzzles',
  });

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control,
    name: 'contents',
  });

  // Handle form submission
  const onSubmit: SubmitHandler<LessonForm> = async (data) => {
    const { _id, puzzles, ...rest } = data;
    const puzzleIds = puzzles.map((p: Puzzle) => ({ puzzleId: p._id }));
    const payload = { ...rest, puzzles: puzzleIds };
    try {
      const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
      let request;
      if (_id) {
        request = fetch(`${apiDomain}/v1/lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        request = fetch(`${apiDomain}/v1/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const response = await request;
      if (response.ok) {
        await response.json();
        alert('Data submitted successfully');
      } else {
        console.error('Failed to submit data:', response.statusText);
        alert('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  const handlePreview = () => {
    const encodedData = encodeURIComponent(JSON.stringify(getValues()));
    window.open(`/lessons/preview?data=${encodedData}`, '_blank');
  };

  const router = useRouter();

  const reorderContents = (fromIndex: number, toIndex: number) => {
    const contents = watch('contents') || [];
    const updatedItems = [...contents];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('contents', updatedItems, {
      shouldDirty: true,
    });
  };

  const enObjectives = watch('objectives.en') || [];

  const addEnObjective = () => {
    const currentObjectives = watch('objectives.en') || [];
    const newObjectives = [...currentObjectives, ''];
    setValue('objectives.en', newObjectives, { shouldDirty: true });
  };

  const removeEnObjective = (index: number) => {
    const currentObjectives = watch('objectives.en') || [];
    const newObjectives = [...currentObjectives];
    newObjectives.splice(index, 1);
    setValue('objectives.en', newObjectives, { shouldDirty: true });
  };

  const reorderEnObjectives = (fromIndex: number, toIndex: number) => {
    const objectives = watch('objectives.en') || [];
    const updatedItems = [...objectives];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('objectives.en', updatedItems, {
      shouldDirty: true,
    });
  };

  const viObjectives = watch('objectives.vi') || [];

  const addViObjective = () => {
    const currentObjectives = watch('objectives.vi') || [];
    const newObjectives = [...currentObjectives, ''];
    setValue('objectives.vi', newObjectives, { shouldDirty: true });
  };

  const removeViObjective = (index: number) => {
    const currentObjectives = watch('objectives.vi') || [];
    const newObjectives = [...currentObjectives];
    newObjectives.splice(index, 1);
    setValue('objectives.vi', newObjectives, { shouldDirty: true });
  };

  const reorderViObjective = (fromIndex: number, toIndex: number) => {
    const objectives = watch('objectives.vi') || [];
    const updatedItems = [...objectives];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('objectives.vi', updatedItems, {
      shouldDirty: true,
    });
  };

  const reOrderPuzzles = (fromIndex: number, toIndex: number) => {
    const puzzles = watch('puzzles') || [];
    const updatedItems = [...puzzles];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('puzzles', updatedItems, {
      shouldDirty: true,
    });
  };

  return (
    <div className="">
      <TitlePage>Lesson Form</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="flex flex-col">
          <Label htmlFor="title" value="Title" />
          <TextInput
            id="title"
            type="text"
            placeholder="English title"
            {...register('title.en')}
            className="mb-2"
          />
          <TextInput
            id="title"
            type="text"
            placeholder="Vietnamese title"
            {...register('title.vi')}
          />
        </div>
        <div className="mt-4 grid grid-cols-2  place-content-start mb-4 gap-8">
          <div className="flex flex-col">
            <Label htmlFor="status" value="Status" />
            <Select id="status" required {...register('status')}>
              {PuzzleStatues.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col">
            <Label htmlFor="difficulty" value="Difficulty" />
            <Select id="difficulty" required {...register('difficulty')}>
              {Object.entries(PUZZLE_RATING).map(([rating, title]) => (
                <option key={rating} label={title}>
                  {rating}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div className="flex flex-col">
            <Label htmlFor="description" value="Description " />
            <TextInput
              id="description"
              type="text"
              placeholder="Description string"
              {...register('description')}
            />
          </div>
          <div className="flex items-center">
            <Label className="mr-2" htmlFor="isPublic" value="Public" />
            <Checkbox id="isPublic" {...register('isPublic')} />
          </div>
        </div>
        <div className="mb-4">
          English Objectives:
          <DndProvider backend={HTML5Backend}>
            {enObjectives.map((objective: string, index: number) => (
              <DraggableItem
                itemType="enObjectives"
                index={index}
                moveItem={reorderEnObjectives}
                key={`${index}-en-objective`}
                className="flex justify-between items-center mb-2"
              >
                <TextInput
                  className="w-[90%]"
                  {...register(`objectives.en.${index}`)}
                  defaultValue={objective}
                />
                <Button
                  outline
                  size="sm"
                  className="mt-2"
                  type="button"
                  onClick={() => removeEnObjective(index)}
                >
                  -
                </Button>
              </DraggableItem>
            ))}
          </DndProvider>
          <Button type="button" outline size="sm" onClick={addEnObjective}>
            Add english objective
          </Button>
        </div>
        <div className="mb-4">
          Vietnamese Objectives:
          <DndProvider backend={HTML5Backend}>
            {viObjectives.map((objective: string, index: number) => (
              <DraggableItem
                itemType="viObjectives"
                index={index}
                moveItem={reorderViObjective}
                key={`${index}-vi-objective`}
                className="flex justify-between items-center mb-2"
              >
                <TextInput
                  className="w-[90%]"
                  {...register(`objectives.vi.${index}`)}
                  defaultValue={objective}
                />
                <Button
                  outline
                  size="sm"
                  className="mt-2"
                  type="button"
                  onClick={() => removeViObjective(index)}
                >
                  -
                </Button>
              </DraggableItem>
            ))}
          </DndProvider>
          <Button type="button" outline size="sm" onClick={addViObjective}>
            Add vietnamese objective
          </Button>
        </div>
        <div className="mb-4">
          Contents:
          <DndProvider backend={HTML5Backend}>
            {contentFields.map((field, index) => (
              <DraggableItem
                itemType="contents"
                index={index}
                moveItem={reorderContents}
                key={field.id}
                className="mb-4"
              >
                <div className="grid grid-cols-[auto_50px] mb-2 gap-4 place-items-center">
                  <div className="flex flex-col w-full">
                    <Textarea
                      rows={3}
                      placeholder="English Content"
                      {...register(`contents.${index}.value.en`)}
                    />
                    <Textarea
                      rows={3}
                      placeholder="Vietnamese Content"
                      {...register(`contents.${index}.value.vi`)}
                    />
                    <div className="mt-2">
                      <div className="grid grid-cols-3">
                        <Label className="font-bold">Title</Label>
                        <Label className="font-bold">Difficulty</Label>
                        <Label></Label>
                      </div>
                      {field.contentPuzzles.map((p, pIndex) => (
                        <div
                          key={`content-puzzle-${index}-${pIndex}`}
                          className="grid grid-cols-3"
                        >
                          <Label>{p.puzzleId.title[locale]}</Label>
                          <Label>{p.puzzleId.difficulty}</Label>
                          <a
                            className="text-[12px] underline"
                            href={`/settings/puzzles/${p.puzzleId._id}`}
                            target="_blank"
                          >
                            Details
                          </a>
                        </div>
                      ))}
                      <Button
                        outline
                        className="mt-2"
                        type="button"
                        onClick={() => {
                          openContentPuzzleDialog({
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            puzzles: field.contentPuzzles,
                            contentIdex: index,
                          });
                        }}
                      >
                        Add puzzle
                      </Button>
                    </div>
                  </div>
                  <div className="">
                    <Button
                      outline
                      size="sm"
                      type="button"
                      onClick={() => removeContent(index)}
                    >
                      -
                    </Button>
                  </div>
                </div>
              </DraggableItem>
            ))}
          </DndProvider>
          <Button
            type="button"
            outline
            size="sm"
            onClick={() =>
              appendContent({
                type: 'text',
                value: {
                  en: '',
                  vi: '',
                },
                contentPuzzles: [],
              })
            }
          >
            Add content
          </Button>
        </div>

        <div className="mb-4">
          Puzzles:
          <div className="grid grid-cols-[50%_10%_25%_5%] mb-2 gap-4 place-items-center">
            <Label>Title</Label>
            <Label>Difficulty</Label>
            <Label>Status</Label>
            <Label>Actions</Label>
          </div>
          <DndProvider backend={HTML5Backend}>
            {puzzleFields.map((field, index) => {
              return (
                <DraggableItem
                  itemType="puzzles"
                  index={index}
                  moveItem={reOrderPuzzles}
                  key={field._id}
                  className="mb-4"
                >
                  <div className="grid grid-cols-[50%_10%_25%_5%] mb-2 gap-4 place-items-center">
                    <Label>{field.title[locale]}</Label>
                    <Label>{field.difficulty}</Label>
                    <Label>{field.status}</Label>
                    <div className="">
                      <Button
                        outline
                        size="sm"
                        type="button"
                        onClick={() => removePuzzle(index)}
                      >
                        -
                      </Button>
                    </div>
                  </div>
                </DraggableItem>
              );
            })}
          </DndProvider>
          <Button
            type="button"
            outline
            size="sm"
            onClick={() => {
              setAddPuzzlePopup(true);
            }}
          >
            Add puzzle
          </Button>
        </div>

        {courses && courses?.length > 0 && (
          <div className="mb-16">
            Courses:
            <div className="grid grid-cols-[70%_15%_15%] mb-2 gap-4">
              <Label className="font-bold">Title</Label>
              <Label className="font-bold">Difficulty</Label>
              <Label className="font-bold">Status</Label>
            </div>
            {courses.map((course, index) => (
              <div
                key={`course-${index}`}
                className="grid grid-cols-[70%_15%_15%] mb-2 gap-4"
              >
                <Label>{course.title}</Label>
                <Label>{course.difficulty}</Label>
                <Label>{course.status}</Label>
              </div>
            ))}
            <Button
              type="button"
              outline
              onClick={() => {
                setAddToCoursesPopup(true);
              }}
            >
              Add this lesson to another courses
            </Button>
          </div>
        )}

        <div className="flex mt-4">
          <Button
            className="mr-8"
            type="button"
            onClick={() => {
              router.push('/settings/lessons');
            }}
          >
            Back to the list
          </Button>
          <Button
            type="button"
            onClick={handlePreview}
            outline
            className="mr-8"
          >
            Preview
          </Button>
          <Button color="primary" type="submit">
            Submit
          </Button>
        </div>
      </form>
      {addPuzzlesPopup && (
        <PuzzlesSearchModal
          onClose={() => {
            setAddPuzzlePopup(false);
          }}
          selectedPuzzles={watch('puzzles')}
          onAddPuzzles={(puzzles: Puzzle[]) => {
            const currentPuzzles = watch('puzzles');
            const updatedPuzzles = [...currentPuzzles, ...puzzles];
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setValue('puzzles', updatedPuzzles, {
              shouldDirty: true,
            });
          }}
        />
      )}
      {isOpenContentPuzzle && (
        <PuzzlesSearchModal
          onClose={() => {
            closeContentPuzzleDialog();
          }}
          selectedPuzzles={addContentPuzzleData?.puzzles || []}
          onAddPuzzles={(addedItems: Puzzle[]) => {
            const { puzzles, contentIdex } = addContentPuzzleData || {};
            const contents = watch('contents') || [];
            const newContents = [...contents];
            if (contentIdex !== undefined && newContents[contentIdex]) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              newContents[contentIdex].contentPuzzles = (puzzles || []).concat(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                addedItems.map((p) => ({ puzzleId: p }))
              );
              setValue('contents', newContents, {
                shouldDirty: true,
              });
            }
          }}
        />
      )}
      {lesson?._id && addToCoursesPopup && (
        <AddToCoursesModal
          onClose={() => {
            setAddToCoursesPopup(false);
          }}
          selectedCourses={courses || []}
          lessonId={lesson?._id}
          onSaveSuccess={refreshCourses}
        />
      )}
    </div>
  );
};
