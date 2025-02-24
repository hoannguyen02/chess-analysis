/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { RatingOptions, StatusOptions } from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import useDialog from '@/hooks/useDialog';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { ContentType, Lesson, LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { PuzzleTheme } from '@/types/puzzle-theme';
import { Tag } from '@/types/tag';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { previewPuzzle } from '@/utils/previewPuzzle';
import {
  Button,
  Card,
  Checkbox,
  Label,
  Textarea,
  TextInput,
  Tooltip,
} from 'flowbite-react';
import { isEmpty } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { VscAdd, VscEdit, VscOpenPreview, VscTrash } from 'react-icons/vsc';
import Select, { SingleValue } from 'react-select';
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
  // objectives?: ObjectiveType;
  tags: Tag[];
  themes: PuzzleTheme[];
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
            className="w-full shadow-sm border mb-3 hover:shadow-md transition duration-200"
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
  const {
    apiDomain,
    locale,
    tags: defaultTags,
    themes: defaultThemes,
  } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const t = useTranslations();

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
    // @ts-ignore
    defaultValues: lesson
      ? buildInitialLessonForm(lesson)
      : {
          status: 'Active',
          difficulty: 'Easy',
        },
  });

  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { isDirty }, // Access form errors
    watch,
    setValue,
  } = methods;

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  // const { fields: puzzleFields, remove: removePuzzle } = useFieldArray({
  //   control,
  //   name: 'puzzles',
  // });

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
    const { _id, contents, tags, themes, ...rest } = data;
    const tagIds = tags?.map((tag: Tag) => tag._id);
    const themeIds = themes?.map((theme: PuzzleTheme) => theme._id);

    const newContents = contents.map((p) => {
      if (!p.contentPuzzles || p.contentPuzzles.length === 0) {
        alert(`Missing puzzles for content, ${p.title[locale]}`);
        throw new Error(`Missing puzzles for content, ${p.title[locale]}`);
      }

      return {
        ...p,
        contentPuzzles: p.contentPuzzles
          ? //@ts-ignore
            p.contentPuzzles.map((cp: Puzzle) => ({
              puzzleId: cp._id,
            }))
          : [],
      };
    });
    const payload = {
      ...rest,
      contents: newContents,
      tags: tagIds,
      themes: themeIds,
    };
    setIsSubmitting(true);
    const result = await handleSubmission(
      async () => {
        if (_id) {
          return await axiosInstance.put(
            `${apiDomain}/v1/lessons/${_id}`,
            payload
          );
        } else {
          return await axiosInstance.post(`${apiDomain}/v1/lessons`, payload);
        }
      },
      addToast, // Pass addToast to show toast notifications
      t('common.title.success') // Success message
    );

    setIsSubmitting(false);

    if (result !== undefined && !_id) {
      const data = result.data;
      router.push(`/settings/lessons/${data._id}`);
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

  // const reOrderPuzzles = (fromIndex: number, toIndex: number) => {
  //   const puzzles = watch('puzzles') || [];
  //   const updatedItems = [...puzzles];
  //   const [movedItem] = updatedItems.splice(fromIndex, 1);
  //   updatedItems.splice(toIndex, 0, movedItem);
  //   setValue('puzzles', updatedItems, {
  //     shouldDirty: true,
  //   });
  // };

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

  const reorderPuzzles = (
    fromIndex: number,
    toIndex: number,
    contentIdx: number
  ) => {
    // Clone the content puzzles
    const newPuzzles = cloneDeep(
      watch(`contents.${contentIdx}.contentPuzzles`)
    );

    // Create a new array for updated puzzles
    const updatedPuzzles = [...newPuzzles];
    // console.log('Before splice:', newPuzzles, updatedPuzzles);
    const [movedPuzzle] = updatedPuzzles.splice(fromIndex, 1); // Remove the item
    // console.log('After splice:', updatedPuzzles);
    updatedPuzzles.splice(toIndex, 0, movedPuzzle); // Insert the item

    // Update the form state with the reordered puzzles
    setValue(`contents.${contentIdx}.contentPuzzles`, updatedPuzzles, {
      shouldDirty: true,
    });

    // Force a re-render
    setValue(`contents`, cloneDeep(watch('contents')), { shouldDirty: true });
  };

  const moveContentUp = (index: number) => {
    if (index > 0) {
      reorderContents(index, index - 1);
    }
  };

  const moveContentDown = (index: number) => {
    const contents = watch('contents') || [];
    if (index < contents.length - 1) {
      reorderContents(index, index + 1);
    }
  };

  const handlePreviewLesson = useCallback(() => {
    if (isEmpty(lesson)) {
      alert('Need to save lesson as Draft status first then preview/xem');
      return;
    }
    window.open(`/lessons/${lesson.slug}`, '_blank');
  }, [lesson]);

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
          <div className="mt-4 grid grid-cols-4  place-content-start mb-4 gap-8">
            <div className="flex flex-col">
              <Label htmlFor="themes" value="Themes" />

              <Controller
                control={control}
                name="themes"
                render={({ field }) => (
                  <Select
                    id="themes"
                    isMulti
                    options={defaultThemes}
                    value={defaultThemes.filter((option) =>
                      field.value?.some((selected) => {
                        // @ts-ignore
                        return selected._id === option._id;
                      })
                    )}
                    onChange={(selectedOptions) =>
                      field.onChange(selectedOptions)
                    }
                    getOptionLabel={(e) => e.label}
                    getOptionValue={(e) => e._id}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="tags" value="Tags" />

              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <Select
                    id="themes"
                    isMulti
                    options={defaultTags}
                    value={defaultTags.filter((option) =>
                      field.value?.some((selected) => {
                        // @ts-ignore
                        return selected._id === option._id;
                      })
                    )}
                    onChange={(selectedOptions) =>
                      field.onChange(selectedOptions)
                    }
                    getOptionLabel={(e) => e.label}
                    getOptionValue={(e) => e._id}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="status" value="Status" />
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    id="status"
                    options={StatusOptions}
                    value={StatusOptions.find(
                      (option) => option.value === field.value
                    )}
                    onChange={(
                      selectedOption: SingleValue<{
                        value: string;
                        label: string;
                      }>
                    ) => field.onChange(selectedOption?.value)}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="difficulty" value="Difficulty" />
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Select
                    id="difficulty"
                    options={RatingOptions}
                    value={
                      RatingOptions.find(
                        (option) => option.value === field.value
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      field.onChange(selectedOption?.value)
                    }
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2  place-content-start mb-4 gap-8">
            <div className="flex flex-col">
              <Label value="Description - Meta tag" />
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
          <div className="mb-4">
            Contents:
            <DndProvider backend={HTML5Backend}>
              {contentFields.map((field, index) => {
                return (
                  <DraggableItem
                    itemType="contents"
                    index={index}
                    moveItem={reorderContents}
                    key={field.id}
                    className="mb-4"
                  >
                    <div className="grid grid-cols-[auto_100px] mb-2 gap-4 place-items-center">
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
                          <div className="grid grid-cols-4">
                            <Label className="font-bold">Index</Label>
                            <Label className="font-bold">Title</Label>
                            <Label className="font-bold">Difficulty</Label>
                            <Label>Actions</Label>
                          </div>
                          <DndProvider backend={HTML5Backend}>
                            {field.contentPuzzles.map((puzzle, puzzleIndex) => (
                              <DraggableItem
                                key={`content-puzzle-${index}-${puzzleIndex}`}
                                itemType={`contentPuzzles-${index}`}
                                index={puzzleIndex}
                                moveItem={(fromIndex, toIndex) =>
                                  reorderPuzzles(fromIndex, toIndex, index)
                                }
                              >
                                <div className="grid grid-cols-4 mb-2">
                                  <Label>{puzzleIndex + 1}</Label>
                                  <Label>{puzzle.title?.[locale]}</Label>
                                  <Label>{puzzle.difficulty}</Label>
                                  <div className="flex items-center">
                                    <Tooltip content="Xem">
                                      <Button
                                        outline
                                        size="sm"
                                        onClick={() => {
                                          previewPuzzle(puzzle);
                                        }}
                                        className="mr-2"
                                      >
                                        <VscOpenPreview />
                                      </Button>
                                    </Tooltip>
                                    <Tooltip content="Sửa">
                                      <Button
                                        outline
                                        size="sm"
                                        onClick={() => {
                                          window.open(
                                            `/settings/puzzles/${puzzle._id}`,
                                            '_blank'
                                          );
                                        }}
                                        className="mr-2"
                                      >
                                        <VscEdit />
                                      </Button>
                                    </Tooltip>
                                    <Tooltip content="xoá">
                                      <Button
                                        outline
                                        size="sm"
                                        type="button"
                                        onClick={() =>
                                          removeContentPuzzle(
                                            index,
                                            puzzleIndex
                                          )
                                        }
                                      >
                                        -
                                      </Button>
                                    </Tooltip>
                                  </div>
                                </div>
                              </DraggableItem>
                            ))}
                          </DndProvider>
                          <Button
                            outline
                            className="mt-2"
                            type="button"
                            onClick={() => {
                              openContentPuzzleDialog({
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
                      <div className="flex flex-col justify-center">
                        <Button
                          outline
                          size="xs"
                          type="button"
                          className="mb-2"
                          onClick={() => moveContentUp(index)}
                          disabled={index === 0} // Disable if it's the first item
                        >
                          ↑ Move Up
                        </Button>
                        <Button
                          outline
                          size="xs"
                          type="button"
                          className="mb-2"
                          onClick={() => moveContentDown(index)}
                          disabled={index === contentFields.length - 1} // Disable if it's the last item
                        >
                          ↓ Move Down
                        </Button>
                        <Button
                          outline
                          size="sm"
                          color="warning"
                          type="button"
                          onClick={() => removeContent(index)}
                        >
                          Delete content
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

          <div className="flex mt-4">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                router.push('/settings/lessons');
              }}
            >
              Back to the list
            </Button>
            <Button className="mx-8" onClick={handlePreviewLesson}>
              Preview / Xem trước
            </Button>
            <Button disabled={isSubmitting} color="primary" type="submit">
              Submit
            </Button>
          </div>
        </form>
      </FormProvider>
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
              // @ts-ignore
              newContents[contentIdex].contentPuzzles = (puzzles || []).concat(
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
    </div>
  );
};
