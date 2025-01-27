import { SolvePuzzleDrawer } from '@/components/SolvePuzzleDrawer';
import { useAppContext } from '@/contexts/AppContext';
import useDialog from '@/hooks/useDialog';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Button, Card, Progress } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { CongratsBanner } from './CongratsBanner';
import { useLessonProgress } from './useLessonProgress';

type Props = {
  data: LessonExpanded;
};

export const LessonDetails = ({ data }: Props) => {
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
  const { title, description, objectives, contents, difficulty, _id, version } =
    data;

  const contentPuzzleIds = useMemo(
    () =>
      contents?.flatMap((c) => {
        return (
          c.contentPuzzles?.map(({ puzzleId: puzzle }) => puzzle._id!) || []
        );
      }),
    [contents]
  );

  const { progress, saveProgress } = useLessonProgress(
    _id!,
    version,
    contentPuzzleIds
  );

  const { completedProgress, isCompleted } = useMemo(() => {
    const progressInPercent =
      (progress.completedPuzzlesCount / data.totalPuzzles) * 100;
    return {
      isCompleted: progressInPercent === 100,
      completedProgress: progressInPercent,
    };
  }, [data, progress]);

  const [expandedContentIndex, setExpandedContentIndex] = useState<
    number | null
  >(null);
  // Create refs for each panel
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScrollToPanel = (index: number) => {
    const panel = panelRefs.current[index];
    if (panel) {
      // Delay scroll to ensure the layout is fully updated
      setTimeout(() => {
        const panelRect = panel.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const offset = 45;

        if (panelRect.top < 0 || panelRect.bottom > viewportHeight) {
          const scrollPosition = window.scrollY + panelRect.top - offset;

          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });
        }
      }, 300); // Adjust delay based on your animation duration
    }
  };

  // Scroll to the default index on initial render
  useEffect(() => {
    if (expandedContentIndex !== null) {
      handleScrollToPanel(expandedContentIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedContentIndex]);

  const togglePanel = (index: number) => {
    setExpandedContentIndex((prevIndex) =>
      prevIndex === index ? null : index
    );
  };

  const key = useMemo(
    () =>
      isCompleted ? `/v1/courses/public/next-lesson/${courseSlug}` : undefined,
    [courseSlug, isCompleted]
  );

  const { data: nextLessonSlug, isLoading: isLoadingNextLesson } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const difficultyColor = getDifficultyColor(difficulty);

  const handleContinueOrStart = () => {
    // Start or review is expanded first content
    if (progress.completedPuzzlesCount === 0 || isCompleted) {
      // Expand the first content
      setExpandedContentIndex(0);
    } else {
      if (progress.completedPuzzlesCount < data.totalPuzzles) {
        // Find the first uncompleted content
        const index = data.contents?.findIndex((content) => {
          return content.contentPuzzles.some(
            (puzzle) =>
              !progress.completedPuzzles.includes(puzzle.puzzleId._id!)
          );
        });
        if (index !== -1) setExpandedContentIndex(index as number);
      }
    }
  };

  const handleNextLesson = () => {
    router.push(`/lessons/${courseSlug}/${nextLessonSlug}`);
  };

  return (
    <>
      <div className="container mx-auto p-4">
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
        {isCompleted ? (
          isLoadingNextLesson ? null : (
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {nextLessonSlug ? (
                <CongratsBanner
                  title={t('common.title.congrats-course')}
                  buttonTitle={t('common.button.next-lesson')}
                  onClick={handleNextLesson}
                />
              ) : (
                <CongratsBanner
                  title={t('common.title.congrats-course')}
                  buttonTitle={t('common.title.review-course')}
                  onClick={() => {
                    router.push(`/lessons/${courseSlug}`);
                  }}
                />
              )}
            </div>
          )
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
            {contents.map((content, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  panelRefs.current[idx] = el;
                }}
                className="border rounded-lg shadow-sm mb-4"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => togglePanel(idx)}
                  className="cursor-pointer flex justify-between items-center p-4 bg-blue-100 hover:bg-blue-200 transition duration-200 rounded-t-lg"
                >
                  <h3 className="font-semibold text-xl text-gray-800">
                    {content.title[locale]}
                  </h3>
                  <span
                    className={`transform transition-transform duration-300 ${
                      expandedContentIndex === idx
                        ? 'rotate-180 text-blue-600'
                        : 'rotate-0 text-gray-500'
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {/* Accordion Content */}
                <div
                  className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
                    expandedContentIndex === idx ? 'max-h-screen' : 'max-h-0'
                  }`}
                >
                  <div className="p-4 bg-white rounded-b-lg">
                    {/* Explanations */}
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
                              className="hover:shadow-lg transition border"
                            >
                              <p className="text-center text-lg font-semibold text-gray-700">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOpenSolvePuzzle && puzzle && (
          <SolvePuzzleDrawer
            puzzle={puzzle}
            onClose={onCloseDialog}
            onSolved={async () => {
              await saveProgress(puzzle._id!);
              const totalCompletedPuzzles = progress.completedPuzzlesCount + 1;
              if (totalCompletedPuzzles === data.totalPuzzles) {
                // Scroll to the top of the page
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }
            }}
          />
        )}
      </div>
    </>
  );
};
