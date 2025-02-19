import { useAppContext } from '@/contexts/AppContext';
import { fetcher } from '@/utils/fetcher';
import { Button, Card, Tabs } from 'flowbite-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { Loading } from '@/components/Loading';
import { filteredQuery } from '@/utils/filteredQuery';
import isEmpty from 'lodash/isEmpty';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { VscWarning } from 'react-icons/vsc';
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
  const router = useRouter();
  const {
    apiDomain,
    locale,
    getFilteredThemes,
    user,
    isLoadingUser,
    isSubscriptionExpired,
  } = useAppContext();
  const { excludedThemeIds } = getFilteredThemes();
  const [activeTab, setActiveTab] = useState('rated');

  //
  const nextCourseKey = useMemo(() => {
    return user ? `/v1/courses/next-course/${user._id}` : undefined;
  }, [user]);
  const { data: nextCourse, isLoading: isLoadingNextCourse } = useSWR(
    nextCourseKey,
    fetcher
  );

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      rating: user?.rating,
      excludedThemeIds: excludedThemeIds.join(','),
    };

    return filteredQuery(queryObject);
  }, [excludedThemeIds, user?.rating]);

  const nextPuzzleKey = useMemo(() => {
    if (user) {
      return `${apiDomain}/v1/solve-puzzle/next?${queryString}`;
    }
    return undefined;
  }, [apiDomain, queryString, user]);

  const { data: nextPuzzleId, isLoading: isLoadingNextPuzzle } = useSWR(
    nextPuzzleKey,
    fetcher
  );

  if (isLoadingUser || isLoadingNextCourse) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col">
      {/* Subscription Expired Banner */}
      {isSubscriptionExpired && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md flex flex-col lg:flex-row items-center justify-between mb-4 lg:max-w-lg mx-auto">
          <div className="flex items-center space-x-3">
            <VscWarning />
            <div>
              <strong className="font-semibold">
                {t('home.subscription.expired-title')}
              </strong>
              <p className="text-sm mt-1">
                {t('home.subscription.expired-message')}
              </p>
            </div>
          </div>
          <Button
            outline
            gradientDuoTone="redToOrange"
            size="md"
            className="mt-2 md:mt-0 md:ml-4"
            onClick={() => router.push('/register-guide')}
          >
            {t('home.subscription.renew')}
          </Button>
        </div>
      )}

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
                  router.push(`/practice`);
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
  );
};
