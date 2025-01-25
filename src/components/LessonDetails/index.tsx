import { SolvePuzzleDrawer } from '@/components/SolvePuzzleDrawer';
import { useAppContext } from '@/contexts/AppContext';
import useDialog from '@/hooks/useDialog';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Accordion, Badge, Button, Card, Progress } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { CongratsBanner } from './CongratsBanner';
import { useLessonProgress } from './useLessonProgress';
import { VersionNotificationBanner } from './VersionNotificationBanner';

type Props = {
  data: LessonExpanded;
  nextLessonSlug?: string;
};

export const LessonDetails = ({ data, nextLessonSlug }: Props) => {
  const { locale } = useAppContext();
  const router = useRouter();
  const courseSlug = useMemo(() => router.query.courseSlug, [router]);
  const {
    open: isOpenSolvePuzzle,
    data: puzzle,
    onCloseDialog,
    onOpenDialog,
  } = useDialog<Puzzle>();
  const t = useTranslations();
  const { title, description, objectives, contents, difficulty, _id } = data;
  const { progress, saveProgress } = useLessonProgress(_id!);
  const [showBanner, setShowBanner] = useState(false);
  const [expandedContentIndex, setExpandedContentIndex] = useState<
    number | undefined
  >(undefined);

  const completedProgress = useMemo(
    () => (progress.completedPuzzlesCount / data.totalPuzzles) * 100,
    [data, progress]
  );

  useEffect(() => {
    // Check if the lesson version has changed and notify the user
    if (progress.completedAtVersion < data.version) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [progress.completedAtVersion, data.version]);

  const difficultyColor = getDifficultyColor(difficulty);

  const handleContinueOrStart = () => {
    // Start or review is expanded first content
    if (progress.completedPuzzlesCount === 0 || completedProgress === 100) {
      // Expand the first content
      setExpandedContentIndex(0);
    } else if (progress.completedPuzzlesCount < data.totalPuzzles) {
      // Find the first uncompleted content
      const index = data.contents?.findIndex((content) => {
        return content.contentPuzzles.some(
          (puzzle) => !progress.completedPuzzles.includes(puzzle.puzzleId._id!)
        );
      });
      if (index !== -1) setExpandedContentIndex(index);
    }
  };

  const handleNextLesson = () => {
    router.push(`/lessons/${courseSlug}/${nextLessonSlug}`);
  };

  return (
    <>
      <div className="container mx-auto p-4">
        {showBanner && (
          <VersionNotificationBanner
            currentVersion={data.version}
            completedAtVersion={progress.completedAtVersion}
            onDismiss={() => setShowBanner(false)}
          />
        )}
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:mb-0">
            {title[locale]}
          </h1>
          <Badge color={difficultyColor} className="text-lg px-3 py-1">
            {difficulty}
          </Badge>
        </div>
        <Progress progress={completedProgress} size="lg" className="mb-4" />
        {completedProgress === 100 ? (
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              className="w-full sm:w-auto"
              color="blue"
              onClick={handleContinueOrStart}
            >
              {t('common.button.review-lesson')}
            </Button>
            {nextLessonSlug ? (
              <Button
                className="w-full sm:w-auto"
                color="green"
                onClick={handleNextLesson}
              >
                {t('common.button.next-lesson')}
              </Button>
            ) : (
              <CongratsBanner
                onClick={() => {
                  router.push(`/lessons/${courseSlug}`);
                }}
              />
            )}
          </div>
        ) : (
          <Button
            className="mb-6 w-full text-lg py-3"
            color="blue"
            onClick={handleContinueOrStart}
          >
            {completedProgress > 0
              ? t('common.title.continue-learning')
              : t('common.title.start')}
          </Button>
        )}

        {/* Description */}
        {description?.[locale] && (
          <p className="text-gray-600 mb-6 text-lg">{description[locale]}</p>
        )}

        {/* Objectives */}
        {objectives?.[locale] && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              {t('common.title.objectives')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
              {objectives[locale].map((objective, idx) => (
                <li key={idx}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Contents */}
        {contents && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              {t('common.title.lesson-contents')}
            </h2>
            <Accordion>
              {contents.map((content, idx) => (
                <Accordion.Panel
                  key={idx}
                  isOpen={expandedContentIndex === idx}
                >
                  <Accordion.Title className="text-lg font-medium focus:outline-none focus:ring-0">
                    <span className="flex items-center">
                      {content.title[locale]}
                    </span>
                  </Accordion.Title>
                  <Accordion.Content>
                    <ul className="list-inside list-decimal space-y-2 text-lg">
                      {content.explanations?.[locale]?.map((explanation, i) => (
                        <li key={i} className="text-gray-600">
                          {explanation}
                        </li>
                      ))}
                    </ul>

                    {/* Content Puzzles */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
                      {content.contentPuzzles.map(
                        ({ puzzleId: puzzle }, index) => {
                          const isCompleted =
                            progress.completedPuzzles.includes(puzzle._id!);
                          return (
                            <Card
                              key={index}
                              className="hover:shadow-lg transition"
                            >
                              <p className="text-center text-lg font-semibold">
                                {t('common.title.example')} {index + 1}
                              </p>
                              <Button
                                color={isCompleted ? 'green' : 'blue'}
                                size="sm"
                                fullSized
                                onClick={() => {
                                  onOpenDialog(puzzle);
                                }}
                              >
                                {isCompleted
                                  ? t('common.button.solved')
                                  : t('common.button.view')}
                              </Button>
                            </Card>
                          );
                        }
                      )}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              ))}
            </Accordion>
          </div>
        )}

        {isOpenSolvePuzzle && puzzle && (
          <SolvePuzzleDrawer
            puzzle={puzzle}
            onClose={onCloseDialog}
            onSolved={async () => {
              await saveProgress(puzzle._id!);
            }}
          />
        )}
      </div>
    </>
  );
};
