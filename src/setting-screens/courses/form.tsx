import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Course, CourseExpanded } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { Tag } from '@/types/tag';
import {
  Button,
  Card,
  Checkbox,
  Label,
  Textarea,
  TextInput,
} from 'flowbite-react';
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

const DefaultFormValues: Partial<CourseForm> = {
  status: 'Draft',
  difficulty: 'Easy',
  tags: [],
};
export const CourseFormScreen = ({ course }: Props) => {
  const [addLessonPopup, setAddLessonPopup] = useState(false);
  const { locale, apiDomain, tags: defaultTags } = useAppContext();

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
    try {
      let request;
      if (_id) {
        request = fetch(`${apiDomain}/v1/courses/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        request = fetch(`${apiDomain}/v1/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const response = await request;
      if (response.ok) {
        const data = await response.json();
        reset(formData);
        alert('Data submitted successfully');
        if (!_id) {
          router.push(`/settings/courses/${data._id}`);
        }
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
    window.open(`/courses/preview?data=${encodedData}`, '_blank');
  };

  const router = useRouter();

  const reOrderLessons = (fromIndex: number, toIndex: number) => {
    const lessons = watch('lessons') || [];
    const updatedItems = [...lessons];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('lessons', updatedItems, {
      shouldDirty: true,
    });
  };

  const statusOptions = Statues.map((status) => ({
    value: status as string,
    label: status as string,
  }));

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
                    value={defaultTags.filter((option) =>
                      field.value?.some(
                        (selected) => selected._id === option._id
                      )
                    )}
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
                    options={statusOptions}
                    value={statusOptions.find(
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
                    options={Object.entries(LEVEL_RATING).map(
                      ([rating, title]) => ({
                        value: rating,
                        label: title,
                      })
                    )}
                    value={
                      Object.entries(LEVEL_RATING)
                        .map(([rating, title]) => ({
                          value: rating,
                          label: title,
                        }))
                        .find((option) => option.value === field.value) || null
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
              onClick={() => {
                router.push('/settings/courses');
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
        {addLessonPopup && (
          <LessonSearchModal
            onClose={() => {
              setAddLessonPopup(false);
            }}
            selectedLessons={watch('lessons')}
            onAddLessons={(lessons: Lesson[]) => {
              const currentLessons = watch('lessons');
              const updatedLessons = [...currentLessons, ...lessons];

              setValue('lessons', updatedLessons, { shouldDirty: true });
            }}
          />
        )}
      </FormProvider>
    </div>
  );
};
