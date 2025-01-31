import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { fetcher } from '@/utils/fetcher';
import { Card, Dropdown } from 'flowbite-react';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import { useToast } from '@/contexts/ToastContext';
import { DifficultyType } from '@/types';
import axiosInstance, { setAxiosLocale } from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { handleSubmission } from '@/utils/handleSubmission';
import isEmpty from 'lodash/isEmpty';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const UserHomeScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToast();
  const { session, apiDomain, locale } = useAppContext();
  const key = useMemo(
    () => (session?.id ? `/v1/auth/user/${session.id}` : undefined),
    [session?.id]
  );

  const { data: user, isLoading: isLoadingUser } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
  });

  const nextPuzzleKey = useMemo(() => {
    if (user) {
      const { rating } = user;
      let difficulties: DifficultyType[] = [];
      if (rating < 1200) {
        difficulties = ['Beginner', 'Easy'];
      } else if (rating < 1600) {
        difficulties = ['Easy', 'Medium'];
      } else if (rating < 2000) {
        difficulties = ['Medium', 'Hard'];
      } else {
        difficulties = ['Hard', 'Very Hard'];
      }

      return `${apiDomain}/v1/solve-puzzle/next?${filteredQuery({
        difficulties: difficulties.join(','),
      })}`;
    }
    return undefined;
  }, [apiDomain, user]);

  const { data: nextPuzzleId, isLoading: isLoadingNextPuzzle } = useSWR(
    nextPuzzleKey,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const handleLogout = useCallback(async () => {
    const result = await handleSubmission(
      async () => {
        setAxiosLocale(locale);
        return await axiosInstance.post(`${apiDomain}/v1/auth/logout`);
      },
      addToast,
      t('common.title.logout-success')
    );
    if (result !== undefined) {
      router.push('/');
    }
  }, [addToast, apiDomain, locale, router, t]);

  return (
    <TransitionContainer isLoading={isLoadingUser} isVisible={!isEmpty(user)}>
      <div className="flex flex-col">
        <div className="my-4 flex justify-end">
          <Dropdown label={t('common.title.profile')}>
            <Dropdown.Item onClick={() => router.push('/change-password')}>
              {t('common.navigation.change-password')}
            </Dropdown.Item>
            <Dropdown.Item onClick={handleLogout}>
              {t('common.navigation.logout')}
            </Dropdown.Item>
          </Dropdown>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <Card className="h-full w-full flex flex-col items-start min-h-[200px] border border-gray-200">
            <div className="flex flex-col flex-grow items-start">
              <div className="grid grid-cols-[auto_100px] w-full">
                <h5 className="text-lg font-semibold">
                  {t('home.puzzle-rating')}
                </h5>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 mt-2">
                {t('home.current-rating')}: <strong>{user?.rating}</strong>
              </p>
              {/* Buttons for Solve & Practice */}
              <div className="mt-8 flex space-x-4">
                <button
                  disabled={isLoadingNextPuzzle || isEmpty(nextPuzzleId)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={() => {
                    router.push(`/solve-puzzles/${nextPuzzleId}`);
                  }}
                >
                  {t('home.solve-puzzles')}
                </button>
                <Link href="/practice">
                  <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
                    {t('home.practice-puzzles')}
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Next Course Block */}
          {/* <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-lg font-semibold">{t('home.next-course')}</h2>
            <p className="text-gray-600">
              {t('home.course-title')}: <strong>Intermediate Checkmates</strong>
            </p>
            <Link href="/courses">
              <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                {t('home.continue-course')}
              </button>
            </Link>
          </div> */}
        </div>
      </div>
    </TransitionContainer>
  );
};
