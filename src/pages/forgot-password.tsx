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

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPasswordPage = () => {
  const router = useRouter();
  const { apiDomain } = useAppContext();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>();

  // Handle form submission
  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async ({
    email,
  }) => {
    setIsSubmitting(true);
    const result = await handleSubmission(
      async () => {
        return await axiosInstance.post(
          `${apiDomain}/v1/auth/forgot-password`,
          {
            email,
          }
        );
      },
      addToast, // Pass addToast to show toast notifications
      t('forgot-password.success', { email })
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
        <h1 className="text-xl font-semibold">{t('forgot-password.title')}</h1>
        <p className="text-sm text-gray-500">
          {t('forgot-password.description')}
        </p>
      </div>

      {/* Email Input */}
      <div className="mb-4">
        <Label htmlFor="email" value={t('forgot-password.email-label')} />
        <TextInput
          id="email"
          type="email"
          placeholder={`${t('common.title.example')}: limachess102@gmail.com`}
          {...register('email', {
            required: t('forgot-password.email-required'),
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: t('forgot-password.email-invalid'),
            },
          })}
          color={errors.email ? 'failure' : undefined} // Error styling
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('common.button.sending')
            : t('common.button.submit')}
        </PrimaryButton>
      </div>

      <div className="text-center mt-4">
        <Link href="/login" className="text-blue-500 text-sm hover:underline">
          {t('forgot-password.back-to-login')}
        </Link>
      </div>
    </form>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    try {
      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;
      const forgotPasswordMessages = (
        await import(`@/locales/${locale}/forgot-password.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
            'forgot-password': forgotPasswordMessages,
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

export default ForgotPasswordPage;
