import { DraggableItem } from '@/components/DraggableItem';
import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzleStatues } from '@/constants/puzzle';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Course, CourseExpanded } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { Button, Checkbox, Label, Select, TextInput } from 'flowbite-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import LessonSearchModal from './LessonsSearchModal';

type Props = {
  course?: CourseExpanded;
};

type CourseForm = Course & {
  lessons: Lesson[];
};
export const CourseFormScreen = ({ course }: Props) => {
  const [addLessonPopup, setAddLessonPopup] = useState(false);

  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
  } = useForm<CourseForm>({
    defaultValues: course
      ? {
          ...course,
          lessons: course.lessons.map((lesson) => ({
            ...lesson.lessonId,
            lessonId: lesson.lessonId._id,
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

  const { fields: lessonFields, remove: removeLesson } = useFieldArray({
    control,
    name: 'lessons',
  });

  // Handle form submission
  const onSubmit: SubmitHandler<CourseForm> = async (data) => {
    const { _id, lessons, ...rest } = data;
    const lessonIds = lessons.map((l: Lesson) => ({ lessonId: l._id }));
    const payload = { ...rest, lessons: lessonIds };
    try {
      const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
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
    window.open(`/courses/preview?data=${encodedData}`, '_blank');
  };

  const router = useRouter();

  const objectives = watch('objectives') || [];

  const addObjective = () => {
    const currentObjectives = watch('objectives') || [];
    const newObjectives = [...currentObjectives, ''];
    setValue('objectives', newObjectives, { shouldDirty: true });
  };

  const removeObjective = (index: number) => {
    const currentObjectives = watch('objectives') || [];
    const newObjectives = [...currentObjectives];
    newObjectives.splice(index, 1);
    setValue('objectives', newObjectives, { shouldDirty: true });
  };

  const reOrderLessons = (fromIndex: number, toIndex: number) => {
    const lessons = watch('lessons') || [];
    const updatedItems = [...lessons];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue('lessons', updatedItems, {
      shouldDirty: true,
    });
  };

  return (
    <div className="">
      <TitlePage>Course Form</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div className="flex flex-col">
            <Label htmlFor="title" value="Title" />
            <TextInput
              id="title"
              type="text"
              placeholder="Title"
              {...register('title')}
            />
          </div>
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
          Objectives:
          {objectives.map((objective, index) => (
            <div
              key={objective}
              className="flex justify-between items-center mb-2"
            >
              <TextInput
                className="w-[90%]"
                {...register(`objectives.${index}`)}
                defaultValue={objective}
              />
              <Button
                outline
                size="sm"
                type="button"
                onClick={() => removeObjective(index)}
              >
                -
              </Button>
            </div>
          ))}
          <Button type="button" outline size="sm" onClick={addObjective}>
            +
          </Button>
        </div>

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
                    <Label>{field.title}</Label>
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
              router.push('/courses');
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
    </div>
  );
};
