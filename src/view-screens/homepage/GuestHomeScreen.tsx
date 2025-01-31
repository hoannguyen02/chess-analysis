import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';

export const GuestHomeScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  return (
    <div className="flex flex-col justify-center items-center mt-6 w-full px-4">
      <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-center gradient-text">
        {t('home.headline')}
      </h1>
      <h4 className="mt-6 text-lg font-semibold">
        🚀 {t('home.benefits.heading')}
      </h4>
      <ul className="mt-2 text-gray-700 text-lg space-y-2">
        <li>✅ {t('home.benefits.learn-fast')}</li>
        <li>✅ {t('home.benefits.lowest-price')}</li>
        <li>✅ {t('home.benefits.support')}</li>
        <li>✅ {t('home.benefits.easy-started')}</li>
      </ul>
      <Button
        outline
        gradientDuoTone="pinkToOrange"
        size="lg"
        className="mt-4 font-semibold"
        onClick={() => router.push('/register-guide')}
      >
        {t('common.button.buy-now')}
      </Button>
    </div>
  );
};
