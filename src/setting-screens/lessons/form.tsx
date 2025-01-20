import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import useDialog from '@/hooks/useDialog';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { ObjectiveType } from '@/types';
import { Course } from '@/types/course';
import { ContentType, Lesson, LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import { previewPuzzle } from '@/utils/previewPuzzle';
import {
  Button,
  Card,
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
import {
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { VscAdd, VscOpenPreview, VscTrash } from 'react-icons/vsc';
import useSWR from 'swr';
import { AddToCoursesModal } from './AddToCoursesModal';
import { PuzzlesSearchModal } from './PuzzlesSearchModal';

type Props = {
  lesson?: LessonExpanded;
};

type LessonContent = {
  type: ContentType;
  title: {
    en: string;
    vi: string;
  };
  explanations?: { en: string[]; vi: string[] };
  contentPuzzles: Puzzle[];
};

type LessonForm = Lesson & {
  puzzles: Puzzle[];
  contents: LessonContent[];
  objectives?: ObjectiveType;
};

const ObjectivesSection = () => {
  const { watch, setValue, register } = useFormContext<LessonForm>();

  const addObjective = () => {
    const currentEn = watch('objectives.en') || [];
    const currentVi = watch('objectives.vi') || [];
    setValue('objectives.en', [...currentEn, ''], { shouldDirty: true });
    setValue('objectives.vi', [...currentVi, ''], { shouldDirty: true });
  };

  const removeObjective = (index: number) => {
    const currentEn = watch('objectives.en') || [];
    const currentVi = watch('objectives.vi') || [];
    const updatedEn = [...currentEn];
    const updatedVi = [...currentVi];
    updatedEn.splice(index, 1);
    updatedVi.splice(index, 1);
    setValue('objectives.en', updatedEn, { shouldDirty: true });
    setValue('objectives.vi', updatedVi, { shouldDirty: true });
  };

  return (
    <div className="mb-4">
      <Label value="Objectives" className="text-lg font-semibold" />
      {(watch('objectives.en') || []).map((_, index) => (
        <Card
          key={index}
          className="w-full p-4 shadow-sm border mb-3 hover:shadow-md transition duration-200"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="flex-grow grid grid-cols-2 gap-4">
              <Textarea
                rows={2}
                placeholder="English Objective"
                {...register(`objectives.en.${index}`)}
                defaultValue={watch(`objectives.en.${index}`)}
                className="w-full"
              />
              <Textarea
                rows={2}
                placeholder="Vietnamese Objective"
                {...register(`objectives.vi.${index}`)}
                defaultValue={watch(`objectives.vi.${index}`)}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              color="failure"
              size="xs"
              onClick={() => removeObjective(index)}
              className="p-2 hover:bg-red-600 hover:text-white transition duration-150"
            >
              <VscTrash className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      ))}
      <Button
        type="button"
        outline
        size="sm"
        onClick={addObjective}
        className="mt-2 w-full flex items-center justify-center hover:bg-gray-100 transition duration-150"
      >
        <VscAdd className="h-5 w-5 mr-1" /> Add Objective
      </Button>
    </div>
  );
};

const ContentExplanations = ({ contentIndex }: { contentIndex: number }) => {
  const { watch, setValue, register } = useFormContext<LessonForm>();

  const addExplanation = () => {
    const currentEn = watch(`contents.${contentIndex}.explanations.en`) || [];
    const currentVi = watch(`contents.${contentIndex}.explanations.vi`) || [];
    setValue(`contents.${contentIndex}.explanations.en`, [...currentEn, ''], {
      shouldDirty: true,
    });
    setValue(`contents.${contentIndex}.explanations.vi`, [...currentVi, ''], {
      shouldDirty: true,
    });
  };

  const removeExplanation = (index: number) => {
    const currentEn = watch(`contents.${contentIndex}.explanations.en`) || [];
    const currentVi = watch(`contents.${contentIndex}.explanations.vi`) || [];
    const updatedEn = [...currentEn];
    const updatedVi = [...currentVi];
    updatedEn.splice(index, 1);
    updatedVi.splice(index, 1);
    setValue(`contents.${contentIndex}.explanations.en`, updatedEn, {
      shouldDirty: true,
    });
    setValue(`contents.${contentIndex}.explanations.vi`, updatedVi, {
      shouldDirty: true,
    });
  };

  return (
    <div className="mt-4 mb-4">
      <Label value="Explanations" className="text-lg font-semibold" />
      {(watch(`contents.${contentIndex}.explanations.en`) || []).map(
        (_, index) => (
          <Card
            key={index}
            className="w-full p-4 shadow-sm border mb-3 hover:shadow-md transition duration-200"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="flex-grow grid grid-cols-2 gap-4">
                <Textarea
                  rows={2}
                  placeholder="English Explanation"
                  {...register(
                    `contents.${contentIndex}.explanations.en.${index}`
                  )}
                  defaultValue={watch(
                    `contents.${contentIndex}.explanations.en.${index}`
                  )}
                  className="w-full"
                />
                <Textarea
                  rows={2}
                  placeholder="Vietnamese Explanation"
                  {...register(
                    `contents.${contentIndex}.explanations.vi.${index}`
                  )}
                  defaultValue={watch(
                    `contents.${contentIndex}.explanations.vi.${index}`
                  )}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                color="failure"
                size="xs"
                onClick={() => removeExplanation(index)}
                className="p-2 hover:bg-red-600 hover:text-white transition duration-150"
              >
                <VscTrash className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        )
      )}
      <Button
        type="button"
        outline
        size="sm"
        onClick={addExplanation}
        className="mt-2 w-full flex items-center justify-center hover:bg-gray-100 transition duration-150"
      >
        <VscAdd className="h-5 w-5 mr-1" /> Add Explanation
      </Button>
    </div>
  );
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

  const buildInitialLessonForm = (lesson: LessonExpanded) => {
    return {
      ...lesson,
      puzzles: lesson.puzzles.map((puzzle) => ({
        ...puzzle.puzzleId,
        puzzleId: puzzle.puzzleId._id,
      })),
      contents: lesson.contents?.map((content) => ({
        ...content,
        contentPuzzles: content.contentPuzzles.map((p) => ({
          ...p.puzzleId,
          puzzleId: p.puzzleId._id,
        })),
      })),
    };
  };

  const methods = useForm<LessonForm>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    defaultValues: lesson
      ? buildInitialLessonForm(lesson)
      : {
          status: 'Draft',
          difficulty: 'Easy',
        },
  });

  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
    reset,
  } = methods;

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
    const { _id, puzzles, contents, ...rest } = data;
    const puzzleIds = puzzles.map((p: Puzzle) => ({ puzzleId: p._id }));
    const newContents = contents.map((p) => ({
      ...p,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      contentPuzzles: p.contentPuzzles.map((cp: Puzzle) => ({
        puzzleId: cp._id,
      })),
    }));
    const payload = { ...rest, puzzles: puzzleIds, contents: newContents };
    try {
      const apiDomain = process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN;
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
        if (!_id) {
          router.push(`/settings/lessons/${data._id}`);
        }
      } else {
        console.error('Failed to submit data:', response.statusText);
        alert('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
    }
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

  const reOrderPuzzles = (fromIndex: number, toIndex: number) => {
    const puzzles = watch('puzzles') || [];
    const updatedItems = [...puzzles];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('puzzles', updatedItems, {
      shouldDirty: true,
    });
  };

  const removeContentPuzzle = (contentIndex: number, puzzleIndex: number) => {
    const contents = watch('contents') || [];
    const updatedContents = [...contents];

    if (
      updatedContents[contentIndex] &&
      updatedContents[contentIndex].contentPuzzles
    ) {
      updatedContents[contentIndex].contentPuzzles.splice(puzzleIndex, 1);
      setValue('contents', updatedContents, { shouldDirty: true });
    }
  };

  return (
    <div className="">
      <TitlePage>Lesson Form</TitlePage>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="">
          <div className="flex flex-col">
            <Label value="Title" />
            <TextInput
              type="text"
              placeholder="English title"
              {...register('title.en')}
              className="mb-2"
            />
            <TextInput
              type="text"
              placeholder="Vietnamese title"
              {...register('title.vi')}
            />
          </div>
          <div className="mt-4 grid grid-cols-2  place-content-start mb-4 gap-8">
            <div className="flex flex-col">
              <Label htmlFor="status" value="Status" />
              <Select id="status" required {...register('status')}>
                {Statues.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col">
              <Label htmlFor="difficulty" value="Difficulty" />
              <Select id="difficulty" required {...register('difficulty')}>
                {Object.entries(LEVEL_RATING).map(([rating, title]) => (
                  <option key={rating} label={title}>
                    {rating}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2  place-content-start mb-4 gap-8">
            <div className="flex flex-col">
              <Label value="Description" />
              <Textarea
                placeholder="English Description"
                {...register('description.en')}
                className="mb-2"
                rows={3}
              />
              <Textarea
                placeholder="Vietnamese Description"
                rows={3}
                {...register('description.vi')}
              />
            </div>
            <div className="flex items-center">
              <Label className="mr-2" htmlFor="isPublic" value="Public" />
              <Checkbox id="isPublic" {...register('isPublic')} />
            </div>
          </div>
          <ObjectivesSection />
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
                        placeholder="English title"
                        {...register(`contents.${index}.title.en`)}
                        className="mb-2"
                      />
                      <Textarea
                        rows={3}
                        placeholder="Vietnamese title"
                        {...register(`contents.${index}.title.vi`)}
                      />
                      <ContentExplanations contentIndex={index} />
                      <h2 className="mt-2">Puzzles/Challenges</h2>
                      <div>
                        <div className="grid grid-cols-3">
                          <Label className="font-bold">Title</Label>
                          <Label className="font-bold">Difficulty</Label>
                          <Label>Actions</Label>
                        </div>

                        {field.contentPuzzles.map((p, pIndex) => (
                          <div
                            key={`content-puzzle-${index}-${pIndex}`}
                            className="grid grid-cols-3 mb-2"
                          >
                            <Label>{p.title?.[locale]}</Label>
                            <Label>{p.difficulty}</Label>
                            <div className="flex">
                              <Button
                                outline
                                size="sm"
                                onClick={() => {
                                  previewPuzzle(p);
                                }}
                                className="mr-2"
                              >
                                <VscOpenPreview />
                              </Button>
                              <Button
                                outline
                                size="sm"
                                type="button"
                                onClick={() =>
                                  removeContentPuzzle(index, pIndex)
                                }
                              >
                                -
                              </Button>
                            </div>
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
                          Add puzzle for content
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
            <div className="flex items-center">
              <Button
                type="button"
                outline
                className="w-full"
                onClick={() =>
                  appendContent({
                    type: 'text',
                    title: {
                      en: '',
                      vi: '',
                    },
                    contentPuzzles: [],
                  })
                }
              >
                <VscAdd className="text-[20px]" /> Add content
              </Button>
            </div>
          </div>

          <div className="mb-4">
            Puzzles:
            <div className="grid grid-cols-[45%_10%_25%_10%] mb-2 gap-4 place-items-center">
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
                    <div className="grid grid-cols-[45%_10%_25%_10%] mb-2 gap-4 place-items-center">
                      <Label>{field?.title?.[locale]}</Label>
                      <Label>{field.difficulty}</Label>
                      <Label>{field.status}</Label>
                      <div className="flex">
                        <Button
                          outline
                          size="sm"
                          onClick={() => previewPuzzle(field)}
                          className="mr-2"
                        >
                          <VscOpenPreview />
                        </Button>
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
            <div className="flex items-center">
              <Button
                type="button"
                outline
                className="w-full"
                onClick={() => {
                  setAddPuzzlePopup(true);
                }}
              >
                <VscAdd className="text-[20px]" /> Add puzzle
              </Button>
            </div>
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
                  <Label>{course.title[locale]}</Label>
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
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                previewPuzzle(getValues() as Puzzle);
              }}
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
      </FormProvider>
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
                addedItems.map((p) => ({ ...p, puzzleId: p.puzzleId }))
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
