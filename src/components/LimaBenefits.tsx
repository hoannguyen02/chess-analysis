import { useTranslations } from 'next-intl';

export const LimaBenefits = () => {
  const t = useTranslations('common');
  return (
    <ul className="mt-2 text-gray-700 text-lg space-y-2">
      <li>✅ {t('benefits.support')}</li>
      <li>✅ {t('benefits.learn')}</li>
      <li>✅ {t('benefits.practice')}</li>
    </ul>
  );
};
