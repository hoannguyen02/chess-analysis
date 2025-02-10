import { TitlePage } from '@/components/TitlePage';
import { ROUTE_CHANGE_MESSAGE } from '@/constants/route';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import usePreventRouteChange from '@/hooks/usePreventRouteChange';
import { PuzzleTheme } from '@/types/puzzle-theme';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Button, Label, Textarea, TextInput } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

type Props = {
  puzzleTheme?: PuzzleTheme;
};

export const PuzzleThemeFormScreen = ({ puzzleTheme }: Props) => {
  const { apiDomain } = useAppContext();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const router = useRouter();
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { isDirty }, // Access form errors
  } = useForm<PuzzleTheme>({
    defaultValues: puzzleTheme || {
      code: '',
    },
  });

  // Warn on browser close/refresh
  useBeforeUnload(ROUTE_CHANGE_MESSAGE, isDirty);

  // Warn on internal navigation
  usePreventRouteChange(ROUTE_CHANGE_MESSAGE, isDirty);

  // Handle form submission
  const onSubmit: SubmitHandler<PuzzleTheme> = async (data) => {
    const { _id, code, title } = data;

    setIsSubmitting(true);
    const result = await handleSubmission(
      async () => {
        if (_id) {
          return await axiosInstance.put(
            `${apiDomain}/v1/puzzle-themes/${_id}`,
            {
              code,
              title,
            }
          );
        } else {
          return await axiosInstance.post(`${apiDomain}/v1/puzzle-themes`, {
            code,
            title,
          });
        }
      },
      addToast, // Pass addToast to show toast notifications
      t('common.title.success') // Success message
    );

    setIsSubmitting(false);

    if (result !== undefined) {
      if (!_id) {
        const data = result.data;
        router.push(`/settings/puzzle-themes/${data._id}`);
      }
    }
  };
  return (
    <div className="">
      <TitlePage>Puzzle Theme Form</TitlePage>
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
        <div className="mb-4">
          <Label htmlFor="code" value="Code" />
          <TextInput
            id="code"
            type="text"
            // readOnly={puzzleTheme?._id !== undefined}
            placeholder="English"
            {...register('code')}
          />
        </div>

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

        <div className="flex mt-4">
          <Button
            className="mr-8"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              router.push('/settings/puzzle-themes');
            }}
          >
            {t('common.button.back')}
          </Button>
          <Button disabled={isSubmitting} color="primary" type="submit">
            {t('common.button.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};
