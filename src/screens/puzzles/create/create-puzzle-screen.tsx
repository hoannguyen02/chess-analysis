import { TitlePage } from '@/components/TitlePage';
import { PuzzleDifficulty, PuzzlePhase, PuzzleStatus } from '@/types/puzzle';
import { Button, Checkbox, Label, Select, TextInput } from 'flowbite-react';
import Link from 'next/link';
import { SubmitHandler, useForm } from 'react-hook-form';
import { VscEdit } from 'react-icons/vsc';

type CreatePuzzleForm = {
  fen: string;
  status: PuzzleStatus;
  difficulty: PuzzleDifficulty;
  isPublic: boolean;
  phase?: PuzzlePhase;
};

export const CreatePuzzleScreen = () => {
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
    watch,
  } = useForm<CreatePuzzleForm>({
    defaultValues: {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      isPublic: false,
      status: 'Draft',
      difficulty: 'Easy',
      phase: 'Middle',
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<CreatePuzzleForm> = (data) => {
    console.log(data); // Handle form data
  };

  const fen = watch('fen');

  return (
    <div className="">
      <TitlePage>Create Puzzle</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="grid grid-cols-3  place-content-start mb-4 gap-8">
          <div className="flex flex-col">
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
              <option>Draft</option>
              <option>Verified</option>
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
              <option label="Easy: 800-1200">Easy</option>
              <option label="Medium: 1200-1600">Medium</option>
              <option label="Hard: 1600-2000">Hard</option>
              <option label="Very hard: 2000+">Very hard</option>
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
          <div></div>
        </div>

        <Button type="submit" gradientMonochrome="info">
          Submit
        </Button>
      </form>
    </div>
  );
};
