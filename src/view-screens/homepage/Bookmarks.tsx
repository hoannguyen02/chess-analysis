import { TransitionContainer } from '@/components/TransitionContainer';
import { LEVEL_RATING } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Puzzle } from '@/types/puzzle';
import { Button, Label, Pagination } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { useShowPuzzleDialog } from './useShowPuzzleDialog';

const SolvePuzzleDrawer = dynamic(() =>
  import('@/components/SolvePuzzleDrawer').then(
    (components) => components.SolvePuzzleDrawer
  )
);

export const Bookmarks = () => {
  const t = useTranslations();
  const { getFilteredThemes, isSubscriptionExpired, bookmarks, locale } =
    useAppContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [themes, setThemes] = useState<string[]>([]);
  const itemsPerPage = 10; // Number of bookmarks per page

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

  // **Paginate Bookmarks in Memory (No API Call)**
  const totalPages = Math.ceil(bookmarks.length / itemsPerPage);
  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return bookmarks.slice(startIndex, startIndex + itemsPerPage);
  }, [bookmarks, currentPage]);

  // Display bookmarks
  const [isLoading, setIsLoading] = useState(false);
  const [displayedBookmarks, setDisplayedBookmarks] =
    useState(paginatedBookmarks);
  const [isVisible, setIsVisible] = useState(false); // For fade-in transition
  useEffect(() => {
    setIsVisible(false);
    setIsLoading(true);

    setTimeout(() => {
      setDisplayedBookmarks(paginatedBookmarks);
      setIsLoading(false);
      setIsVisible(true);
    }, 300);
  }, [paginatedBookmarks]);
  // End Display bookmarks

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-8">
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

      <TransitionContainer isLoading={isLoading} isVisible={isVisible}>
        <div className="grid grid-cols-2 mb-4 gap-2">
          <Label className="font-bold">{t('home.title')}</Label>
          <Label className="font-bold">{t('common.title.difficulty')}</Label>
        </div>

        {displayedBookmarks.map((item: Puzzle, index: number) => (
          <div
            className="grid grid-cols-2 items-center gap-2 mt-2"
            key={`bookmark-${index}`}
          >
            <Button
              className="w-[70%]"
              size="sm"
              outline
              disabled={isSubscriptionExpired}
              isProcessing={loadingPuzzle?.[index] || false}
              onClick={() => handleOpenPuzzle(item._id!, index)}
            >
              {item.title?.[locale]}
            </Button>

            <Label> {LEVEL_RATING[item.difficulty]}</Label>
          </div>
        ))}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              previousLabel={t('common.button.previous')}
              nextLabel={t('common.button.next')}
            />
          </div>
        )}
      </TransitionContainer>

      {isOpenSolvePuzzle && puzzleDialogData && (
        <SolvePuzzleDrawer
          puzzle={puzzleDialogData.puzzle}
          onClose={onCloseDialog}
          onSolved={() => {}}
          showNextButton={hasNextPuzzle(displayedBookmarks)}
          onNextClick={() =>
            handleNextPuzzle(displayedBookmarks, puzzleDialogData.index)
          }
        />
      )}
    </>
  );
};
