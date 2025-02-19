import DebouncedInput from '@/components/DebounceInput';
import { TransitionContainer } from '@/components/TransitionContainer';
import { LEVEL_RATING } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Lesson } from '@/types/lesson';
import { LocaleType } from '@/types/locale';
import { fetcher } from '@/utils/fetcher';
import { filteredQuery } from '@/utils/filteredQuery';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Card, Label, Pagination } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const difficultyOptions = Object.entries(LEVEL_RATING).map(
  ([rating, title]) => ({
    value: rating,
    label: title,
  })
);

type Props = {
  initialLessons: Lesson[];
  locale: LocaleType;
  currentPage: number;
  totalPages: number;
};
export const LessonsScreen = ({
  initialLessons,
  locale,
  totalPages,
  currentPage,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const {
    apiDomain,
    isSubscriptionExpired,
    tags: initialTags,
  } = useAppContext();

  const { difficulty, search, tags } = router.query;

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      difficulty,
      search,
      locale,
      tags,
      page: currentPage,
    };

    return filteredQuery(queryObject);
  }, [difficulty, search, locale, tags, currentPage]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/lessons/public?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, isValidating } = useSWR(queryKey, fetcher, {
    fallbackData: { items: initialLessons, totalPages },
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  const handleDifficultyChange = (value: string) => {
    const selectedDifficulties = new Set(
      (difficulty as string)?.split(',').filter(Boolean)
    );

    if (selectedDifficulties.has(value)) {
      selectedDifficulties.delete(value);
    } else {
      selectedDifficulties.add(value);
    }

    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          difficulty: Array.from(selectedDifficulties).join(','),
          page: 1,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  // Display puzzle
  const [isLoading, setIsLoading] = useState(false);
  const [displayedLessons, setDisplayedLessons] = useState<Lesson[]>([]);
  const [isVisible, setIsVisible] = useState(false); // For fade-in transition
  // Initial
  useEffect(() => {
    setIsVisible(false);
    setIsLoading(true);

    setTimeout(() => {
      setDisplayedLessons(initialLessons);
      setIsLoading(false);
      setIsVisible(true);
    }, 300);
  }, [initialLessons]);

  // When data items change
  useEffect(() => {
    setIsVisible(false);
    setIsLoading(true);

    setTimeout(() => {
      setDisplayedLessons(data.items);
      setIsLoading(false);
      setIsVisible(true);
    }, 300);
  }, [data.items]);
  // End Display puzzle

  return (
    <div className="flex">
      <aside className="w-1/4 h-[calc(100vh-120px)] overflow-y-auto border-r border-l border-t rounded-md sticky top-0 hidden lg:flex lg:flex-col p-4">
        <div className="flex flex-col mb-8">
          <DebouncedInput
            placeholder={t('common.title.search')}
            initialValue={search as string}
            onChange={(value) => {
              router.push(
                {
                  pathname: router.pathname,
                  query: { ...router.query, page: 1, search: value },
                },
                undefined,
                { shallow: true }
              );
            }}
          />
          <div className="flex flex-col gap-2 mt-4">
            <Label className="font-semibold">
              {t('common.title.difficulty')}
            </Label>
            {difficultyOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(difficulty as string)
                    ?.split(',')
                    .includes(option.value)}
                  onChange={() => handleDifficultyChange(option.value)}
                  className="form-checkbox text-blue-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Label className="font-semibold">{t('common.title.tags')}</Label>
            {initialTags.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(difficulty as string)
                    ?.split(',')
                    .includes(option.value)}
                  onChange={() => handleDifficultyChange(option.value)}
                  className="form-checkbox text-blue-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>
      <div className="w-full lg:w-3/4 p-4 pb-[120px] lg:pb-4 lg:pl-8 overflow-y-auto h-[calc(100vh-120px)]">
        <TransitionContainer isLoading={isLoading} isVisible={isVisible}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedLessons && displayedLessons.length > 0 ? (
              displayedLessons?.map((lesson: Lesson) => (
                <Link
                  key={lesson.title[locale]}
                  href={`/lessons/${lesson.slug}`}
                >
                  <Card className="h-full w-full flex flex-col items-start min-h-[230px] border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-lg hover:border-blue-500">
                    <div className="flex flex-col flex-grow items-start">
                      <div className="grid grid-cols-[auto_100px] w-full">
                        <h5 className="text-lg font-semibold">
                          {lesson.title[locale]}
                        </h5>
                        <div className="flex justify-end">
                          <Badge color={getDifficultyColor(lesson.difficulty)}>
                            {lesson.difficulty || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-3 mt-2">
                        {lesson.description?.[locale] || ''}
                      </p>
                    </div>
                    {/* {session?.id && (
                  <div className="mt-2 w-full">
                    <Progress
                      progress={course.progress?.completionPercentage || 0}
                      size="sm"
                    />
                  </div>
                )} */}
                  </Card>
                </Link>
              ))
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 text-lg">
                  {t('common.button.previous')}
                </p>
              </div>
            )}
          </div>
          {totalPages > 10 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  router.push(
                    {
                      pathname: '/',
                      query: { ...router.query, page },
                    },
                    undefined,
                    {
                      shallow: true,
                    }
                  );
                }}
                previousLabel={t('common.button.previous')}
                nextLabel={t('common.button.next')}
              />
            </div>
          )}
        </TransitionContainer>
      </div>
    </div>
  );
};
