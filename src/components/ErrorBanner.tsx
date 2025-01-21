import { Alert } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import React from 'react';
import { VscError } from 'react-icons/vsc';
import { PrimaryButton } from './PrimaryButton';

type ErrorBannerProps = {
  error: string;
  retryAction?: () => void; // Optional retry action
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  retryAction,
}) => {
  const router = useRouter();
  const t = useTranslations();

  const handleAction = () => {
    if (error === 'guest_user') {
      router.push('/login');
    } else if (error === 'subscription_expired') {
      router.push('/subscription');
    } else if (retryAction) {
      retryAction();
    }
  };

  const getActionLabel = () => {
    switch (error) {
      case 'guest_user':
        return t('common.navigation.login');
      case 'subscription_expired':
        return t('common.navigation.renew-subscription');
      default:
        return t('common.navigation.retry');
    }
  };

  return (
    <div className="flex justify-center items-center px-4 py-6">
      <div className="w-full max-w-4xl">
        <Alert
          color="failure"
          className="border border-red-300 shadow-lg rounded-lg p-6"
          icon={() => <VscError className="w-6 h-6 mr-2 text-red-500" />}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm sm:text-base font-medium text-red-800">
              {t(`common.error.${error}`)}
            </p>
            {['guest_user', 'subscription_expired'].includes(error || '') ||
            retryAction ? (
              <PrimaryButton className="ml-2" onClick={handleAction}>
                {getActionLabel()}
              </PrimaryButton>
            ) : null}
          </div>
        </Alert>
      </div>
    </div>
  );
};
