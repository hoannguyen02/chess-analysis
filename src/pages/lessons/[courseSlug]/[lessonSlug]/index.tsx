import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { CourseExpanded } from '@/types/course';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import axios from 'axios';
import { Accordion, Badge } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';

type Props = {
  data: CourseExpanded;
};
const LessonDetailsPage = ({ data }: Props) => {
  const { locale } = useAppContext();

  if (!data) return null;

  const {
    title,
    difficulty,
    status,
    // progress,
    description,
    objectives,
    lessons,
  } = data;

  const difficultyColor = getDifficultyColor(difficulty);
  const statusColor = status === 'Active' ? 'green' : 'red';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{title[locale]}</h1>
          <div className="space-x-2">
            <Badge color={difficultyColor}>{difficulty}</Badge>
            <Badge color={statusColor}>{status}</Badge>
          </div>
        </div>
        {/* <Progress progress={progress} size="lg" />
        <Button className="mt-4 w-full" color="blue">
          {progress === 0 ? 'Start Course' : 'Continue Learning'}
        </Button> */}

        {/* Description Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Course Overview</h2>
          <p className="mt-2 text-gray-600">{description?.[locale]}</p>
        </div>

        {/* Objectives Section */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold">Objectives</h3>
          <ul className="list-disc list-inside text-gray-600 mt-2">
            {objectives?.[locale]?.map((obj, index) => (
              <li key={index}>{obj}</li>
            ))}
          </ul>
        </div>

        {/* Lessons Section */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold">Lessons</h3>
          <Accordion>
            {lessons.map(({ lessonId: lesson }) => (
              <Accordion.Panel key={lesson.id}>
                <Accordion.Title>
                  {lesson.title[locale]}
                  {/* {lesson.isCompleted && (
                    <Badge color="green" className="ml-2">
                      Completed
                    </Badge>
                  )} */}
                  {/* {lesson.isLocked && (
                    <Badge color="gray" className="ml-2">
                      Locked
                    </Badge>
                  )} */}
                </Accordion.Title>
                {/* {!lesson.isLocked && (
                  <Accordion.Content>
                    <Button
                      color="blue"
                      onClick={() => setActiveLesson(lesson.id)}
                      disabled={lesson.isCompleted}
                    >
                      {lesson.isCompleted ? 'Completed' : 'Start Lesson'}
                    </Button>
                  </Accordion.Content>
                )} */}
              </Accordion.Panel>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale, params }: GetServerSidePropsContext, { apiDomain }) => {
    try {
      const slug = params?.lessonSlug;

      const res = await axios.get(`${apiDomain}/v1/lesson/slug/${slug}`);

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
