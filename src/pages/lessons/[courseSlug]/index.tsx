import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { CourseExpanded } from '@/types/course';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import axios from 'axios';
import { Badge, Button, Progress } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';

type Props = {
  data: CourseExpanded;
};

const LessonDetailsPage = ({ data }: Props) => {
  const { locale } = useAppContext();
  const t = useTranslations();

  if (!data) return null;

  const { title, difficulty, description, objectives, lessons } = data;

  const difficultyColor = getDifficultyColor(difficulty);

  const progress = 1;
  const isCompleted = false;

  return (
    <Layout>
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
        <Progress progress={progress} size="lg" />
        <Button className="mt-4 w-full" color="blue">
          {progress > 0
            ? t('common.title.continue-learning')
            : t('common.title.start-course')}
        </Button>

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
          <h3 className="text-lg sm:text-xl font-semibold">
            {t('common.title.lessons')}
          </h3>
          <div className="grid gap-3 sm:gap-4">
            {lessons.map(({ lessonId: lesson }) => {
              const completedPuzzles = lesson.puzzles.filter(
                (p) => isCompleted
              ).length;
              const lessonProgress = Math.round(
                (completedPuzzles / lesson.puzzles.length) * 100
              );

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
                      {completedPuzzles} / {lesson.puzzles.length}{' '}
                      {t('common.title.puzzles')}
                    </p>
                    <Progress
                      progress={lessonProgress}
                      size="sm"
                      className="mt-2"
                    />
                  </div>
                  <Button
                    color={
                      completedPuzzles === lesson.puzzles.length
                        ? 'green'
                        : 'blue'
                    }
                    disabled={completedPuzzles === lesson.puzzles.length}
                    className="mt-3 sm:mt-0 w-full sm:w-auto"
                  >
                    {completedPuzzles === lesson.puzzles.length
                      ? t('common.button.completed')
                      : t('common.button.continue')}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale, params }: GetServerSidePropsContext, { apiDomain }) => {
    try {
      const slug = params?.courseSlug;
      const res = await axios.get(`${apiDomain}/v1/courses/slug/${slug}`);

      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;
      return {
        props: {
          messages: {
            common: commonMessages,
          },
          data: res.data,
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default LessonDetailsPage;
