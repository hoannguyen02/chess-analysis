import { useAppContext } from '@/contexts/AppContext';
import { fetcher } from '@/utils/fetcher';
import { Button, Card, Tabs } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { Loading } from '@/components/Loading';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { filteredQuery } from '@/utils/filteredQuery';
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
const Bookmarks = dynamic(() =>
  import('./Bookmarks').then((components) => components.Bookmarks)
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
    mutateUser,
  } = useAppContext();

  useEffect(() => {
    mutateUser();
  }, [mutateUser]);

  const { excludedThemeIds } = getFilteredThemes();
  const [activeTab, setActiveTab] = useState('rated');

  //
  const nextCourseKey = useMemo(() => {
    return user ? `/v1/lessons/next-lesson/${user._id}` : undefined;
  }, [user]);
  const { data: nextLesson, isLoading: isLoadingNextLesson } = useSWR(
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

  if (isLoadingUser || isLoadingNextLesson) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col">
      {/* Subscription Expired Banner */}
      {isSubscriptionExpired && <SubscriptionBanner />}

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
          {nextLesson ? (
            <>
              <p className="text-gray-600 mt-2">{nextLesson.title[locale]}</p>
              <div className="mt-4">
                <Button
                  outline
                  gradientDuoTone="cyanToBlue"
                  size="lg"
                  onClick={() => {
                    router.push(`/lessons/${nextLesson.slug}`);
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
        <Tabs.Item
          active={activeTab === 'bookmark'}
          title={t('home.bookmark')}
          onClick={() => setActiveTab('bookmark')}
        >
          <Bookmarks />
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
