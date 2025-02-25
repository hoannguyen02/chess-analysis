import { TitlePage } from '@/components/TitlePage';
import {
  PhaseOptions,
  PreMovePlayerOptions,
  RatingOptions,
  SolutionMovePlayerOptions,
  StatusOptions,
} from '@/constants';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { Lesson } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { PuzzleTheme } from '@/types/puzzle-theme';
import axiosInstance from '@/utils/axiosInstance';
import { fetcher } from '@/utils/fetcher';
import { handleSubmission } from '@/utils/handleSubmission';
import { previewPuzzle } from '@/utils/previewPuzzle';
import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { isEmpty } from 'lodash';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { VscEdit } from 'react-icons/vsc';
import Select, { SingleValue } from 'react-select';
import useSWR from 'swr';
import { AddToLessonsModal } from './AddToLessonsModal';
import { CustomArrowField } from './CustomArrowField';
import { NestedMoveField } from './NestedMoveField';

type Props = {
  puzzle?: Puzzle;
  onSaveSuccess?: (puzzle: Puzzle) => void;
  isValidating?: boolean;
};

export const PuzzleFormScreen = ({ puzzle, onSaveSuccess }: Props) => {
  const { themes: defaultThemes, apiDomain, locale } = useAppContext();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const [addToLessonsPopup, setAddToLessonsPopup] = useState(false);

  const { data: lessons, mutate: refreshLessons } = useSWR<Lesson[]>(
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
    getValues,
    reset,
  } = useForm<Puzzle>({
    defaultValues: puzzle || {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      isPublic: false,
      status: 'Active',
      difficulty: 'Easy',
      phase: 'Middle',
      solutions: [],
    },
  });

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  const isValidFormValues = () => {
    const { fen, solutions, themes } = getValues();
    if (!fen) {
      alert('Please enter a valid FEN position (Vui lòng nhập FEN)');
      return false;
    }
    if (!themes || !themes?.length) {
      alert('Please enter themes (Vui lòng nhập chiến thuật)');
      return false;
    }
    if (!solutions.length) {
      alert('Please enter solutions (Vui lòng nhập solutions)');
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
    debugger;
    const { _id, preMove, themes, customArrows, endCustomArrows, ...rest } =
      data;
    const formattedCustomArrows = customArrows?.map((arrow) => [
      arrow[0],
      arrow[1],
      arrow[2],
    ]);
    const formattedEndCustomArrows = endCustomArrows?.map((arrow) => [
      arrow[0],
      arrow[1],
      arrow[2],
    ]);
    if (isValidFormValues()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const themeIds = themes?.map((theme: PuzzleTheme) => theme._id);

      setIsSubmitting(true);
      const result = await handleSubmission(
        async () => {
          const commonPayload = {
            themes: themeIds,
            customArrows: formattedCustomArrows,
            endCustomArrows: formattedEndCustomArrows,
          };

          if (_id) {
            let payload: any = rest;
            if (!isEmpty(preMove?.move)) {
              payload = {
                ...rest,
                ...commonPayload,
                preMove,
              };
            } else {
              payload = {
                ...rest,
                preMove: null,
                ...commonPayload,
              };
            }
            return await axiosInstance.put(
              `${apiDomain}/v1/puzzles/${_id}`,
              payload
            );
          } else {
            return await axiosInstance.post(`${apiDomain}/v1/puzzles`, {
              ...commonPayload,
              ...rest,
              ...(!isEmpty(preMove?.move) && { preMove }),
            });
          }
        },
        addToast, // Pass addToast to show toast notifications
        t('common.title.success') // Success message
      );

      setIsSubmitting(false);

      if (result !== undefined) {
        reset(data);
        if (onSaveSuccess) {
          onSaveSuccess(data);
        }
        if (!_id) {
          const data = result.data;
          router.push(`/settings/puzzles/${data._id}`);
        }
      }
    }
  };

  const fen = watch('fen');

  const handlePreview = () => {
    if (isValidFormValues()) {
      previewPuzzle(getValues());
    }
  };

  const handleCopySolvePuzzleLink = () => {
    if (isValidFormValues()) {
      const isPublic = getValues('isPublic');
      if (!isPublic) {
        alert('Puzzle is not public. Link will not be copied');
        return;
      } else {
        navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_BASE_URL}/vi/solve-puzzles/${puzzle?._id}`
        );
        alert('Link copied successfully');
      }
    }
  };

  return (
    <div className="">
      <TitlePage>Puzzle Form</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="mb-4">
          <Label htmlFor="title" value="Title" />
          <div className="grid grid-cols-2">
            <TextInput
              id="title"
              type="text"
              placeholder="English"
              {...register('title.en')}
            />
            <TextInput
              className="ml-2"
              id="title"
              type="text"
              placeholder="Vietnamse"
              {...register('title.vi')}
            />
          </div>
        </div>
        <div className="mb-4">
          <Label htmlFor="hint" value="Hint" />
          <div className="grid grid-cols-2">
            <TextInput
              id="hint"
              type="text"
              placeholder="English"
              {...register('hint.en')}
            />
            <TextInput
              className="ml-2"
              id="hint"
              type="text"
              placeholder="Vietnamse"
              {...register('hint.vi')}
            />
          </div>
        </div>
        <div className="flex flex-col mb-2">
          <Label>Custom arrows</Label>
          <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-md p-4">
            <div className="flex flex-col mb-2">
              <Label className="mb-1">Start</Label>
              <CustomArrowField
                control={control}
                name="customArrows"
                register={register}
              />
            </div>
            <div className="flex flex-col border-l border-gray-300 pl-4">
              <Label className="mb-1">End</Label>
              <CustomArrowField
                control={control}
                name="endCustomArrows"
                register={register}
              />
            </div>
          </div>
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
                rel="noopener noreferrer"
              >
                Update FEN: <VscEdit className="ml-2" />
              </Link>
            </div>
          </div>
          <div className="flex items-center">
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
          <div className="flex items-center">
            <div className="mr-4">
              <Label htmlFor="isPublic" value="Public (All users can see it)" />
            </div>
            <Checkbox id="isPublic" {...register('isPublic')} />
          </div>
        </div>
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div>
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
          <div>
            <Label htmlFor="phase" value="Phase" />
            <Controller
              control={control}
              name="phase"
              render={({ field }) => (
                <Select
                  id="phase"
                  options={PhaseOptions}
                  value={
                    PhaseOptions.find(
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
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      return selected.code === option.code;
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
        </div>
        <div>
          <label className="flex items-center text-[12px]">
            <strong>Pre move: </strong>
            <small className="ml-1">
              Computer auto make first move, leave it empty if not need
            </small>
          </label>
          <div className="grid grid-cols-6 gap-4">
            <Label className="font-semibold" value="Player" />
            <Label className="font-semibold" value="Move" />
            <Label className="font-semibold" value="To Square" />
            <Label className="font-semibold" value="From Square" />
            <Label className="font-semibold" value="Actions" />
          </div>

          <div className="mt-2 grid grid-cols-6 mb-4 gap-4">
            <Controller
              control={control}
              name="preMove.player"
              render={({ field }) => (
                <Select
                  id="preMove.player"
                  options={PreMovePlayerOptions}
                  value={
                    PreMovePlayerOptions.find(
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
            <TextInput
              {...register(`preMove.move`)}
              placeholder="Move (e.g., e4)"
            />
            <TextInput
              {...register(`preMove.to`)}
              placeholder="To (e.g., e4)"
            />
            <TextInput
              {...register(`preMove.from`)}
              placeholder="From (e.g., e2)"
            />
            <div className="">
              <Button
                outline
                size="sm"
                type="button"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  reset({ ...getValues(), preMove: null }, { keepDirty: true });
                }}
              >
                🗑️ Remove Pre Move
              </Button>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold">Solution Moves</h2>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-6 border border-gray-300 p-4 rounded-lg shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg">Step {index + 1}</h4>
                <small>
                  Noted: First move is default move when user click show
                  solution
                </small>

                <div>
                  <Controller
                    control={control}
                    name={`solutions.${index}.player`}
                    render={({ field }) => (
                      <Select
                        id={`solutions.${index}.player`}
                        options={SolutionMovePlayerOptions}
                        value={
                          SolutionMovePlayerOptions.find(
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
                watch={watch}
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
            disabled={isSubmitting}
            onClick={() => {
              router.push('/settings/puzzles');
            }}
          >
            {t('common.button.back')}
          </Button>
          {puzzle?._id && (
            <Button
              type="button"
              onClick={handleCopySolvePuzzleLink}
              outline
              className="mr-8"
            >
              Copy solve puzzle public link
            </Button>
          )}
          <Button
            type="button"
            onClick={handlePreview}
            outline
            className="mr-8"
          >
            {t('common.button.preview')}
          </Button>
          <Button disabled={isSubmitting} color="primary" type="submit">
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
