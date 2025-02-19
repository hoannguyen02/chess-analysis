import DebouncedInput from '@/components/DebounceInput';
import { LEVEL_RATING } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Label } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';

const difficultyOptions = Object.entries(LEVEL_RATING).map(
  ([rating, title]) => ({
    value: rating,
    label: title,
  })
);

export const LessonFilters = () => {
  const router = useRouter();
  const { tags: initialTags } = useAppContext();
  const t = useTranslations();
  const { difficulty, search } = router.query;

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

  return (
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
        <Label className="font-semibold">{t('common.title.difficulty')}</Label>
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
  );
};
