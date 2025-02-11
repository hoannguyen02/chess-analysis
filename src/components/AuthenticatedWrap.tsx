import { useAppContext } from '@/contexts/AppContext';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import { ErrorBanner } from './ErrorBanner';

type Props = {
  children: ReactNode;
};
export const AuthenticatedWrap = ({ children }: Props) => {
  const t = useTranslations();
  const { session } = useAppContext();

  if (!session?.id) {
    return (
      <ErrorBanner
        showLogo={false}
        error={t('common.title.un_authorized')}
        errorCode={401}
      />
    );
  }

  return children;
};
