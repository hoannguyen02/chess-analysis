import { useAppContext } from '@/contexts/AppContext';
import { LessonProgress } from '@/types';
import { CourseExpanded } from '@/types/course';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Button, Progress } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { useCourseProgress } from './useCourseProgress';

type Props = {
  data: CourseExpanded;
  lessonProgresses: LessonProgress[];
};
export const CourseDetails = ({ data, lessonProgresses }: Props) => {
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

  const LessonProgressMap: Record<string, LessonProgress> = useMemo(() => {
    if (lessonProgresses?.length) {
      return lessonProgresses.reduce((acc, progress) => {
        return {
          ...acc,
          [progress.lessonId!]: progress,
        };
      }, {});
    }

    return {};
  }, [lessonProgresses]);

  const handleOnContinueOrStart = useCallback(() => {
    if (completedProgress > 0) {
      const unCompletedLessons = lessons?.filter(
        ({ lessonId: lesson }) => !LessonProgressMap[lesson._id!]
      );
      router.push(
        `/lessons/${params.courseSlug}/${unCompletedLessons[0].lessonId.slug}`
      );
    } else {
      router.push(`/lessons/${params.courseSlug}/${lessons[0].lessonId.slug}`);
    }
  }, [
    LessonProgressMap,
    completedProgress,
    lessons,
    params.courseSlug,
    router,
  ]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {title[locale]}
        </h1>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <Badge color={difficultyColor}>{difficulty}</Badge>
        </div>
      </div>
      <Progress progress={completedProgress} size="lg" />
      {!isCompleted && (
        <Button
          className="mt-4 w-full"
          color="blue"
          onClick={handleOnContinueOrStart}
        >
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

      {/* Objectives Section */}
      <div className="mt-6">
        <h3 className="text-lg sm:text-xl font-semibold">
          {t('common.title.objectives')}
        </h3>
        <ul className="list-disc list-inside text-gray-600 mt-2 text-sm sm:text-base">
          {objectives?.[locale]?.map((obj, index) => (
            <li key={index}>{obj}</li>
          ))}
        </ul>
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
              LessonProgressMap?.[lesson._id!]?.completedPuzzlesCount;

            // Determine lesson progress state
            let buttonTitle = t('common.title.start');
            let buttonColor = 'blue';
            if (completedPuzzlesCount === totalPuzzles) {
              // No puzzles or all puzzles completed
              buttonTitle = t('common.button.completed');
              buttonColor = 'green';
            } else if (completedPuzzlesCount > 0) {
              // Started but not completed
              buttonTitle = t('common.button.continue');
            }

            return (
              <div
                key={lesson.id}
                className="p-3 sm:p-4 bg-gray-100 rounded-lg shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center"
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
                  className="mt-3 sm:mt-0 w-full sm:w-auto"
                  onClick={() => {
                    router.push(`/lessons/${params.courseSlug}/${lesson.slug}`);
                  }}
                >
                  {buttonTitle}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
