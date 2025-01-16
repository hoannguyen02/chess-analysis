import { TitlePage } from '@/components/TitlePage';
import { LEVEL_RATING, Statues } from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Lesson } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import { previewPuzzle } from '@/utils/previewPuzzle';
import { Button, Checkbox, Label, Select, TextInput } from 'flowbite-react';
import { isEmpty } from 'lodash';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { VscEdit } from 'react-icons/vsc';
import useSWR from 'swr';
import { AddToLessonsModal } from './AddToLessonsModal';
import { NestedMoveField } from './NestedMoveField';

type Props = {
  puzzle?: Puzzle;
  onSaveSuccess?: (puzzle: Puzzle) => void;
};

export const PuzzleFormScreen = ({ puzzle, onSaveSuccess }: Props) => {
  const { themes, apiDomain, locale } = useAppContext();
  const t = useTranslations();
  const [addToLessonsPopup, setAddToLessonsPopup] = useState(false);

  const {
    data: lessons,
    error,
    isLoading,
    mutate: refreshLessons,
  } = useSWR<Lesson[]>(
    puzzle?._id ? `${apiDomain}/v1/puzzles/${puzzle?._id}/lessons` : undefined,
    fetcher
  );
  const router = useRouter();
  const {
    register, // Register inputs
    control,
    handleSubmit, // Handle form submission
    formState: { errors, isDirty }, // Access form errors
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<Puzzle>({
    defaultValues: puzzle || {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      isPublic: false,
      status: 'Draft',
      difficulty: 'Beginner',
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

  const isValidFormValues = () => {
    const { fen, solutions } = getValues();
    if (!fen) {
      alert('Please enter a valid FEN position');
      return false;
    }
    if (!solutions.length) {
      alert('Please enter solutions');
      return false;
    }

    return true;
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'solutions',
  });

  // Handle form submission
  const onSubmit: SubmitHandler<Puzzle> = async (data) => {
    const { _id, preMove, ...rest } = data;
    if (isValidFormValues()) {
      let payload: Partial<Puzzle> = rest;
      if (!isEmpty(preMove?.move)) {
        payload = {
          ...rest,
          preMove,
        };
      } else {
        payload = rest;
      }
      try {
        const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
        let request;
        if (_id) {
          request = fetch(`${apiDomain}/v1/puzzles/${_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          request = fetch(`${apiDomain}/v1/puzzles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        const response = await request;
        if (response.ok) {
          const data = await response.json();
          reset(data);
          if (onSaveSuccess) {
            onSaveSuccess(data);
          }

          alert('Data submitted successfully');
          if (!_id) {
            router.push(`/settings/puzzles/${data._id}`);
          }
        } else {
          console.error('Failed to submit data:', response.statusText);
          alert('Submission failed');
        }
      } catch (error) {
        console.error('Error submitting data:', error);
      }
    }
  };

  const fen = watch('fen');

  const handlePreview = () => {
    if (isValidFormValues()) {
      previewPuzzle(getValues());
    }
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
            placeholder="English"
            {...register('title.en')}
          />
          <TextInput
            className="mt-2"
            id="title"
            type="text"
            placeholder="Vietnamse"
            {...register('title.vi')}
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
                href={`/settings/fen-builder?fen=${fen}`}
                className="inline-flex items-center text-[12px]"
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
              {Statues.map((status) => (
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
              {Object.entries(LEVEL_RATING).map(([rating, title]) => (
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
                <option key={theme.code} label={theme.title[locale]}>
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
                <option label="">Select player</option>
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
          <h2 className="mb-4 text-xl font-bold">Solution Moves</h2>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-6 border border-gray-300 p-4 rounded-lg shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg">Step {index + 1}</h4>

                {/* Player Selector */}
                <Select
                  {...register(`solutions.${index}.player`)}
                  onChange={(e) => {
                    // setValue(`solutions.${index}.moves`, [
                    //   { move: '', from: '', to: '' },
                    // ]);
                    setValue(
                      `solutions.${index}.player`,
                      e.target.value as 'user' | 'engine'
                    );
                  }}
                  className="w-32"
                >
                  <option value="user">User</option>
                  <option value="engine">Engine</option>
                </Select>

                {/* Remove Step */}
                <Button
                  type="button"
                  outline
                  size="xs"
                  color="failure"
                  onClick={() => remove(index)}
                >
                  🗑️ Remove Step
                </Button>
              </div>

              {/* Moves */}
              <NestedMoveField
                key={getValues(`solutions.${index}.player`)}
                control={control}
                register={register}
                index={index}
              />
            </div>
          ))}

          <Button
            type="button"
            outline
            size="md"
            onClick={() =>
              append({
                player: 'user',
                moves: [{ move: '', from: '', to: '' }],
              })
            }
            className="mt-4"
          >
            ➕ Add Solution Step
          </Button>
        </div>

        {lessons && lessons?.length > 0 && (
          <div className="mb-16">
            Lessons:
            <div className="grid grid-cols-[70%_15%_15%] mb-2 gap-4">
              <Label className="font-bold">Title</Label>
              <Label className="font-bold">Difficulty</Label>
              <Label className="font-bold">Status</Label>
            </div>
            {lessons.map((lessons, index) => (
              <div
                key={`lessons-${index}`}
                className="grid grid-cols-[70%_15%_15%] mb-2 gap-4"
              >
                <Label>{lessons.title[locale]}</Label>
                <Label>{lessons.difficulty}</Label>
                <Label>{lessons.status}</Label>
              </div>
            ))}
            <Button
              type="button"
              outline
              onClick={() => {
                setAddToLessonsPopup(true);
              }}
            >
              Add this puzzle to another lessons
            </Button>
          </div>
        )}

        <div className="flex mt-4">
          <Button
            className="mr-8"
            type="button"
            onClick={() => {
              router.push('/settings/puzzles');
            }}
          >
            {t('common.button.back')}
          </Button>
          <Button
            type="button"
            onClick={handlePreview}
            outline
            className="mr-8"
          >
            {t('common.button.preview')}
          </Button>
          <Button color="primary" type="submit">
            {t('common.button.submit')}
          </Button>
        </div>
      </form>
      {puzzle?._id && addToLessonsPopup && (
        <AddToLessonsModal
          onClose={() => {
            setAddToLessonsPopup(false);
          }}
          selectedLessons={lessons || []}
          puzzleId={puzzle?._id}
          onSaveSuccess={refreshLessons}
        />
      )}
    </div>
  );
};
