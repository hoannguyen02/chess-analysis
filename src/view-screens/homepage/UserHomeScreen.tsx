import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { fetcher } from '@/utils/fetcher';
import { Button, Card, Dropdown } from 'flowbite-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useToast } from '@/contexts/ToastContext';
import { DifficultyType } from '@/types';
import { User } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { handleSubmission } from '@/utils/handleSubmission';
import isEmpty from 'lodash/isEmpty';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';

export const UserHomeScreen = () => {
  const t = useTranslations();
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { session, apiDomain, locale } = useAppContext();
  //
  const nextCourseKey = useMemo(() => {
    return user ? `/v1/courses/next-course/${user._id}` : undefined;
  }, [user]);
  const { data: nextCourse, isLoading: isLoadingNextCourse } = useSWR(
    nextCourseKey,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (locale) {
      const fetchUser = async () => {
        setIsLoadingUser(true);
        try {
          const userResponse = await axiosInstance.get<User>(
            `${apiDomain}/v1/auth/user/${session?.id}`
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
      dedupingInterval: 300,
    }
  );

  const handleLogout = useCallback(async () => {
    const result = await handleSubmission(
      async () => {
        return await axiosInstance.post(`${apiDomain}/v1/auth/logout`);
      },
      addToast,
      t('common.title.logout-success')
    );
    if (result !== undefined) {
      router.push('/');
    }
  }, [addToast, apiDomain, router, t]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="w-full flex flex-col items-start min-h-[200px] border border-gray-200">
            <div className="flex flex-col flex-grow items-start">
              <h2 className="text-lg font-semibold">{t('home.performance')}</h2>
              <p
                className="text-sm text-gray-500 line-clamp-3 mt-2"
                dangerouslySetInnerHTML={{
                  __html: user?.feedback as string,
                }}
              ></p>
              {/* Buttons for Solve & Practice */}
              <div className="mt-8 flex space-x-4">
                <Button
                  outline
                  gradientDuoTone="cyanToBlue"
                  size="lg"
                  disabled={isLoadingNextPuzzle || isEmpty(nextPuzzleId)}
                  onClick={() => {
                    router.push(`/solve-puzzles/${nextPuzzleId}`);
                  }}
                >
                  {t('home.solve-puzzles')}
                </Button>
                <Button
                  outline
                  gradientDuoTone="cyanToBlue"
                  size="lg"
                  // disabled={isLoadingNextPuzzle || isEmpty(nextPuzzleId)}
                  onClick={() => {
                    router.push(`/solve-puzzles/${nextPuzzleId}`);
                  }}
                >
                  {t('home.practice-puzzles')}
                </Button>
              </div>
            </div>
          </Card>
          <Card className="w-full flex flex-col items-start min-h-[200px] border border-gray-200">
            <h2 className="text-lg font-semibold">{t('home.next-course')}</h2>
            {nextCourse ? (
              <>
                <p className="text-gray-600 mt-2">{nextCourse.title[locale]}</p>
                <div className="mt-4">
                  <Button
                    outline
                    gradientDuoTone="cyanToBlue"
                    size="lg"
                    disabled={isLoadingNextPuzzle || isEmpty(nextPuzzleId)}
                    onClick={() => {
                      router.push(`/solve-puzzles/${nextPuzzleId}`);
                    }}
                  >
                    {t('common.title.start')}
                  </Button>
                </div>
              </>
            ) : (
              <p>{t('home.no-course')}</p>
            )}
          </Card>
        </div>
      </div>
    </TransitionContainer>
  );
};
