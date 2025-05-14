import { LocaleType } from '@/types/locale';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface AppContextProps {
  locale: LocaleType;
  isMobile: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  locale: LocaleType;
  isMobileSSR: boolean;
}> = ({ children, locale, isMobileSSR }) => {
  const [isMobile, setIsMobile] = useState(isMobileSSR);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial client-side check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = useMemo(
    () => ({
      locale,

      isMobile,
    }),
    [locale, isMobile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
