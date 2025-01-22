import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance from '@/utils/axiosInstance';
import { Checkbox, Label, TextInput } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

type LoginFormValues = {
  username: string;
  password: string;
  rememberMe: boolean;
};
const LoginPage = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Retrieve success message from sessionStorage
    const message = sessionStorage.getItem('successMessage');
    if (message) {
      setSuccessMessage(message);
      sessionStorage.removeItem('successMessage'); // Clear the message after showing it
    }
  }, []);
  const router = useRouter();
  const { apiDomain } = useAppContext();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
  } = useForm<LoginFormValues>();

  // Handle form submission
  const onSubmit: SubmitHandler<LoginFormValues> = async ({
    username,
    password,
    rememberMe,
  }) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`${apiDomain}/v1/auth/login`, {
        username,
        password,
        rememberMe,
      });

      router.push(
        router.query.redirect
          ? decodeURIComponent(router.query.redirect as string)
          : '/'
      ); // Redirect manually
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto px-4">
      <div className="flex justify-center mt-8">
        <Logo />
      </div>
      {successMessage && (
        <div className="text-center bg-green-100 text-green-700 p-2 mb-4 rounded">
          {successMessage}
        </div>
      )}
      <div className="mb-4">
        <Label htmlFor="username" value={t('login.email-label')} />
        <TextInput
          id="username"
          type="email"
          placeholder={`${t('common.title.ex')}: contact@limachess.com`}
          {...register('username', {
            required: t('login.email-required'),
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: t('login.email-invalid'),
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
        <Label htmlFor="password" value={t('login.password')} />
        <div className="positive">
          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'} // Toggle input type
            placeholder="******"
            {...register('password', {
              required: t('login.password-required'),
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

      <div className="flex items-center justify-between">
        {/* Remember Me Checkbox */}
        <div className="flex items-center">
          <Checkbox id="rememberMe" {...register('rememberMe')} />
          <Label htmlFor="rememberMe" className="ml-2">
            {t('login.remember-me')}
          </Label>
        </div>
        {/* Forgot Password Link */}
        <Link
          href="/forgot-password"
          className="text-blue-500 text-sm hover:underline"
        >
          {t('login.forgot-password')}
        </Link>
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
      const loginMessages = (await import(`@/locales/${locale}/login.json`))
        .default;

      return {
        props: {
          messages: {
            common: commonMessages,
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

export default LoginPage;
