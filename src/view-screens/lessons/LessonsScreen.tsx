import { MenuLessonDrawer } from '@/components/MenuLessonDrawer';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { Lesson } from '@/types/lesson';
import { LocaleType } from '@/types/locale';
import { fetcher } from '@/utils/fetcher';
import { filteredQuery } from '@/utils/filteredQuery';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Button, Card, Pagination } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { VscLayoutMenubar } from 'react-icons/vsc';
import useSWR from 'swr';
import { LessonFilters } from './LessonFilters';

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
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const router = useRouter();
  const { apiDomain } = useAppContext();

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

  const { data } = useSWR(queryKey, fetcher, {
    fallbackData: { items: initialLessons, totalPages },
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

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
    <>
      <div className="flex">
        <aside className="w-1/4 h-[calc(100vh-120px)] overflow-y-auto border-r border-l border-t rounded-md sticky top-0 hidden lg:flex lg:flex-col p-4">
          <LessonFilters />
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
                            <Badge
                              color={getDifficultyColor(lesson.difficulty)}
                            >
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
                    {t('common.title.no-results')}
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
            {/* Mobile */}
            <div className="w-full fixed left-0 bottom-0 p-4 lg:hidden bg-white shadow-lg border-t border-gray-300 rounded-t-lg">
              <Button
                outline
                gradientDuoTone="tealToLime"
                onClick={() => {
                  setIsOpenDrawer(true);
                }}
              >
                <VscLayoutMenubar />
              </Button>
            </div>
          </TransitionContainer>
        </div>
      </div>
      {isOpenDrawer && (
        <MenuLessonDrawer
          ref={drawerRef} // Pass ref to the component
          onClose={() => {
            setIsOpenDrawer(false);
          }}
        >
          <LessonFilters />
        </MenuLessonDrawer>
      )}
    </>
  );
};
