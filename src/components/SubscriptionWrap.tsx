import { useAppContext } from '@/contexts/AppContext';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import { ErrorBanner } from './ErrorBanner';
import { Loading } from './Loading';

type Props = {
  children: ReactNode;
};
export const SubscriptionWrap = ({ children }: Props) => {
  const t = useTranslations();
  const { isLoadingUser, isVipMember } = useAppContext();

  if (isLoadingUser) {
    return <Loading />;
  }

  if (!isVipMember) {
    return (
      <div
        className={`transition-opacity duration-500 ease-in-out opacity-100`}
      >
        <ErrorBanner
          showLogo={false}
          error={t('common.title.vip_required')}
          errorCode={403}
        />
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-500 ease-in-out opacity-100`}>
      {children}
    </div>
  );
};
