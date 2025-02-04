import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { fetcher } from '@/utils/fetcher';
import { Button, Card, Dropdown, Tabs } from 'flowbite-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useToast } from '@/contexts/ToastContext';
import { User } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import isEmpty from 'lodash/isEmpty';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
const SolvePuzzleHistories = dynamic(() =>
  import('./SolvePuzzleHistories').then(
    (components) => components.SolvePuzzleHistories
  )
);
const PracticePuzzleHistories = dynamic(() =>
  import('./PracticePuzzleHistories').then(
    (components) => components.PracticePuzzleHistories
  )
);

export const UserHomeScreen = () => {
  const t = useTranslations();
  const [user, setUser] = useState<User>();
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { session, apiDomain, locale } = useAppContext();
  const [activeTab, setActiveTab] = useState('rated');
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
      return `${apiDomain}/v1/solve-puzzle/next?rating=${user.rating}`;
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
                className="text-sm  line-clamp-3 mt-2"
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
                  onClick={() => {
                    router.push(`/practice-puzzles`);
                  }}
                >
                  {t('common.title.practice-puzzles')}
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
                      router.push(`/lessons/${nextCourse.slug}`);
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
        <h3 className="mt-8 mb-2 font-semibold">{t('home.recent-puzzles')}</h3>
        <Tabs aria-label={t('home.recent-puzzles')}>
          <Tabs.Item
            active={activeTab === 'rated'}
            title={t('home.rated')}
            onClick={() => setActiveTab('rated')}
          >
            <SolvePuzzleHistories />
          </Tabs.Item>
          <Tabs.Item
            active={activeTab === 'custom'}
            title={t('home.custom')}
            onClick={() => setActiveTab('custom')}
          >
            <PracticePuzzleHistories />
          </Tabs.Item>
        </Tabs>
      </div>
    </TransitionContainer>
  );
};
