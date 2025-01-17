import { LocaleType } from '@/types/locale';
import { PuzzleTheme } from '@/types/puzzle-theme';
import { Tag } from '@/types/tag';
import React, { createContext, useContext, useMemo } from 'react';

export interface AppContextProps {
  themes: PuzzleTheme[] | [];
  tags: Tag[] | [];
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
  tags: Tag[];
}> = ({ children, themes, apiDomain, locale, tags }) => {
  const value = useMemo(
    () => ({
      locale,
      themes:
        (themes || []).map((theme) => ({
          value: theme.code,
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
          [theme.code]: theme,
        };
      }, {}),
      apiDomain,
    }),
    [locale, themes, tags, apiDomain]
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
