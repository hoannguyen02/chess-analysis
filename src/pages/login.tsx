import Layout from '@/components/Layout';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance from '@/utils/axiosInstance';
import { Label, TextInput } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { SubmitHandler, useForm } from 'react-hook-form';

type LoginFormValues = {
  username: string;
  password: string;
};
const LoginPage = () => {
  const router = useRouter();
  const { apiDomain } = useAppContext();
  const t = useTranslations();
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
  } = useForm<LoginFormValues>();

  // Handle form submission
  const onSubmit: SubmitHandler<LoginFormValues> = async ({
    username,
    password,
  }) => {
    try {
      await axiosInstance.post(`${apiDomain}/v1/auth/login`, {
        username,
        password,
      });

      router.push(
        router.query.redirect
          ? decodeURIComponent(router.query.redirect as string)
          : '/'
      ); // Redirect manually
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  return (
    <Layout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mx-auto"
      >
        <div>
          <Label htmlFor="username" value={t('login.title.email')} />
          <TextInput
            id="username"
            type="email"
            placeholder="example@example.com"
            {...register('username', {
              required: t('login.message.email-required'),
              pattern: {
                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                message: t('login.message.email-invalid'),
              },
            })}
            color={errors.username ? 'failure' : undefined} // Error styling
          />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <Label htmlFor="password" value={t('login.title.password')} />
          <TextInput
            id="password"
            type="password"
            placeholder="******"
            {...register('password', {
              required: t('login.message.password-required'),
            })}
            color={errors.password ? 'failure' : undefined} // Error styling
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <PrimaryButton type="submit">{t('common.button.submit')}</PrimaryButton>
      </form>
    </Layout>
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
