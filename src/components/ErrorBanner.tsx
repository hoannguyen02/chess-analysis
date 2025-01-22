import { useAppContext } from '@/contexts/AppContext';
import { Alert } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
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
  const { session } = useAppContext();

  const handleAction = () => {
    switch (errorCode) {
      case 401:
        router.push('/login');
        break;
      case 403:
        if (session?.username) {
          router.push('/subscription');
        }
        break;

      default:
        if (retryAction) {
          retryAction();
        }
        break;
    }
  };

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
            {[401, 403].includes(errorCode) || retryAction ? (
              <PrimaryButton
                className="ml-2 mt-2 sm:mt-0"
                onClick={handleAction}
              >
                {t('common.button.retry')}
              </PrimaryButton>
            ) : null}
          </div>
        </Alert>
      </div>
    </div>
  );
};
