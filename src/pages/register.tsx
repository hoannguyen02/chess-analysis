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

type RegisterFormValues = {
  username: string;
  password: string;
};
const RegisterPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();
  const { apiDomain } = useAppContext();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
  } = useForm<RegisterFormValues>();

  // Handle form submission
  const onSubmit: SubmitHandler<RegisterFormValues> = async ({
    username,
    password,
  }) => {
    setIsSubmitting(true);
    const registerResult = await handleSubmission(
      async () => {
        return await axiosInstance.post(`${apiDomain}/v1/auth/register`, {
          username,
          password,
        });
      },
      addToast, // Pass addToast to show toast notifications
      t('register.success') // Success message
    );

    if (registerResult) {
      const loginResult = await handleSubmission(
        async () => {
          return await axiosInstance.post(`${apiDomain}/v1/auth/login`, {
            username,
            password,
            rememberMe: true,
          });
        },
        addToast, // Pass addToast to show toast notifications
        t('login.success') // Success message
      );
      setIsSubmitting(false);

      if (loginResult !== undefined) {
        router.push(
          router.query.redirect
            ? decodeURIComponent(router.query.redirect as string)
            : '/'
        ); // Redirect manually
      }
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto px-4">
      <div className="flex justify-center mt-8">
        <Link href="/" className="mb-6">
          <Logo />
        </Link>
      </div>
      <h3 className="mb-4 text-center">{t('register.title')}</h3>
      <div className="mb-4">
        <Label htmlFor="username" value={t('register.email-label')} />
        <TextInput
          id="username"
          type="email"
          placeholder={`${t('common.title.example')}: limachess102@gmail.com`}
          {...register('username', {
            required: t('register.email-required'),
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: t('register.email-invalid'),
            },
          })}
          color={errors.username ? 'failure' : undefined} // Error styling
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="mb-4">
        <Label htmlFor="password" value={t('register.password')} />
        <div className="positive">
          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'} // Toggle input type
            placeholder="******"
            {...register('password', {
              required: t('register.password-required'),
            })}
            color={errors.password ? 'failure' : undefined} // Error styling
            className="flex items-center"
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
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
      </div>
      <p className="text-sm mt-16">
        {t('register.continue-title')}
        <Link
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-sm hover:underline ml-2"
        >
          {t('common.navigation.privacy')}
        </Link>
        <Link
          href="/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-sm hover:underline ml-2"
        >
          {t('common.navigation.terms')}
        </Link>
      </p>
      <div className="flex justify-center">
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.button.sending') : t('register.continue')}
        </PrimaryButton>
      </div>
      <div className="mt-16 text-center">
        {t('register.login-title')}
        <Link
          href="/login"
          className="text-blue-500 text-sm hover:underline ml-2"
        >
          {t('register.login')}
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
      const registerMessages = (
        await import(`@/locales/${locale}/register.json`)
      ).default;
      const loginMessages = (await import(`@/locales/${locale}/login.json`))
        .default;

      return {
        props: {
          messages: {
            common: commonMessages,
            register: registerMessages,
            login: loginMessages,
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

export default RegisterPage;
