import { useAppContext } from '@/contexts/AppContext';
import { LessonProgress } from '@/types';
import { CourseExpanded } from '@/types/course';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Button, Progress } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VscArrowLeft, VscCheck, VscPlay } from 'react-icons/vsc';
import { useCourseProgress } from './useCourseProgress';

type Props = {
  data: CourseExpanded;
  lessonProgresses: LessonProgress[];
};

export const CourseDetailsScreen = ({ data, lessonProgresses }: Props) => {
  const { locale } = useAppContext();
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();

  const {
    title,
    difficulty,
    description,
    objectives,
    lessons,
    _id,
    version,
    totalLessons,
  } = data;
  const lessonIds = useMemo(
    () => lessons?.map(({ lessonId: lesson }) => lesson._id!),
    [lessons]
  );

  const { progress } = useCourseProgress(_id!, version, lessonIds);
  const difficultyColor = getDifficultyColor(difficulty);

  const { completedProgress, isCompleted } = useMemo(() => {
    const progressInPercent =
      (progress.completedLessons.length / totalLessons) * 100;
    return {
      isCompleted: progressInPercent === 100,
      completedProgress: progressInPercent,
    };
  }, [progress.completedLessons.length, totalLessons]);

  const [lessonProgressMap, setLessonProgressMap] = useState<
    Record<string, LessonProgress>
  >(() =>
    lessonProgresses?.length
      ? lessonProgresses.reduce((acc, progress) => {
          return { ...acc, [progress.lessonId!]: progress };
        }, {})
      : {}
  );

  useEffect(() => {
    if (!lessonProgresses?.length && typeof window !== 'undefined') {
      const lessonEntries: LessonProgress[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lesson_')) {
          const storedValue = localStorage.getItem(key);
          try {
            if (storedValue) {
              lessonEntries.push(JSON.parse(storedValue) as LessonProgress);
            }
          } catch (error) {
            console.error(`Error parsing JSON for key: ${key}`, error);
          }
        }
      }
      setLessonProgressMap(
        lessonEntries.reduce((acc, progress) => {
          return { ...acc, [progress.lessonId!]: progress };
        }, {})
      );
    }
  }, [lessonProgresses]);

  const handleOnContinueOrStart = useCallback(() => {
    if (completedProgress > 0) {
      const unCompletedLessons = lessons?.filter(
        ({ lessonId: lesson }) => !lessonProgressMap[lesson._id!]
      );
      router.push(
        `/lessons/${params.courseSlug}/${unCompletedLessons[0].lessonId.slug}`
      );
    } else {
      router.push(`/lessons/${params.courseSlug}/${lessons[0].lessonId.slug}`);
    }
  }, [
    lessonProgressMap,
    completedProgress,
    lessons,
    params.courseSlug,
    router,
  ]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-2">
        <Button outline onClick={() => router.back()}>
          <VscArrowLeft />
        </Button>
      </div>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:mb-0">
          {title[locale]}
        </h1>
        <Badge color={difficultyColor} className="text-lg px-3 py-1 w-max">
          {difficulty}
        </Badge>
      </div>
      <Progress progress={completedProgress} size="lg" className="mb-6" />
      {!isCompleted && (
        <Button
          className="mb-6 w-full text-lg py-2 rounded-md shadow-md hover:shadow-lg transition hover:bg-blue-700"
          color="blue"
          onClick={handleOnContinueOrStart}
        >
          <VscPlay size={18} />{' '}
          {completedProgress > 0
            ? t('common.title.continue-learning')
            : t('common.title.start')}
        </Button>
      )}
      {/* Description Section */}
      <div className="mt-6">
        <h2 className="text-xl sm:text-2xl font-semibold">
          {t('common.title.course-overview')}
        </h2>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">
          {description?.[locale]}
        </p>
      </div>
      {/* Lessons Section */}
      <div className="mt-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">
          {t('common.title.lessons')}
        </h3>
        <div className="grid gap-3 sm:gap-4">
          {lessons.map(({ lessonId: lesson }) => {
            const totalPuzzles = lesson.totalPuzzles;
            const completedPuzzlesCount =
              lessonProgressMap?.[lesson._id!]?.completedPuzzles?.length;
            let buttonTitle = t('common.title.start');
            let buttonColor = 'blue';
            let buttonIcon = <VscPlay size={18} />;
            if (completedPuzzlesCount === totalPuzzles) {
              buttonTitle = t('common.button.completed');
              buttonColor = 'green';
              buttonIcon = <VscCheck size={18} />;
            } else if (completedPuzzlesCount > 0) {
              buttonTitle = t('common.button.continue');
              buttonColor = 'yellow';
            }
            return (
              <div
                key={lesson.id}
                className="p-4 bg-gray-200 rounded-lg shadow-md flex justify-between"
              >
                <div>
                  <h4 className="text-base sm:text-lg font-semibold">
                    {lesson.title[locale]}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {totalPuzzles} {t('common.title.puzzles')}
                  </p>
                </div>
                <Button
                  color={buttonColor}
                  className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center gap-2 hover:shadow-lg transition"
                  onClick={() =>
                    router.push(`/lessons/${params.courseSlug}/${lesson.slug}`)
                  }
                >
                  {buttonIcon} {buttonTitle}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
