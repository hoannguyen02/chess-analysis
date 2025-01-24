import { Alert, Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { VscError } from 'react-icons/vsc';
import { Logo } from './Logo';
import { PrimaryButton } from './PrimaryButton';

type ErrorBannerProps = {
  error: string;
  retryAction?: () => void;
  errorCode: number;
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  errorCode,
  retryAction,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const currentPath = useMemo(() => {
    return router.asPath;
  }, [router]);

  return (
    <div className="flex justify-center items-center lg:px-4 py-6">
      <div className="w-full max-w-4xl flex flex-col">
        <Link href="/" className="mb-6 flex mx-auto">
          <Logo />
        </Link>
        <Alert
          color="failure"
          className="border border-red-300 shadow-lg rounded-lg p-6"
          icon={() => <VscError className="w-6 h-6 mr-2 text-red-500" />}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm sm:text-base font-medium text-red-800">
              {error}
            </p>
            {[401].includes(errorCode) || retryAction ? (
              <PrimaryButton
                className="ml-2 mt-2 sm:mt-0"
                onClick={() => {
                  router.push(
                    currentPath !== '/'
                      ? `/login?redirect=${encodeURIComponent(currentPath)}`
                      : '/login'
                  );
                }}
              >
                {t('common.navigation.login')}
              </PrimaryButton>
            ) : null}
            {[403].includes(errorCode) && (
              <Button
                color="yellow"
                size="lg"
                onClick={() => {
                  router.push('/register-guide');
                }}
              >
                {'common.button.register'}
              </Button>
            )}
          </div>
        </Alert>
      </div>
    </div>
  );
};
