import { PrimaryButton } from '@/components/PrimaryButton';
import { RegisterDialog } from '@/components/RegisterDialog';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useDialog from '@/hooks/useDialog';
import axiosInstance from '@/utils/axiosInstance';
import { fetcher } from '@/utils/fetcher';
import { Checkbox } from 'flowbite-react';
import isEqual from 'lodash/isEqual';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { VscArrowUp, VscClose } from 'react-icons/vsc';
import useSWR from 'swr';

type ThemeProgress = {
  theme: string;
  solvedPercentage: number;
};

export const PracticePuzzlesScreen = () => {
  const { open, onOpenDialog, onCloseDialog } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [, setSolveIsLoadingNextPuzzle] = useState(false);
  const t = useTranslations();
  const {
    session,
    getFilteredThemes,
    apiDomain,
    isLoggedIn,
    isSubscriptionExpired,
  } = useAppContext();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [includeSolved, setIncludeSolved] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const { addToast } = useToast();
  const router = useRouter();

  const { themeOptions, excludedThemeIds } = getFilteredThemes();

  const queryKey = useMemo(
    () =>
      session?.id
        ? `${apiDomain}/v1/practice-puzzle/history-progress/${session?.id}`
        : undefined,
    [apiDomain, session?.id]
  );

  const { data: themeProgresses } = useSWR(queryKey, fetcher, {
    dedupingInterval: 300,
  });

  const ThemeProgressesMap: Record<string, ThemeProgress> = useMemo(() => {
    if (themeProgresses) {
      return themeProgresses?.reduce(
        (acc: any, cur: ThemeProgress) => {
          return {
            ...acc,
            [cur.theme]: cur,
          };
        },
        {} as { [theme: string]: ThemeProgress }
      );
    }

    return {};
  }, [themeProgresses]);

  const allSelected = selectedThemes.length === themeOptions.length;

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const toggleSelectAll = () => {
    setSelectedThemes(
      allSelected ? [] : themeOptions.map((option) => option.value)
    );
  };

  const handlePractice = async () => {
    if (!isLoggedIn || isSubscriptionExpired) {
      onOpenDialog();
      return;
    }
    try {
      setSolveIsLoadingNextPuzzle(true);
      const payload = {
        themes: selectedThemes,
        includeSolved,
        excludedThemeIds,
      };
      const nextPuzzleResult = await axiosInstance.post(
        `${apiDomain}/v1/practice-puzzle/next`,
        {
          ...payload,
          userId: session?.id,
        }
      );
      const nextPuzzleId = nextPuzzleResult.data;
      if (nextPuzzleId) {
        sessionStorage.setItem(
          'practice-puzzle-payload',
          JSON.stringify(payload)
        );
        router.push(`/practice/${nextPuzzleId}`);
      } else {
        addToast(t('common.title.no-puzzles'), 'error');
      }
    } catch {
      console.error('Error fetching next puzzle');
      addToast(t('common.title.no-puzzles'), 'error');
    } finally {
      setSolveIsLoadingNextPuzzle(false);
    }
  };

  const filteredThemes = useMemo(() => {
    return themeOptions.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, themeOptions]);

  const sortedThemes = useMemo(() => {
    return filteredThemes.sort((a, b) => {
      const priorityA = a?.priority ?? 0;
      const priorityB = b?.priority ?? 0;

      return sortAsc ? priorityA - priorityB : priorityB - priorityA;
    });
  }, [sortAsc, filteredThemes]);

  // Display
  const [isLoading, setIsLoading] = useState(false);
  const [displayProgress, setDisplayedProgress] = useState(themeProgresses);
  const [isVisible, setIsVisible] = useState(false); // For fade-in transition
  useEffect(() => {
    if (
      !isEqual(themeProgresses, displayProgress) ||
      themeProgresses === undefined // guest user or error from BE
    ) {
      setIsVisible(false);
      setIsLoading(true);

      setTimeout(() => {
        setDisplayedProgress(themeProgresses);
        setIsLoading(false);
        setIsVisible(true);
      }, 300);
    }
  }, [displayProgress, themeProgresses]);
  // End Display

  return (
    <>
      <TransitionContainer isLoading={isLoading} isVisible={isVisible}>
        <div className="flex flex-col lg:p-6 bg-white lg:shadow-md lg:rounded-lg max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('common.title.practice-puzzles')}
          </h2>

          <div className="flex justify-between">
            {/* Select All / Unselect All Button */}
            <label className="flex items-center space-x-2 mb-3 cursor-pointer">
              <Checkbox checked={allSelected} onChange={toggleSelectAll} />
              <span className="text-gray-800 font-medium text-sm">
                {t('common.title.select-all')}
              </span>
            </label>
            <label className="flex items-center space-x-2 mb-3 cursor-pointer">
              <Checkbox
                checked={includeSolved}
                onChange={() => {
                  setIncludeSolved(!includeSolved);
                }}
              />
              <span className="text-gray-800 font-medium text-sm">
                {t('common.title.include-solved')}
              </span>
            </label>
          </div>

          {/* Search Input with Clear Icon */}
          <div className="flex items-center mb-3">
            <div className="relative w-[80%]">
              <input
                type="text"
                placeholder={t('common.title.search-theme')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 pr-10 border border-gray-300 rounded-lg w-full"
              />
              {searchTerm && (
                <VscClose
                  className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
            <div className="flex ml-4">
              <Checkbox
                checked={sortAsc}
                onChange={() => {
                  setSortAsc((prev) => !prev);
                }}
              />
              <VscArrowUp className="ml-2" />
            </div>
          </div>

          {/* Scrollable Theme List */}
          <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 shadow-inner">
            {/* Header Row */}
            <div className="grid grid-cols-[auto_100px] gap-2 px-2 py-2 border-b border-gray-300 font-semibold text-gray-700 text-sm">
              <span>{t('common.title.theme')}</span>
              <span className="text-center">
                {t('common.title.practice-progress')}
              </span>
            </div>

            {/* Theme Rows */}
            {sortedThemes.map((option) => (
              <div
                key={option.value}
                className="p-2 rounded-lg transition-all hover:bg-blue-100"
              >
                <label className="grid grid-cols-[auto_100px] gap-2  cursor-pointer items-center py-2 px-2 rounded-lg transition-all hover:bg-blue-100">
                  {/* Checkbox & Title (1 Column) */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      value={option.value}
                      checked={selectedThemes.includes(option.value)}
                      onChange={() => toggleTheme(option.value)}
                    />
                    <span className="text-gray-800 text-sm font-medium">
                      {option.label}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-800 text-sm font-medium">{`${ThemeProgressesMap[option.value]?.solvedPercentage || 0}%`}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Practice Button */}
          <PrimaryButton onClick={handlePractice} className="mt-4">
            {t('common.title.start-practice')}
          </PrimaryButton>
        </div>
      </TransitionContainer>
      {open && <RegisterDialog onClose={onCloseDialog} />}
    </>
  );
};
