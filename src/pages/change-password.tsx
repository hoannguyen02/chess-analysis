import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Label, TextInput } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordPage = () => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { apiDomain, locale } = useAppContext();
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>();

  const onSubmit: SubmitHandler<ChangePasswordFormValues> = async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    if (newPassword !== confirmPassword) {
      addToast(t('change-password.error.password-mismatch'), 'error'); // Use Toast for mismatch error
      return;
    }

    setIsSubmitting(true);

    const result = await handleSubmission(
      async () => {
        return await axiosInstance.post(
          `${apiDomain}/v1/auth/change-password`,
          {
            currentPassword,
            newPassword,
            confirmPassword,
          }
        );
      },
      addToast, // Pass addToast to show toast notifications
      t('common.title.success') // Success message
    );

    setIsSubmitting(false);

    if (result !== undefined) {
      router.push('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto px-4">
      <div className="flex justify-center mt-8">
        <Link href="/" className="mb-6">
          <Logo />
        </Link>
      </div>

      {/* Current Password */}
      <div className="mb-4">
        <Label
          htmlFor="currentPassword"
          value={t('change-password.current-password')}
        />
        <div className="relative">
          <TextInput
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="******"
            {...register('currentPassword', {
              required: t('change-password.error.required'),
            })}
            color={errors.currentPassword ? 'failure' : undefined}
          />
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
          >
            {showCurrentPassword ? <VscEyeClosed /> : <VscEye />}
          </div>
        </div>
        {errors.currentPassword && (
          <p className="text-red-500 text-sm">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New Password */}
      <div className="mb-4">
        <Label
          htmlFor="newPassword"
          value={t('change-password.new-password')}
        />
        <div className="relative">
          <TextInput
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="******"
            {...register('newPassword', {
              required: t('change-password.error.required'),
              minLength: {
                value: 6,
                message: t('change-password.error.password-length'),
              },
            })}
            color={errors.newPassword ? 'failure' : undefined}
          />
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? <VscEyeClosed /> : <VscEye />}
          </div>
        </div>
        {errors.newPassword && (
          <p className="text-red-500 text-sm">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <Label
          htmlFor="confirmPassword"
          value={t('change-password.confirm-password')}
        />
        <div className="relative">
          <TextInput
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="******"
            {...register('confirmPassword', {
              required: t('change-password.error.required'),
            })}
            color={errors.confirmPassword ? 'failure' : undefined}
          />
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? <VscEyeClosed /> : <VscEye />}
          </div>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex justify-center mt-16">
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('common.button.sending')
            : t('common.button.submit')}
        </PrimaryButton>
      </div>
    </form>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    try {
      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;
      const changePasswordMessages = (
        await import(`@/locales/${locale}/change-password.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
            'change-password': changePasswordMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default ChangePasswordPage;
