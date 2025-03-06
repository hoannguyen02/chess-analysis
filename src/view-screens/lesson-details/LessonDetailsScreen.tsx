/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ShareFacebookButton } from '@/components/ShareFacebookButton';
import SolvePuzzle from '@/components/SolvePuzzle';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useDialog from '@/hooks/useDialog';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import axiosInstance from '@/utils/axiosInstance';
import { Button, Clipboard } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { MenuLesson } from './MenuLesson';
import { useLessonProgress } from './useLessonProgress';

const RegisterDialog = dynamic(() =>
  import('@/components/RegisterDialog').then(
    (components) => components.RegisterDialog
  )
);
const MenuLessonDrawer = dynamic(() =>
  import('../../components/MenuLessonDrawer').then(
    (components) => components.MenuLessonDrawer
  )
);

type Props = {
  data: LessonExpanded;
};

export const LessonDetailsScreen = ({ data }: Props) => {
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [resetting, setResetting] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();

  const {
    isMobile,
    isLoggedIn,
    getFilteredThemes,
    apiDomain,
    session,
    locale,
    isSubscriptionExpired,
  } = useAppContext();
  const { excludedThemeIds } = getFilteredThemes();
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);

  const [contentIndex, setContentIdx] = useState<number>();
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>();
  const [explanations, setExplanations] = useState<string[]>([]);

  const {
    title,
    contents,
    _id,
    version,
    totalPuzzles,
    difficulty,
    description,
    isPublic,
    themes,
  } = data;

  const allContents = useMemo(() => contents || [], [contents]);

  const contentPuzzleIds = useMemo(
    () =>
      contents?.flatMap((c) => {
        return (
          c.contentPuzzles?.map(({ puzzleId: puzzle }) => puzzle._id!) || []
        );
      }),
    [contents]
  );

  const { progress, saveProgress, completedPuzzleMap } = useLessonProgress(
    _id!,
    version,
    contentPuzzleIds,
    totalPuzzles
  );

  const hasRunOnce = useRef(false);
  useEffect(() => {
    if (allContents?.length) {
      if (hasRunOnce.current) return; // Prevent re-execution after first run
      hasRunOnce.current = true; // Mark as executed
      if (progress.completedPuzzles.length) {
        // Find the first uncompleted content
        const index = allContents?.findIndex((content) =>
          content.contentPuzzles.some(
            (puzzle) =>
              !progress.completedPuzzles.includes(puzzle.puzzleId._id!)
          )
        );

        if (index !== -1) {
          setContentIdx(index as number);
        } else {
          setContentIdx(0);
        }
      } else {
        setContentIdx(0);
      }
    }
  }, [allContents, progress.completedPuzzles]);

  useEffect(() => {
    if (contentIndex === undefined) return;
    const content = allContents[contentIndex];
    const unsolvedPuzzle = content.contentPuzzles.find((p) => {
      // @ts-ignore
      return !progress.completedPuzzles.includes(p.puzzleId._id);
    });

    if (unsolvedPuzzle && activePuzzle?._id !== unsolvedPuzzle.puzzleId._id) {
      // Check if user lick on item of first content
      const idx = content.contentPuzzles.findIndex(
        (p) => p.puzzleId._id === activePuzzle?._id
      );
      if (idx < 0) {
        setActivePuzzle(unsolvedPuzzle.puzzleId);
        setExplanations(content?.explanations?.[locale] || []);
      }
    } else {
      // If all puzzle are solved, set default first puzzle of first item
      if (contentIndex === 0) {
        // Check if user lick on item of first content
        const idx = content.contentPuzzles.findIndex(
          (p) => p.puzzleId._id === activePuzzle?._id
        );
        if (idx < 0) {
          setActivePuzzle(content.contentPuzzles[0].puzzleId);
          setExplanations(content?.explanations?.[locale] || []);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allContents,
    contentIndex,
    contents,
    locale,
    // progress.completedPuzzles, // Only run when first load component, don't include progress.completedPuzzles because it will automatically set index after solved puzzle, user cannot read information
    activePuzzle,
  ]);

  // Display menu
  const menuRef = useRef<HTMLDivElement>(null); // Reference for sidebar scrolling
  useEffect(() => {
    if (activePuzzle) {
      const activeItem = document.querySelector(
        `[data-menu-item="${activePuzzle._id}"]`
      );

      if (activeItem && menuRef.current) {
        const containerTop = menuRef.current.getBoundingClientRect().top;
        const itemTop = activeItem.getBoundingClientRect().top;

        // Increase the offset to ensure it's not hidden behind the sticky menu
        const stickyHeader = menuRef.current.querySelector('.sticky');
        const stickyHeaderHeight = stickyHeader
          ? stickyHeader.getBoundingClientRect().height
          : 90; // Default height if not found
        const scrollOffset =
          itemTop -
          containerTop +
          menuRef.current.scrollTop -
          stickyHeaderHeight -
          40; // 40 is item menu height

        menuRef.current.scrollTo({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    }
  }, [activePuzzle]);

  const { completedProgress, circumference, strokeDashoffset } = useMemo(() => {
    const progressInPercent = totalPuzzles
      ? Math.round(
          ((progress.completedPuzzles?.length || 0) / totalPuzzles) * 100
        )
      : 0;

    const _progress = Math.min(Math.max(progressInPercent, 0), 100);
    const _circumference = 2 * Math.PI * 15; // 15 is the radius

    return {
      isCompleted: progressInPercent === 100,
      completedProgress: progressInPercent,
      circumference: _circumference,
      strokeDashoffset: _circumference - (_progress / 100) * _circumference,
    };
  }, [progress.completedPuzzles, totalPuzzles]);

  const hasNextPuzzle = useMemo(() => {
    if (contentIndex === undefined) return false;

    // Check if the current content has any unsolved puzzles
    const currentContentHasNext = allContents[contentIndex].contentPuzzles.some(
      // @ts-ignore
      (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
    );

    if (currentContentHasNext) return true;

    // Check if any future content has unsolved puzzles
    return allContents.slice(contentIndex + 1).some((content) =>
      content.contentPuzzles.some(
        // @ts-ignore
        (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
      )
    );
  }, [contentIndex, allContents, progress.completedPuzzles]);

  const handleNextPuzzle = useCallback(() => {
    if (contentIndex === undefined) return;

    const currentContent = allContents[contentIndex];

    // Find the next unsolved puzzle in the current content
    const nextPuzzle = currentContent.contentPuzzles.find(
      // @ts-ignore
      (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
    );

    if (nextPuzzle) {
      setActivePuzzle(nextPuzzle.puzzleId);
      return;
    }

    // If no unsolved puzzles in current content, find the next content with an unsolved puzzle
    const nextContentIndex = allContents.findIndex(
      (content, idx) =>
        idx > contentIndex &&
        content.contentPuzzles.some(
          // @ts-ignore
          (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
        )
    );

    if (nextContentIndex !== -1) {
      const nextContent = allContents[nextContentIndex];
      const nextUnsolvedPuzzle = nextContent.contentPuzzles.find(
        // @ts-ignore
        (p) => !progress.completedPuzzles.includes(p.puzzleId._id)
      );

      if (nextUnsolvedPuzzle) {
        setContentIdx(nextContentIndex);
        setExplanations(nextContent?.explanations?.[locale] || []);
        setActivePuzzle(nextUnsolvedPuzzle.puzzleId);
      }
      return;
    }
  }, [allContents, contentIndex, locale, progress.completedPuzzles]);

  const handleOnItemClick = (
    index: number,
    puzzle: Puzzle,
    explanations: string[] = []
  ) => {
    if (contentIndex !== index) {
      setContentIdx(index);
    }
    setIsOpenDrawer(false);
    setActivePuzzle(puzzle);
    setExplanations(explanations);
  };

  const { open, onOpenDialog, onCloseDialog } = useDialog();
  const handlePracticeNow = useCallback(async () => {
    if (isSubscriptionExpired) {
      onOpenDialog();
      return;
    }
    setIsLoadingPractice(true);
    try {
      if (themes?.length) {
        const payload = {
          themes,
          excludedThemeIds,
        };
        const nextPuzzleResult = await axiosInstance.post(
          `${apiDomain}/v1/practice-puzzle/next`,
          {
            ...payload,
            userId: session?.id,
          }
        );
        const nextPuzzleId = nextPuzzleResult.data;
        if (nextPuzzleId) {
          sessionStorage.setItem(
            'practice-puzzle-payload',
            JSON.stringify(payload)
          );
          router.push(`/practice/${nextPuzzleId}`);
        } else {
          router.push(`/practice`);
        }
      } else {
        router.push(`/practice`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPractice(false);
    }
  }, [
    apiDomain,
    excludedThemeIds,
    isSubscriptionExpired,
    onOpenDialog,
    router,
    session?.id,
    themes,
  ]);

  const handleLearnOtherLesson = useCallback(() => {
    router.push('/lessons');
  }, [router]);

  const handleResetLesson = useCallback(async () => {
    setResetting(true);
    if (isLoggedIn) {
      try {
        await axiosInstance.post(
          `${apiDomain}/v1/lessons/public/reset-lesson`,
          {
            lessonId: _id,
            userId: session?.id,
          }
        );
        addToast(t('title.reset-lesson-success'), 'success');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (error) {
        console.error(error);
      } finally {
        setResetting(false);
      }
    } else {
      localStorage.removeItem(`synced_${_id}`);
      localStorage.removeItem(`lesson_${_id}`);
      setResetting(false);
      addToast(t('title.reset-lesson-success'), 'success');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  }, [_id, addToast, apiDomain, isLoggedIn, session?.id, t]);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Display puzzle
  const [isLoading, setIsLoading] = useState(false);
  const [displayedPuzzle, setDisplayedPuzzle] = useState(activePuzzle);
  const [isVisible, setIsVisible] = useState(false); // For fade-in transition
  useEffect(() => {
    if (displayedPuzzle?._id !== activePuzzle?._id) {
      setIsVisible(false);
      setIsLoading(true);

      setTimeout(() => {
        setDisplayedPuzzle(activePuzzle);
        setIsLoading(false);
        setIsVisible(true);
      }, 100);
    }
  }, [activePuzzle, displayedPuzzle?._id]);
  // End Display puzzle

  const fullUrl = useMemo(
    () => `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}${router.asPath}`,
    [router, locale]
  );

  // Generate dynamic SEO title and description
  const lessonSlug = useMemo(() => {
    return router.query.slug;
  }, [router]);
  const lessonTitle = title?.[locale] || 'LIMA Chess Lesson';
  const lessonDescription =
    description?.[locale] ||
    'Học cờ vua một cách thông minh với LIMA Chess, các bài học từng bước giúp bạn nắm vững chiến lược, chiến thuật cờ vua một cách dễ dàng.';

  const pageUrl = `https://limachess.com/lessons/${lessonSlug}`;

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

  if (allContents.length === 0) return null;

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
      <div className="flex">
        {/* Sidebar with navigation */}
        <aside
          ref={menuRef}
          className="w-1/4 h-[calc(100dvh-100px)] overflow-y-auto border-r border-l border-t rounded-md sticky top-0 hidden lg:flex lg:flex-col"
        >
          <MenuLesson
            contents={contents}
            activePuzzleId={activePuzzle?._id}
            title={title[locale]}
            circumference={circumference}
            completedProgress={completedProgress}
            completedPuzzleMap={completedPuzzleMap}
            strokeDashoffset={strokeDashoffset}
            onItemClick={handleOnItemClick}
            description={description?.[locale] || ''}
          />
        </aside>

        {/* Main content */}
        <div className="w-full lg:w-3/4 p-4 pb-[100px] lg:pb-4 lg:pl-8 overflow-y-auto h-[calc(100dvh-100px)]">
          <TransitionContainer isLoading={isLoading} isVisible={isVisible}>
            {displayedPuzzle && (
              <SolvePuzzle
                showNextButton={hasNextPuzzle}
                highlightPossibleMoves
                onNextClick={handleNextPuzzle}
                puzzle={displayedPuzzle}
                onSolved={async () => {
                  await saveProgress(displayedPuzzle._id!);
                }}
                showTimer={false}
                actionClass={`${isMobile ? 'pl-20 min-h-[72px]' : ''} `}
                showCustomArrows
              />
            )}
            <div className="mt-4">
              {/* Mobile */}
              <div className="fixed z-10 bottom-4 left-4 lg:hidden">
                <Button
                  outline
                  gradientDuoTone="tealToLime"
                  onClick={() => {
                    setIsOpenDrawer(true);
                  }}
                >
                  <VscLayoutMenubar />
                </Button>
              </div>
              <div className="flex flex-col mt-4">
                {explanations?.map((e, index) => (
                  <p key={`explanation-${index}`}>{e}</p>
                ))}
              </div>
              {progress.completedPuzzles.length >= totalPuzzles && (
                <div className="flex flex-col justify-center w-full items-center mt-2">
                  <h3 className="text-xl font-bold text-center mb-4 flex ">
                    {t('title.lesson-completion')}{' '}
                  </h3>
                  <div className="flex flex-col lg:flex-row items-center mb-4">
                    {!isLoggedIn ? (
                      <>
                        <Link
                          href="/register"
                          className="text-blue-500 text-sm hover:underline ml-2"
                        >
                          {t('button.register-free')}
                        </Link>
                        <Button
                          className="ml-4"
                          gradientDuoTone="purpleToBlue"
                          outline
                          isProcessing={resetting}
                          size={isMobile ? 'sm' : 'lg'}
                          onClick={handleLearnOtherLesson}
                        >
                          {t('navigation.other-lesson')}
                        </Button>
                        <Button
                          className="ml-4"
                          gradientDuoTone="purpleToBlue"
                          outline
                          isProcessing={resetting}
                          size={isMobile ? 'sm' : 'lg'}
                          onClick={handleResetLesson}
                        >
                          {t('button.restart-lesson')}
                        </Button>
                      </>
                    ) : (
                      <div className="flex mt-2 lg:mt-0">
                        <Button
                          className="ml-4"
                          gradientDuoTone="greenToBlue"
                          outline
                          size={isMobile ? 'sm' : 'lg'}
                          isProcessing={isLoadingPractice}
                          onClick={handlePracticeNow}
                        >
                          {t('button.practice-now')}
                        </Button>
                        <Button
                          className="ml-4"
                          gradientDuoTone="pinkToOrange"
                          outline
                          isProcessing={resetting}
                          size={isMobile ? 'sm' : 'lg'}
                          onClick={handleLearnOtherLesson}
                        >
                          {t('navigation.other-lesson')}
                        </Button>
                        <Button
                          className="ml-4"
                          gradientDuoTone="purpleToBlue"
                          outline
                          isProcessing={resetting}
                          size={isMobile ? 'sm' : 'lg'}
                          onClick={handleResetLesson}
                        >
                          {t('button.restart-lesson')}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isPublic && (
                    <div className="flex mb-6 justify-center">
                      <ShareFacebookButton url={fullUrl} />
                      <Clipboard
                        valueToCopy={fullUrl}
                        label={t('button.copy-link')}
                        className="ml-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </TransitionContainer>
        </div>
      </div>
      {isOpenDrawer && (
        <MenuLessonDrawer
          ref={drawerRef} // Pass ref to the component
          onClose={() => {
            setIsOpenDrawer(false);
          }}
          onOpen={() => {
            setTimeout(() => {
              if (!drawerRef.current) return;

              const activeItem = drawerRef.current.querySelector(
                `[data-menu-item="${activePuzzle?._id}"]`
              );

              if (activeItem) {
                activeItem.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 200);
          }}
        >
          <MenuLesson
            contents={contents}
            activePuzzleId={activePuzzle?._id}
            title={title[locale]}
            circumference={circumference}
            completedProgress={completedProgress}
            completedPuzzleMap={completedPuzzleMap}
            strokeDashoffset={strokeDashoffset}
            description={description?.[locale] || ''}
            onItemClick={handleOnItemClick}
          />
        </MenuLessonDrawer>
      )}
      {open && <RegisterDialog onClose={onCloseDialog} />}
    </>
  );
};
