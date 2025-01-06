import { TitlePage } from '@/components/TitlePage';
import { PUZZLE_RATING, PuzzleStatues } from '@/constants/puzzle';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Puzzle } from '@/types/puzzle';
import { Button, Checkbox, Label, Select, TextInput } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { VscEdit } from 'react-icons/vsc';

type Props = {
  puzzle?: Puzzle;
};
export const PuzzleFormScreen = ({ puzzle }: Props) => {
  const router = useRouter();
  const { themes } = useAppContext();
  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
  } = useForm<Puzzle>({
    defaultValues: puzzle || {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      isPublic: false,
      status: 'Draft',
      difficulty: 'Easy',
      phase: 'Middle',
      solutions: [],
      preMove: {
        player: 'w',
        move: '',
        from: '',
        to: '',
      },
    },
  });

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'solutions',
  });

  // Handle form submission
  const onSubmit: SubmitHandler<Puzzle> = async (data) => {
    const { _id, ...rest } = data;
    try {
      const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
      let request;
      if (_id) {
        request = fetch(`${apiDomain}/v1/puzzles/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest),
        });
      } else {
        request = fetch(`${apiDomain}/v1/puzzles`, {
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

  const fen = watch('fen');

  const handlePreview = () => {
    const encodedData = encodeURIComponent(JSON.stringify(getValues()));
    window.open(`/puzzles/preview?data=${encodedData}`, '_blank');
  };

  return (
    <div className="">
      <TitlePage>Puzzle Form</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="mb-4">
          <Label htmlFor="title" value="Title" />
          <TextInput
            id="title"
            type="text"
            placeholder="Title of puzzle - leave it blank if not needed"
            {...register('title')}
          />
        </div>
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div className="flex flex-col ">
            <div className="w-[90%]">
              <Label htmlFor="fen" value="Fen* " />
              <TextInput
                id="fen"
                type="text"
                placeholder="FEN string"
                {...register('fen', { required: 'FEN is required' })}
                color={errors.fen ? 'failure' : undefined}
              />
              {errors.fen && (
                <p className="text-red-500 text-sm">{errors.fen.message}</p>
              )}
            </div>
            <div className="mt-2">
              <Link
                href={`/fen-builder?fen=${fen}`}
                className="w-full flex items-center text-[12px]"
                target="_blank"
              >
                Update FEN: <VscEdit className="ml-2" />
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <Label htmlFor="status" value="Status" />
            </div>
            <Select id="status" required {...register('status')}>
              {PuzzleStatues.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <Label htmlFor="isPublic" value="Public (All users can see it)" />
            </div>
            <Checkbox id="isPublic" {...register('isPublic')} />
          </div>
        </div>
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div>
            <div className="mb-2">
              <Label htmlFor="difficulty" value="Difficulty" />
            </div>
            <Select id="difficulty" required {...register('difficulty')}>
              {Object.entries(PUZZLE_RATING).map(([rating, title]) => (
                <option key={rating} label={title}>
                  {rating}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor="phase" value="Phase" />
            </div>
            <Select value={watch('phase')} id="phase" {...register('phase')}>
              <option>Opening</option>
              <option>Middle</option>
              <option>Endgame</option>
            </Select>
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor="theme" value="Theme" />
            </div>
            <Select value={watch('theme')} id="theme" {...register('theme')}>
              {themes.map((theme) => (
                <option key={theme.code} label={theme.title}>
                  {theme.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <h2 className="mb-4">Solutions moves</h2>
          <div className="grid grid-cols-5 mb-2 gap-4">
            <Label className="font-semibold" value="Player" />
            <Label className="font-semibold" value="Move" />
            <Label className="font-semibold" value="From Square" />
            <Label className="font-semibold" value="To Square" />
            <Label className="font-semibold" value="Actions" />
          </div>
          <label className="flex items-center text-[12px]">
            Pre move -{' '}
            <small>
              Computer auto make first move, leave it empty if not need
            </small>
          </label>
          <div className="grid grid-cols-5 mb-4 gap-4">
            <div className="">
              <Select
                id="prevMovePlayer"
                required
                {...register(`preMove.player`)}
              >
                <option label="White">w</option>
                <option label="Black">b</option>
              </Select>
            </div>
            <TextInput {...register(`preMove.move`)} />
            <TextInput {...register(`preMove.from`)} />
            <TextInput {...register(`preMove.to`)} />
            <div className="">
              <Button
                outline
                size="sm"
                type="button"
                onClick={() => {
                  setValue('preMove', undefined, {
                    shouldDirty: true,
                  });
                }}
              >
                -
              </Button>
            </div>
          </div>
          {fields.map((field, index) => (
            <div className="grid grid-cols-5 mb-2 gap-4" key={field.id}>
              <div className="">
                <Select
                  id="status"
                  required
                  {...register(`solutions.${index}.player`)}
                >
                  <option label="User">user</option>
                  <option label="Engine">engine</option>
                </Select>
              </div>
              <TextInput {...register(`solutions.${index}.move`)} />
              <TextInput {...register(`solutions.${index}.from`)} />
              <TextInput {...register(`solutions.${index}.to`)} />
              <div className="">
                <Button
                  outline
                  size="sm"
                  type="button"
                  onClick={() => remove(index)}
                >
                  -
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            outline
            size="sm"
            onClick={() =>
              append({ move: '', player: 'user', from: '', to: '' })
            }
          >
            +
          </Button>
        </div>

        <div className="flex mt-4">
          <Button
            className="mr-8"
            type="button"
            onClick={() => {
              router.push('/puzzles');
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
    </div>
  );
};
