import { ErrorBanner } from '@/components/ErrorBanner';
import Layout from '@/components/Layout';
import { SolvePuzzleDrawer } from '@/components/SolvePuzzleDrawer';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import useDialog from '@/hooks/useDialog';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { createServerAxios } from '@/utils/axiosInstance';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Accordion, Badge, Button, Card } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';

type Props = {
  data: LessonExpanded;
  error: string | null;
  errorCode: number;
};
const LessonDetailsPage = ({ data, error, errorCode }: Props) => {
  const { locale } = useAppContext();
  const {
    open: isOpenSolvePuzzle,
    data: puzzle,
    onCloseDialog,
    onOpenDialog,
  } = useDialog<Puzzle>();
  const t = useTranslations();

  if (error) return <ErrorBanner error={error} errorCode={errorCode} />;

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
            <h2 className="text-xl font-semibold mb-2">
              {t('common.title.objectives')}
            </h2>
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
            <h2 className="text-xl font-semibold mb-2">
              {t('common.title.lesson-contents')}
            </h2>
            <Accordion>
              {contents.map((content, idx) => (
                <Accordion.Panel key={idx}>
                  <Accordion.Title className="focus:outline-none focus:ring-0">
                    {content.title.en}
                  </Accordion.Title>
                  <Accordion.Content>
                    <ul className="list-inside list-decimal space-y-1">
                      {content.explanations?.[locale]?.map((explanation, i) => (
                        <li key={i} className="text-gray-600 mb-2">
                          {explanation}
                        </li>
                      ))}
                    </ul>

                    {/* Content Puzzles */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                      {content.contentPuzzles.map(
                        ({ puzzleId: puzzle }, index) => (
                          <Card
                            key={index}
                            className="hover:shadow-lg transition"
                          >
                            <p className="text-center">
                              {t('common.title.example')} {index + 1}
                            </p>
                            <Button
                              color="blue"
                              size="sm"
                              fullSized
                              onClick={() => {
                                onOpenDialog(puzzle);
                              }}
                            >
                              {t('common.button.view')}
                            </Button>
                          </Card>
                        )
                      )}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              ))}
            </Accordion>
          </div>
        )}

        {/* Puzzle Section */}
        {puzzles.length > 0 && (
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
      {isOpenSolvePuzzle && puzzle && (
        <SolvePuzzleDrawer puzzle={puzzle} onClose={onCloseDialog} />
      )}
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale, params } = ctx;

    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;
        const solvePuzzleMessages = (
          await import(`@/locales/${locale}/solve-puzzle.json`)
        ).default;

        return {
          common: commonMessages,
          'solve-puzzle': solvePuzzleMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || 'en');
    const slug = params?.lessonSlug;

    try {
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`/v1/lessons/public/slug/${slug}`);

      return {
        props: {
          messages,
          data: response.data,
          error: null,
        },
      };
    } catch (error: any) {
      return {
        props: {
          messages,
          error: error.message || error,
          errorCode: error.response?.status,
          data: null,
        },
      };
    }
  }
);

export default LessonDetailsPage;
