/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { RatingOptions, StatusOptions } from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Course, CourseExpanded } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { Tag } from '@/types/tag';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import {
  Button,
  Card,
  Checkbox,
  Label,
  Textarea,
  TextInput,
} from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useState } from 'react';
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
import { VscAdd, VscTrash } from 'react-icons/vsc';
import Select, { SingleValue } from 'react-select';
import LessonSearchModal from './LessonsSearchModal';

type Props = {
  course?: CourseExpanded;
};

type CourseForm = Course & {
  lessons: Lesson[];
  tags: Tag[];
};

const ObjectivesSection = () => {
  const { watch, setValue, register } = useFormContext<CourseForm>();

  const addObjective = () => {
    const currentEn = watch('objectives.en') || [];
    const currentVi = watch('objectives.vi') || [];
    // @ts-ignore
    setValue('objectives.en', [...currentEn, ''], { shouldDirty: true });
    // @ts-ignore
    setValue('objectives.vi', [...currentVi, ''], { shouldDirty: true });
  };

  const removeObjective = (index: number) => {
    const currentEn = watch('objectives.en') || [];
    const currentVi = watch('objectives.vi') || [];
    const updatedEn = [...currentEn];
    const updatedVi = [...currentVi];
    updatedEn.splice(index, 1);
    updatedVi.splice(index, 1);
    // @ts-ignore
    setValue('objectives.en', updatedEn, { shouldDirty: true });
    // @ts-ignore
    setValue('objectives.vi', updatedVi, { shouldDirty: true });
  };

  return (
    <div className="mb-4">
      <Label value="Objectives" className="text-lg font-semibold" />
      {((watch('objectives.en') as any[]) || []).map(
        (_: any, index: number) => (
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
        )
      )}
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

const DefaultFormValues: Partial<CourseForm> = {
  status: 'Draft',
  difficulty: 'Easy',
  tags: [],
};
export const CourseFormScreen = ({ course }: Props) => {
  const [addLessonPopup, setAddLessonPopup] = useState(false);
  const { locale, apiDomain, tags: defaultTags } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const t = useTranslations();

  const buildInitialCourseForm = (course: CourseExpanded) => {
    return {
      ...course,
      lessons: course.lessons.map((lesson) => ({
        ...lesson.lessonId,
        lessonId: lesson.lessonId._id,
      })),
    };
  };

  const methods = useForm<CourseForm>({
    defaultValues: course ? buildInitialCourseForm(course) : DefaultFormValues,
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

  const { fields: lessonFields, remove: removeLesson } = useFieldArray({
    control,
    name: 'lessons',
  });

  // Handle form submission
  const onSubmit: SubmitHandler<CourseForm> = async (formData) => {
    const { _id, lessons, tags, ...rest } = formData;
    const lessonIds = lessons.map((l: Lesson) => ({ lessonId: l._id }));
    const tagIds = tags.map((tag: Tag) => tag._id);
    const payload = { ...rest, lessons: lessonIds, tags: tagIds };
    setIsSubmitting(true);
    const result = await handleSubmission(
      async () => {
        if (_id) {
          return await axiosInstance.put(
            `${apiDomain}/v1/courses/${_id}`,
            payload
          );
        } else {
          return await axiosInstance.post(`${apiDomain}/v1/courses`, {
            payload,
          });
        }
      },
      addToast, // Pass addToast to show toast notifications
      t('common.title.success') // Success message
    );

    setIsSubmitting(false);

    if (result !== undefined && !_id) {
      const data = result.data;
      router.push(`/settings/courses/${data._id}`);
    }
  };

  const router = useRouter();

  const reOrderLessons = (fromIndex: number, toIndex: number) => {
    const lessons = watch('lessons') || [];
    const updatedItems = [...lessons];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    // @ts-ignore
    setValue('lessons', updatedItems, {
      shouldDirty: true,
    });
  };

  return (
    <div className="">
      <TitlePage>Course Form</TitlePage>
      <FormProvider {...methods}>
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
          <div className="mt-2 grid grid-cols-3  place-content-start mb-4 gap-8">
            <div className="flex flex-col">
              <Label htmlFor="tags" value="Tags" />

              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <Select
                    id="tags"
                    isMulti
                    options={defaultTags}
                    value={defaultTags.filter((option) => {
                      return field.value?.some(
                        // @ts-ignore
                        (selected) => selected._id === option._id
                      );
                    })}
                    onChange={(selectedOptions) =>
                      field.onChange(selectedOptions)
                    }
                    getOptionLabel={(e) => e.name}
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
            Lessons:
            <div className="grid grid-cols-[50%_10%_25%_5%] mb-2 gap-4 place-items-center">
              <Label>Title</Label>
              <Label>Difficulty</Label>
              <Label>Status</Label>
              <Label>Actions</Label>
            </div>
            <DndProvider backend={HTML5Backend}>
              {lessonFields.map((field, index) => {
                return (
                  <DraggableItem
                    itemType="puzzles"
                    index={index}
                    moveItem={reOrderLessons}
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
                          onClick={() => removeLesson(index)}
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
                setAddLessonPopup(true);
              }}
            >
              +
            </Button>
          </div>

          <div className="flex mt-4">
            <Button
              className="mr-8"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                router.push('/settings/courses');
              }}
            >
              Back to the list
            </Button>
            <Button disabled={isSubmitting} color="primary" type="submit">
              Submit
            </Button>
          </div>
        </form>
        {addLessonPopup && (
          <LessonSearchModal
            onClose={() => {
              setAddLessonPopup(false);
            }}
            selectedLessons={watch('lessons')}
            onAddLessons={(lessons: Lesson[]) => {
              const currentLessons = watch('lessons');
              const updatedLessons = [...currentLessons, ...lessons];
              // @ts-ignore
              setValue('lessons', updatedLessons, { shouldDirty: true });
            }}
          />
        )}
      </FormProvider>
    </div>
  );
};
