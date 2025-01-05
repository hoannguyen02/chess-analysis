import { PuzzleTheme } from '@/types/puzzle-theme';
import React, { createContext, useContext, useMemo } from 'react';

export interface AppContextProps {
  themes: PuzzleTheme[] | null;
  apiDomain: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  themes: PuzzleTheme[];
  apiDomain: string;
}> = ({ children, themes, apiDomain }) => {
  const value = useMemo(
    () => ({
      themes,
      apiDomain,
    }),
    [themes, apiDomain]
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
