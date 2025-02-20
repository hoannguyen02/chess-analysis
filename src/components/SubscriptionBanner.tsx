import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { VscWarning } from 'react-icons/vsc';

export const SubscriptionBanner = () => {
  const t = useTranslations();
  const router = useRouter();
  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md flex flex-col lg:flex-row items-center justify-between mb-4 lg:max-w-lg mx-auto">
      <div className="flex items-center space-x-3">
        <VscWarning />
        <div>
          <strong className="font-semibold">
            {t('home.subscription.expired-title')}
          </strong>
          <p className="text-sm mt-1">
            {t('home.subscription.expired-message')}
          </p>
        </div>
      </div>
      <Button
        outline
        gradientDuoTone="redToOrange"
        size="md"
        className="mt-2 md:mt-0 md:ml-4"
        onClick={() => router.push('/register-guide')}
      >
        {t('common.button.subscribe-now')}
      </Button>
    </div>
  );
};
