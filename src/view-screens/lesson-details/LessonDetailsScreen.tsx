import { SolvePuzzleDrawer } from '@/components/SolvePuzzleDrawer';
import { useAppContext } from '@/contexts/AppContext';
import useDialog from '@/hooks/useDialog';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { fetcher } from '@/utils/fetcher';
import { getDifficultyColor } from '@/utils/getDifficultyColor';
import { Badge, Button, Card, Progress } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { VscArrowLeft, VscPlay } from 'react-icons/vsc';
import useSWR from 'swr';
import { CongratsBanner } from './CongratsBanner';
import { useLessonProgress } from './useLessonProgress';

type Props = {
  data: LessonExpanded;
};

type ContentPuzzleDialogData = {
  puzzle: Puzzle;
  contentIndex: number;
};
export const LessonDetailsScreen = ({ data }: Props) => {
  const { locale, session } = useAppContext();
  const router = useRouter();
  const { courseSlug, lessonSlug } = useMemo(() => {
    const { courseSlug, lessonSlug } = router.query;
    return {
      courseSlug,
      lessonSlug,
    };
  }, [router]);
  const {
    open: isOpenSolvePuzzle,
    data: contentPuzzle,
    onCloseDialog,
    onOpenDialog,
  } = useDialog<ContentPuzzleDialogData>();
  const t = useTranslations();
  const {
    title,
    description,
    objectives,
    contents,
    difficulty,
    _id,
    version,
    totalPuzzles,
  } = data;

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
    contentPuzzleIds,
    totalPuzzles
  );

  const { completedProgress, isCompleted } = useMemo(() => {
    const progressInPercent =
      (progress.completedPuzzles?.length / totalPuzzles) * 100;
    return {
      isCompleted: progressInPercent === 100,
      completedProgress: progressInPercent,
    };
  }, [progress.completedPuzzles, totalPuzzles]);

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

  useEffect(() => {
    if (contents?.length === 1) {
      setExpandedContentIndex(0);
    } else if (expandedContentIndex !== null) {
      handleScrollToPanel(expandedContentIndex);
    }
  }, [contents, expandedContentIndex]);

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
    if (progress.completedPuzzles?.length === 0 || isCompleted) {
      // Expand the first content
      setExpandedContentIndex(0);
    } else {
      if (progress.completedPuzzles?.length < data.totalPuzzles) {
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

  const hasNextPuzzle = () => {
    const allContents = data.contents || [];

    if (!contentPuzzle) return false;

    const { contentIndex } = contentPuzzle;
    if (contentIndex === undefined) return false;

    const currentContent = allContents[contentIndex];

    // Check if there are any unsolved puzzles in this content section
    return currentContent.contentPuzzles.some(
      (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
    );
  };

  const handleNextPuzzle = () => {
    const allContents = data.contents || [];

    const { contentIndex } = contentPuzzle as ContentPuzzleDialogData;

    const currentContent = allContents[contentIndex];

    // Find the next unsolved puzzle within the same content section
    const unsolvedPuzzle = currentContent.contentPuzzles.find(
      (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
    );
    if (unsolvedPuzzle) {
      onOpenDialog({ puzzle: unsolvedPuzzle.puzzleId, contentIndex });
    } else {
      onCloseDialog();
    }
  };

  // Generate dynamic SEO title and description
  const lessonTitle = title?.[locale] || 'LIMA Chess Lesson';
  const lessonDescription =
    description?.[locale] ||
    'Học cờ vua một cách thông minh với LIMA Chess, các bài học từng bước giúp bạn nắm vững chiến lược, chiến thuật cờ vua một cách dễ dàng.';

  const pageUrl = `https://limachess.com/lessons/${courseSlug}/${lessonSlug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalCourse',
    name: lessonTitle,
    description: lessonDescription,
    educationalLevel: difficulty,
    provider: {
      '@type': 'Organization',
      name: 'LIMA Chess',
      url: 'https://limachess.com',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `${totalPuzzles} puzzles`,
    },
  };

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{lessonTitle} | LIMA Chess</title>
        <meta name="description" content={lessonDescription} />
        <meta property="og:title" content={lessonTitle} />
        <meta property="og:description" content={lessonDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={lessonTitle} />
        <meta name="twitter:description" content={lessonDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-2">
          <Button
            outline
            onClick={() => {
              router.back();
            }}
          >
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
        <Progress progress={completedProgress} size="lg" className="mb-4" />
        {isCompleted ? (
          isLoadingNextLesson || !session?.id ? null : (
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
                  buttonTitle={t('common.button.review-course')}
                  onClick={() => {
                    router.push(`/lessons/${courseSlug}`);
                  }}
                />
              )}
            </div>
          )
        ) : (
          <>
            {/* Don't display button if 1 content because we already expanded it */}
            {contents && contents?.length > 1 && (
              <Button
                className="mb-6 w-full text-lg py-2 rounded-md shadow-md hover:shadow-lg transition hover:bg-blue-700"
                color="blue"
                onClick={handleContinueOrStart}
              >
                <VscPlay size={18} />{' '}
                {completedProgress > 0
                  ? t('common.title.continue-learning')
                  : t('common.title.start')}
              </Button>
            )}
          </>
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
                                  onOpenDialog({ puzzle, contentIndex: idx });
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

        {isOpenSolvePuzzle && contentPuzzle?.puzzle && (
          <SolvePuzzleDrawer
            puzzle={contentPuzzle.puzzle}
            onClose={onCloseDialog}
            onSolved={async () => {
              await saveProgress(contentPuzzle.puzzle._id!);
              const totalCompletedPuzzles =
                progress.completedPuzzles?.length + 1;
              if (totalCompletedPuzzles === data.totalPuzzles) {
                // Scroll to the top of the page
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }
            }}
            showNextButton={hasNextPuzzle()}
            onNextClick={handleNextPuzzle}
          />
        )}
      </div>
    </>
  );
};
