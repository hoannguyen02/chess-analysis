import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import { LessonExpanded } from '@/types/lesson';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import axios from 'axios';
import { Accordion, Badge, Button, Card } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';

type Props = {
  data: LessonExpanded;
};
const LessonDetailsPage = ({ data }: Props) => {
  const { locale } = useAppContext();

  if (!data) return null;

  const {
    title,
    description,
    objectives,
    contents,
    puzzles,
    difficulty,
    isPublic,
  } = data;

  const difficultyColor = getDifficultyColor(difficulty);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {title[locale]}
          </h1>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Badge color={difficultyColor}>{difficulty}</Badge>
          </div>
        </div>

        {/* Description */}
        {description?.en && (
          <p className="text-gray-600 mb-4">{description.en}</p>
        )}

        {/* Objectives */}
        {objectives?.en && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Objectives</h2>
            <ul className="list-disc list-inside space-y-1">
              {objectives.en.map((objective, idx) => (
                <li key={idx}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Contents */}
        {contents && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Lesson Contents</h2>
            <Accordion>
              {contents.map((content, idx) => (
                <Accordion.Panel key={idx}>
                  <Accordion.Title>{content.title.en}</Accordion.Title>
                  <Accordion.Content>
                    {content.explanations?.en?.map((explanation, i) => (
                      <p key={i} className="text-gray-600 mb-2">
                        {explanation}
                      </p>
                    ))}

                    {/* Content Puzzles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {content.contentPuzzles.map(({ puzzleId: puzzle }, i) => (
                        <Card key={i} className="hover:shadow-lg transition">
                          <p className="text-center">
                            Puzzle {puzzle?.title?.[locale]}
                          </p>
                          <Button color="blue" size="sm" fullSized>
                            Solve Now
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              ))}
            </Accordion>
          </div>
        )}

        {/* Puzzle Section */}
        {puzzles && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Practice Puzzles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {puzzles.map(({ puzzleId: puzzle }, idx) => (
                <Card key={idx} className="hover:shadow-lg transition">
                  <p className="text-center">
                    Puzzle {puzzle?.title?.[locale]}
                  </p>
                  <Button color="green" size="sm" fullSized>
                    Start Puzzle
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call-to-Action */}
        <div className="text-center">
          {isPublic ? (
            <Button color="purple" size="lg">
              Start Lesson
            </Button>
          ) : (
            <Button color="yellow" size="lg">
              Unlock Lesson
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale, params }: GetServerSidePropsContext, { apiDomain }) => {
    try {
      const slug = params?.lessonSlug;

      const res = await axios.get(`${apiDomain}/v1/lessons/slug/${slug}`);

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
