import { LimaBenefits } from '@/components/LimaBenefits';
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
      <h4 className="mt-6 text-lg font-semibold">🚀 {t('home.heading')}</h4>
      <LimaBenefits />
      <Button
        outline
        gradientDuoTone="pinkToOrange"
        size="lg"
        className="mt-4 font-semibold"
        onClick={() => router.push('/register-guide')}
      >
        {t('common.button.join-now')}
      </Button>
    </div>
  );
};
