import { LocaleType } from '@/types/locale';
import { PuzzleTheme } from '@/types/puzzle-theme';
import React, { createContext, useContext, useMemo } from 'react';

export interface AppContextProps {
  themes: PuzzleTheme[] | [];
  apiDomain: string;
  themeMap: Partial<Record<string, PuzzleTheme>>;
  locale: LocaleType;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  themes: PuzzleTheme[];
  apiDomain: string;
  locale: LocaleType;
}> = ({ children, themes, apiDomain, locale }) => {
  const value = useMemo(
    () => ({
      locale,
      themes,
      themeMap: themes?.reduce((acc, theme) => {
        return {
          ...acc,
          [theme.code]: theme,
        };
      }, {}),
      apiDomain,
    }),
    [locale, themes, apiDomain]
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
