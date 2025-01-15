import DebouncedInput from '@/components/DebounceInput';
import { LEVEL_RATING } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Course } from '@/types/course';
import { LocaleType } from '@/types/locale';
import { fetcher } from '@/utils/fetcher';
import { filteredQuery } from '@/utils/filteredQuery';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import {
  Badge,
  Card,
  Pagination,
  Progress,
  Select,
  Spinner,
} from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import useSWR from 'swr';

type Props = {
  initialCourses: Course[];
  locale: LocaleType;
  currentPage: number;
  totalPages: number;
  tacticsOnly?: boolean;
  initialTheme?: string;
};

export const ViewCourses: React.FC<Props> = ({
  initialCourses,
  locale,
  currentPage,
  totalPages,
  tacticsOnly,
  initialTheme,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { apiDomain, themes } = useAppContext();

  const { theme, difficulty, search } = router.query;

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      difficulty,
      search,
      locale,
      page: currentPage,
      tacticsOnly,
      theme: theme || initialTheme,
    };

    return filteredQuery(queryObject);
  }, [
    difficulty,
    search,
    locale,
    currentPage,
    tacticsOnly,
    theme,
    initialTheme,
  ]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/courses?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, isValidating } = useSWR(queryKey, fetcher, {
    fallbackData: { items: initialCourses, totalPages },
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  const handleFilterChange = (filterType: string, value: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, [filterType]: value, page: 1 },
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <DebouncedInput
          placeholder="Search..."
          initialValue={search as string}
          onChange={(value) => {
            debugger;
            router.push(
              {
                pathname: '/',
                query: { ...router.query, page: 1, search: value },
              },
              undefined,
              { shallow: true }
            );
          }}
        />
        <div className="flex gap-4">
          <Select
            value={difficulty as string}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          >
            <option value="">{t('common.title.all-levels')}</option>
            {Object.entries(LEVEL_RATING).map(([rating, title]) => (
              <option key={rating} label={title}>
                {rating}
              </option>
            ))}
          </Select>
          {tacticsOnly && (
            <Select
              value={theme as string}
              onChange={(e) => handleFilterChange('theme', e.target.value)}
            >
              <option value="">{t('common.title.all-themes')}</option>
              {themes.map((theme) => (
                <option key={theme.code} label={theme.title[locale]}>
                  {theme.code}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      {isValidating ? (
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((course: Course) => (
            <Link key={course.title[locale]} href={`/lessons/${course.slug}`}>
              <Card className="h-full w-full flex flex-col items-start min-h-[230px]">
                <div className="flex flex-col flex-grow items-start">
                  <div className="grid grid-cols-[auto_100px] w-full">
                    <h5 className="text-lg font-semibold">
                      {course.title[locale]}
                    </h5>
                    <div className="flex justify-end">
                      <Badge color={getDifficultyColor(course.difficulty)}>
                        {course.difficulty || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mt-2">
                    {course.description?.[locale] || ''}
                  </p>
                </div>
                <div className="mt-2 w-full">
                  {course.lessons && (
                    <Progress
                      progress={(course.lessons.length / 10) * 100}
                      size="sm"
                    />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
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
    </div>
  );
};
