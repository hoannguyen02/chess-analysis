import { useAppContext } from '@/contexts/AppContext';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import { ErrorBanner } from './ErrorBanner';

type Props = {
  children: ReactNode;
};
export const SubscriptionWrap = ({ children }: Props) => {
  const t = useTranslations();
  const { isShowSetupBoard } = useAppContext();

  if (!isShowSetupBoard) {
    return (
      <ErrorBanner
        showLogo={false}
        error={t('common.title.vip_required')}
        errorCode={403}
      />
    );
  }

  return children;
};
