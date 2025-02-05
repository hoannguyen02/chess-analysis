import { TransitionContainer } from '@/components/TransitionContainer';
import { SolveStatues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { SolveStatusType } from '@/types';
import { PuzzleHistory } from '@/types/puzzle-history';
import { fetcher } from '@/utils/fetcher';
import { filteredQuery } from '@/utils/filteredQuery';
import { Label, Pagination } from 'flowbite-react';
import { isEmpty } from 'lodash';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { VscCheck, VscChromeClose } from 'react-icons/vsc';
import Select from 'react-select';
import useSWR from 'swr';

export const PracticePuzzleHistories = () => {
  const t = useTranslations();
  const { session, apiDomain, themes: themeOptions } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<SolveStatusType | ''>('');
  const [themes, setThemes] = useState<string[]>([]);

  const SolveStatusOptions = SolveStatues.map((status) => ({
    value: status as SolveStatusType,
    label: t(`common.title.${status}`),
  }));

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      status,
      page: currentPage,
      themes: themes.join(','),
    };

    return filteredQuery(queryObject);
  }, [status, currentPage, themes]);
  const puzzleHistoryKey = session
    ? `${apiDomain}/v1/practice-puzzle/history/${session.id}?${queryString}`
    : undefined;

  const { data: puzzleHistory, isLoading: isLoadingPuzzleHistories } = useSWR(
    puzzleHistoryKey,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 500,
    }
  );

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-8">
        <div className="flex flex-col">
          {t('home.outcome')}
          <Select
            options={SolveStatusOptions}
            value={SolveStatusOptions.find((option) => option.value === status)}
            onChange={(selectedOption) =>
              setStatus(selectedOption?.value as SolveStatusType)
            }
            placeholder={t('home.select-outcome')}
            isClearable
          />
        </div>

        <div className="flex flex-col">
          {t('home.themes')}
          <Select
            isMulti
            options={themeOptions}
            value={themeOptions.filter((option) =>
              themes.includes(option.value)
            )}
            onChange={(selectedOptions) =>
              setThemes(selectedOptions.map((option) => option.value))
            }
            placeholder={t('home.select-themes')}
          />
        </div>
      </div>

      <TransitionContainer
        isLoading={isLoadingPuzzleHistories}
        isVisible={!isEmpty(puzzleHistory)}
      >
        <div className="grid grid-cols-3 mb-4 gap-2">
          <Label className="font-bold">{t('home.attempted-at')}</Label>
          <Label className="font-bold">{t('home.time-taken')}</Label>
          <Label className="font-bold">{t('home.outcome')}</Label>
        </div>
        {puzzleHistory?.items.map((item: PuzzleHistory, index: number) => (
          <div
            className="grid grid-cols-3 items-center gap-2"
            key={`${item.puzzle}-${index}`}
          >
            <Link
              href={`/settings/users/${item.puzzle}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
            >
              {DateTime.fromISO(item.attemptedAt).toISODate()}
            </Link>
            <Label>
              {DateTime.fromSeconds(item.timeTaken).toFormat('mm:ss')}
            </Label>
            <Label className="flex items-center">
              {item.status === 'solved' ? (
                <VscCheck className="mr-2" color="green" />
              ) : (
                <VscChromeClose className="mr-2" color="red" />
              )}
            </Label>
          </div>
        ))}
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={puzzleHistory?.currentPage}
            totalPages={puzzleHistory?.lastPage}
            onPageChange={onPageChange}
            previousLabel={t('common.button.previous')}
            nextLabel={t('common.button.next')}
          />
        </div>
      </TransitionContainer>
    </>
  );
};
