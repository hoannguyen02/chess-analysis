import {
  BOARD_THEME_MAP,
  BoardThemeId,
  DEFAULT_BOARD_THEME,
} from '@/constants/board-themes';
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
  boardTheme: BoardThemeId;
  setBoardTheme: React.Dispatch<React.SetStateAction<BoardThemeId>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  locale: LocaleType;
  isMobileSSR: boolean;
}> = ({ children, locale, isMobileSSR }) => {
  const [isMobile, setIsMobile] = useState(isMobileSSR);
  const [boardTheme, setBoardTheme] =
    useState<BoardThemeId>(DEFAULT_BOARD_THEME);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial client-side check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedBoardTheme = window.localStorage.getItem('board-theme');
    if (
      savedBoardTheme &&
      Object.prototype.hasOwnProperty.call(BOARD_THEME_MAP, savedBoardTheme)
    ) {
      setBoardTheme(savedBoardTheme as BoardThemeId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('board-theme', boardTheme);
  }, [boardTheme]);

  const value = useMemo(
    () => ({
      locale,
      isMobile,
      boardTheme,
      setBoardTheme,
    }),
    [boardTheme, locale, isMobile]
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
