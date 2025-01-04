import { TitlePage } from '@/components/TitlePage';
import { Button, Label, TextInput } from 'flowbite-react';
import Link from 'next/link';
import { SubmitHandler, useForm } from 'react-hook-form';
import { VscEdit } from 'react-icons/vsc';

type CreatePuzzleForm = {
  fen: string;
};

export const CreatePuzzleScreen = () => {
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
    watch,
  } = useForm<CreatePuzzleForm>({
    defaultValues: { fen: '8/8/8/8/8/8/8/8 w - - 0 1' },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<CreatePuzzleForm> = (data) => {
    console.log(data); // Handle form data
  };

  const fen = watch('fen');

  return (
    <div className="grid grid-cols-2">
      <TitlePage>Create Puzzle</TitlePage>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="grid grid-cols-2">
          <div>
            <Label htmlFor="fen" value="Fen" />
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
          <div>
            <Link
              href={`/fen-builder?fen=${fen}`}
              className="w-full"
              target="_blank"
            >
              <VscEdit />
            </Link>
          </div>
        </div>

        <Button type="submit" gradientMonochrome="info">
          Submit
        </Button>
      </form>
    </div>
  );
};
