import { Loading } from '@/components/Loading';
import { TransitionContainer } from '@/components/TransitionContainer';
import { SolveStatues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { SolveStatusType } from '@/types';
import { PuzzleHistory } from '@/types/puzzle-history';
import { fetcher } from '@/utils/fetcher';
import { filteredQuery } from '@/utils/filteredQuery';
import { Button, Label, Pagination } from 'flowbite-react';
import { isEmpty } from 'lodash';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { VscCheck, VscChromeClose } from 'react-icons/vsc';
import Select from 'react-select';
import useSWR from 'swr';
import { useShowPuzzleDialog } from './useShowPuzzleDialog';
const SolvePuzzleDrawer = dynamic(() =>
  import('@/components/SolvePuzzleDrawer').then(
    (components) => components.SolvePuzzleDrawer
  )
);

export const PracticePuzzleHistories = () => {
  const t = useTranslations();
  const { session, apiDomain, getFilteredThemes, isSubscriptionExpired } =
    useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<SolveStatusType | ''>('');
  const [themes, setThemes] = useState<string[]>([]);

  const { themeOptions } = getFilteredThemes();

  const {
    isOpenSolvePuzzle,
    puzzleDialogData,
    onCloseDialog,
    hasNextPuzzle,
    handleNextPuzzle,
    loadingPuzzle,
    handleOpenPuzzle,
  } = useShowPuzzleDialog();

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

  if (isLoadingPuzzleHistories) {
    return <Loading />;
  }

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
            className="grid grid-cols-3 items-center gap-2 mt-2"
            key={`${item.puzzle}-${index}`}
          >
            <Button
              className="w-[70%]"
              size="sm"
              outline
              disabled={isSubscriptionExpired}
              isProcessing={loadingPuzzle?.[index] || false}
              onClick={() => handleOpenPuzzle(item.puzzle, index)}
            >
              {DateTime.fromISO(item.attemptedAt).toISODate()}
            </Button>

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
      {isOpenSolvePuzzle && puzzleDialogData && (
        <SolvePuzzleDrawer
          puzzle={puzzleDialogData.puzzle}
          onClose={onCloseDialog}
          onSolved={() => {
            // Do  nothing for now
          }}
          showNextButton={hasNextPuzzle(puzzleHistory?.items)}
          onNextClick={() =>
            handleNextPuzzle(puzzleHistory?.items, puzzleDialogData.index)
          }
        />
      )}
    </>
  );
};
