import { LocaleType } from '@/types/locale';
import { PuzzleTheme } from '@/types/puzzle-theme';
import { Session } from '@/types/session';
import { Tag } from '@/types/tag';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface AppContextProps {
  themes: PuzzleTheme[] | [];
  tags: Tag[] | [];
  apiDomain: string;
  themeMap: Partial<Record<string, PuzzleTheme>>;
  locale: LocaleType;
  isMobile: boolean;
  session?: Session | null;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  themes: PuzzleTheme[];
  apiDomain: string;
  locale: LocaleType;
  tags: Tag[];
  isMobileSSR: boolean;
  session?: Session;
}> = ({ children, themes, apiDomain, locale, tags, isMobileSSR, session }) => {
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
      themes:
        (themes || []).map((theme) => ({
          value: theme._id,
          label: theme.title[locale],
          _id: theme._id,
          code: theme.code,
          title: theme.title,
        })) || [],
      tags:
        (tags || []).map((tag) => ({
          value: tag.name,
          label: tag.name,
          _id: tag._id,
          name: tag.name,
          type: tag.type,
        })) || [],
      themeMap: (themes || []).reduce((acc, theme) => {
        return {
          ...acc,
          [theme._id]: theme,
        };
      }, {}),
      apiDomain,
      isMobile,
      session,
    }),
    [locale, themes, tags, apiDomain, isMobile, session]
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
