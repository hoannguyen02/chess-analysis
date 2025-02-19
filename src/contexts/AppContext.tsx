import { ExcludeThemeInFilter } from '@/constants';
import { LocaleType } from '@/types/locale';
import { PuzzleTheme } from '@/types/puzzle-theme';
import { Session } from '@/types/session';
import { Tag } from '@/types/tag';
import { User } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import { checkIsSubscriptionExpired } from '@/utils/checkIsSubscriptionExpired';
import { fetcher } from '@/utils/fetcher';
import isEmpty from 'lodash/isEmpty';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useSWR from 'swr';

export interface AppContextProps {
  themes: PuzzleTheme[] | [];
  tags: Tag[] | [];
  apiDomain: string;
  themeMap: Partial<Record<string, PuzzleTheme>>;
  locale: LocaleType;
  isMobile: boolean;
  session?: Session | null;
  user?: User;
  isLoggedIn?: boolean;
  isLoadingUser?: boolean;
  isSubscriptionExpired?: boolean;
  getFilteredThemes(): {
    themeOptions: PuzzleTheme[] | [];
    excludedThemeIds: string[] | [];
  };
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  apiDomain: string;
  locale: LocaleType;
  isMobileSSR: boolean;
  session?: Session;
}> = ({ children, apiDomain, locale, isMobileSSR, session }) => {
  const [isMobile, setIsMobile] = useState(isMobileSSR);
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const { data: themes } = useSWR<PuzzleTheme[]>(
    `${apiDomain}/v1/puzzle-themes/public/all`,
    fetcher
  );

  const { data: tags } = useSWR<Tag[]>(
    `${apiDomain}/v1/tags/public/all`,
    fetcher
  );

  useEffect(() => {
    const usedId = session?.id;
    if (locale && usedId) {
      const fetchUser = async () => {
        setIsLoadingUser(true);
        try {
          const userResponse = await axiosInstance.get<User>(
            `${apiDomain}/v1/auth/user/${usedId}`
          );
          setUser(userResponse.data);
        } catch (error) {
          console.log(error);
        } finally {
          setIsLoadingUser(false);
        }
      };
      fetchUser();
    }
  }, [apiDomain, locale, session?.id]);

  const isSubscriptionExpired = useMemo(() => {
    if (user?.subscriptionEnd) {
      return checkIsSubscriptionExpired(user.subscriptionEnd);
    }

    return false;
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial client-side check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allThemes = useMemo(() => {
    return (
      (themes || []).map((theme) => ({
        value: theme._id,
        label: theme.title[locale],
        _id: theme._id,
        code: theme.code,
        title: theme.title,
        priority: theme.priority,
      })) || []
    );
  }, [locale, themes]);

  const getFilteredThemes = useCallback(() => {
    if (!allThemes)
      return {
        themeOptions: [],
        excludedThemeIds: [],
      };

    const excludedThemeIds: string[] = [];

    const themeOptions = allThemes.filter((theme) => {
      const excludedTheme = ExcludeThemeInFilter[theme.code];

      if (excludedTheme) {
        excludedThemeIds.push(theme._id);
        return false;
      }

      return true;
    });

    return {
      themeOptions,
      excludedThemeIds,
    };
  }, [allThemes]);

  const value = useMemo(
    () => ({
      locale,
      themes: allThemes,
      tags:
        (tags || []).map((tag) => ({
          value: tag.name,
          label: tag.title?.[locale] || tag.name,
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
      getFilteredThemes,
      apiDomain,
      isMobile,
      session,
      user,
      isLoadingUser,
      isSubscriptionExpired,
      isLoggedIn: !isEmpty(session?.id),
    }),
    [
      locale,
      allThemes,
      tags,
      themes,
      getFilteredThemes,
      apiDomain,
      isMobile,
      session,
      user,

      isLoadingUser,
      isSubscriptionExpired,
    ]
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
