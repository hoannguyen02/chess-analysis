import { useTranslations } from 'next-intl';

export const LimaBenefits = () => {
  const t = useTranslations('common');
  return (
    <ul className="mt-2 text-gray-700 text-lg space-y-2">
      <li>✅ {t('benefits.learn-fast')}</li>
      <li>✅ {t('benefits.lowest-price')}</li>
      <li>✅ {t('benefits.support')}</li>
      <li>✅ {t('benefits.easy-started')}</li>
      <li>✅ {t('benefits.confident')}</li>
    </ul>
  );
};
