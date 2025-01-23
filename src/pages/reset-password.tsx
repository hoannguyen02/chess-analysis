import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance, { setAxiosLocale } from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Label, TextInput } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage = () => {
  const router = useRouter();
  const { apiDomain, locale } = useAppContext();
  const { addToast } = useToast();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>();

  // Handle form submission
  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async ({
    password,
    confirmPassword,
  }) => {
    if (password !== confirmPassword) {
      addToast(t('reset-password.error.mismatch'), 'error'); // Use Toast for mismatch error
      return;
    }

    setIsSubmitting(true);

    const result = await handleSubmission(
      async () => {
        setAxiosLocale(locale);
        const token = router.query.token as string; // Get the token from the query params
        return await axiosInstance.post(`${apiDomain}/v1/auth/reset-password`, {
          token,
          newPassword: password,
        });
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
      <div className="my-8 text-center">
        <h1 className="text-xl font-semibold">{t('reset-password.title')}</h1>
        <p className="text-sm text-gray-500">
          {t('reset-password.description')}
        </p>
      </div>

      {/* New Password Input */}
      <div className="mb-4">
        <Label htmlFor="password" value={t('reset-password.new-password')} />
        <TextInput
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="******"
          {...register('password', {
            required: t('reset-password.error.required'),
            minLength: {
              value: 6,
              message: t('reset-password.error.minLength'),
            },
          })}
          color={errors.password ? 'failure' : undefined}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="mb-4">
        <Label
          htmlFor="confirmPassword"
          value={t('reset-password.confirm-password')}
        />
        <TextInput
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="******"
          {...register('confirmPassword', {
            required: t('reset-password.error.required'),
            minLength: {
              value: 6,
              message: t('reset-password.error.minLength'),
            },
          })}
          color={errors.confirmPassword ? 'failure' : undefined}
          rightIcon={() => (
            <>
              {showPassword ? (
                <VscEyeClosed
                  className="cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <VscEye
                  className="cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </>
          )}
          theme={{
            field: {
              rightIcon: {
                base: 'absolute cu inset-y-0 right-0 flex items-center pr-3 pt-0',
                svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
              },
            },
          }}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('reset-password.submitting')
            : t('reset-password.submit')}
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
      const resetPasswordMessages = (
        await import(`@/locales/${locale}/reset-password.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
            'reset-password': resetPasswordMessages,
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

export default ResetPasswordPage;
