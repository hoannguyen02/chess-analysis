import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzleStatues } from '@/constants/puzzle';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Lesson } from '@/types/lesson';
import { Button, Label, Select, TextInput } from 'flowbite-react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';

type Props = {
  lesson?: Lesson;
};
export const LessonFormScreen = ({ lesson }: Props) => {
  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
  } = useForm<Lesson>({
    defaultValues: lesson || {
      status: 'Draft',
      difficulty: 'Easy',
    },
  });

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  const {
    fields: puzzleFields,
    append: appendPuzzle,
    remove: removePuzzle,
  } = useFieldArray({
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
  const onSubmit: SubmitHandler<Lesson> = async (data) => {
    const { _id, ...rest } = data;
    try {
      const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
      let request;
      if (_id) {
        request = fetch(`${apiDomain}/v1/lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
        });
      } else {
        request = fetch(`${apiDomain}/v1/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
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

  return (
    <div className="">
      <TitlePage>Lesson Form</TitlePage>
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
          <div>Tags - Do later</div>
        </div>

        <div className="flex mt-4">
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
    </div>
  );
};
