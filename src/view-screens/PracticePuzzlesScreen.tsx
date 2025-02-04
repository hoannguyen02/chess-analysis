import { PrimaryButton } from '@/components/PrimaryButton';
import { RatingOptions } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { DifficultyType } from '@/types';
import axiosInstance from '@/utils/axiosInstance';
import { Checkbox } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Select from 'react-select';

export const PracticePuzzlesScreen = () => {
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [isLoadingNextPuzzle, setSolveIsLoadingNextPuzzle] = useState(false);
  const t = useTranslations();
  const { session, themes: themeOptions, apiDomain } = useAppContext();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [includeSolved, setIncludeSolved] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

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
    try {
      setSolveIsLoadingNextPuzzle(true);
      const payload = {
        difficulty,
        themes: selectedThemes,
        includeSolved,
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
        router.push(`/practice-puzzles/${nextPuzzleId}`);
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

  return (
    <div className="flex flex-col lg:p-6 bg-white lg:shadow-md lg:rounded-lg max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {t('common.title.practice-puzzles')}
      </h2>

      {/* Rating Filter */}
      <div className="flex flex-col mb-4">
        {t('common.title.rating')}
        <Select
          options={RatingOptions}
          value={RatingOptions.find((option) => option.value === difficulty)}
          onChange={(selectedOption) =>
            setDifficulty(selectedOption?.value as DifficultyType)
          }
          placeholder={t('common.title.select-rating')}
          isClearable
        />
      </div>

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
        {themeOptions.map((option) => (
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
                <span className="text-gray-800 text-sm font-medium">50%</span>
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
  );
};
