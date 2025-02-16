/* eslint-disable @typescript-eslint/ban-ts-comment */
import SolvePuzzle from '@/components/SolvePuzzle';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { Button } from 'flowbite-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { MenuLesson } from './MenuLesson';
import { MenuLessonDrawer } from './MenuLessonDrawer';
import { useLessonProgress } from './useLessonProgress';

type Props = {
  data: LessonExpanded;
};

export const LessonDetailsScreenV2 = ({ data }: Props) => {
  const { isMobile } = useAppContext();
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const { locale } = useAppContext();

  const [contentIndex, setContentIdx] = useState<number>();
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>();
  const [explanations, setExplanations] = useState<string[]>([]);

  const { title, contents, _id, version, totalPuzzles } = data;

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
    if (allContents?.length && progress?.completedPuzzles?.length) {
      if (hasRunOnce.current) return; // Prevent re-execution after first run
      hasRunOnce.current = true; // Mark as executed

      // Find the first uncompleted content
      const index = allContents?.findIndex((content) =>
        content.contentPuzzles.some(
          (puzzle) => !progress.completedPuzzles.includes(puzzle.puzzleId._id!)
        )
      );

      if (index !== -1) {
        setContentIdx(index as number);
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
      setActivePuzzle(unsolvedPuzzle.puzzleId);
      setExplanations(content?.explanations?.[locale] || []);
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
      // Scroll sidebar menu to keep the active puzzle visible
      const activeItem = document.querySelector(
        `[data-menu-item="${activePuzzle._id}"]`
      );

      if (activeItem && menuRef.current) {
        menuRef.current.scrollTo({
          top:
            activeItem.getBoundingClientRect().top +
            menuRef.current.scrollTop -
            200, // Adjust offset
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

  const handleOnItemClick = (puzzle: Puzzle, explanations: string[] = []) => {
    setIsOpenDrawer(false);
    setActivePuzzle(puzzle);
    setExplanations(explanations);
  };

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
      }, 300);
    }
  }, [activePuzzle, displayedPuzzle?._id]);
  // End Display puzzle

  if (!data.contents || data.contents.length === 0) return null;

  return (
    <>
      <div className="flex">
        {/* Sidebar with navigation */}
        <aside
          ref={menuRef}
          className="w-1/4 h-[calc(100vh-120px)] overflow-y-auto border-r border-l border-t rounded-md sticky top-0 hidden lg:flex lg:flex-col"
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
          />
        </aside>

        {/* Main content */}
        <div className="w-full lg:w-3/4 p-4 pb-[120px] lg:pb-4 lg:pl-8 overflow-y-auto h-[calc(100vh-120px)]">
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
              />
            )}
            <div className="mt-4">
              {/* Mobile */}
              <div className="fixed bottom-4 left-4 lg:hidden">
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
            onItemClick={handleOnItemClick}
          />
        </MenuLessonDrawer>
      )}
    </>
  );
};
