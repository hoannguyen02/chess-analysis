import { useTranslations } from 'next-intl';

export default function Slogan() {
  const t = useTranslations('home');
  return (
    <div className="flex justify-center items-center mt-6 w-full px-4">
      <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-center gradient-text">
        {t('headline')}
      </h1>
    </div>
  );
}
