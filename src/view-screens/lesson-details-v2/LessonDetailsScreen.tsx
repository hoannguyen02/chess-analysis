/* eslint-disable @typescript-eslint/ban-ts-comment */
import SolvePuzzle from '@/components/SolvePuzzle';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { Button, Tooltip } from 'flowbite-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { VscCheck, VscLayoutMenubar } from 'react-icons/vsc';
import { useLessonProgress } from './useLessonProgress';

type Props = {
  data: LessonExpanded;
};

export const LessonDetailsScreenV2 = ({ data }: Props) => {
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

  const { progress, saveProgress } = useLessonProgress(
    _id!,
    version,
    contentPuzzleIds,
    totalPuzzles
  );

  const CompletedPuzzleMap = useMemo(() => {
    const map = new Map<string, boolean>();
    progress.completedPuzzles.forEach((cur) => map.set(cur, true));
    return map;
  }, [progress.completedPuzzles]);

  useEffect(() => {
    if (allContents?.length) {
      // Find the first uncompleted content
      const index = allContents?.findIndex((content) => {
        return content.contentPuzzles.some(
          (puzzle) => !progress.completedPuzzles.includes(puzzle.puzzleId._id!)
        );
      });
      if (index !== -1) setContentIdx(index as number);
    }
  }, [allContents, data.contents, progress.completedPuzzles]);

  useEffect(() => {
    if (contentIndex === undefined) return;
    const content = allContents[contentIndex];
    const unsolvedPuzzle = content.contentPuzzles.find((p) => {
      // @ts-ignore
      return !progress.completedPuzzles.includes(p.puzzleId._id);
    });
    if (unsolvedPuzzle) {
      setActivePuzzle(unsolvedPuzzle.puzzleId);
      setExplanations(content?.explanations?.[locale] || []);
    }
  }, [allContents, contentIndex, contents, locale, progress.completedPuzzles]);

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

  const hasNextPuzzle = () => {
    if (contentIndex === undefined) return false;

    const currentContent = allContents[contentIndex];

    // Check if there are any unsolved puzzles in this content section
    return currentContent.contentPuzzles.some((p) => {
      // @ts-ignore
      return !progress.completedPuzzles.includes(p.puzzleId._id);
    });
  };

  const handleNextPuzzle = () => {
    if (contentIndex === undefined) return false;

    const currentContent = allContents[contentIndex];

    // Find the next unsolved puzzle within the same content section
    const unsolvedPuzzle = currentContent.contentPuzzles.find((p) => {
      // @ts-ignore
      return !progress.completedPuzzles.includes(p.puzzleId._id);
    });
    if (unsolvedPuzzle) {
      setActivePuzzle(unsolvedPuzzle.puzzleId);
    } else {
      // Active next content if available
      if (contentIndex < allContents.length) {
        setContentIdx((prev) => prev! + 1);
      }
    }
  };

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
    <div className="flex">
      {/* Sidebar with navigation */}
      <aside
        ref={menuRef}
        className="w-1/4 h-[calc(100vh-120px)] overflow-y-auto border-r border-l border-t rounded-md sticky top-0 hidden lg:flex lg:flex-col"
      >
        <div className="sticky top-0 z-20 border-b bg-white flex items-center justify-between p-4">
          <h3>{title[locale]}</h3>
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              {/* Background Circle */}
              <circle
                className="text-[#D6D6D6]"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                r="15"
                cx="18"
                cy="18"
              />

              {/* Progress Circle */}
              <circle
                className="text-[#007BFF] transition-all duration-300"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                r="15"
                cx="18"
                cy="18"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 18 18)" // Rotates progress to start from the top
              />

              {/* Text in the center */}
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                className="text-[#2D3748] text-[10px] font-bold"
              >
                {completedProgress}%
              </text>
            </svg>
          </div>
        </div>

        <ul className="space-y-2">
          {data.contents.map((content, index) => (
            <li key={content._id} className="mb-2">
              <div className="sticky border-b flex justify-between items-center top-[70px] bg-white py-2 font-bold text-gray-700 z-10 p-4">
                {`${index + 1}.`} {content.title[locale]}
              </div>

              <ul className="pl-0 text-sm">
                {content.contentPuzzles.map(({ puzzleId: puzzle }) => (
                  <li
                    key={puzzle._id}
                    data-menu-item={puzzle._id} // Identify menu item
                    className={`${
                      activePuzzle?._id === puzzle._id
                        ? 'font-bold bg-blue-100 '
                        : ''
                    } hover:bg-blue-100`}
                  >
                    <button
                      onClick={() => {
                        setActivePuzzle(puzzle);
                        setExplanations(content?.explanations?.[locale] || []);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition w-full text-left px-4 py-2 flex justify-between"
                    >
                      {puzzle?.title?.[locale]}
                      {CompletedPuzzleMap.get(puzzle._id!) && (
                        <VscCheck className="text-[#28A745]" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <div className="w-full lg:w-3/4 p-4 lg:pl-8 overflow-y-auto h-[calc(100vh-120px)]">
        <TransitionContainer isLoading={isLoading} isVisible={isVisible}>
          {displayedPuzzle && (
            <SolvePuzzle
              showNextButton={hasNextPuzzle()}
              highlightPossibleMoves
              onNextClick={handleNextPuzzle}
              puzzle={displayedPuzzle}
              onSolved={async () => {
                await saveProgress(displayedPuzzle._id!);
              }}
              showTimer={false}
            />
          )}
          <div className="mt-4">
            {/* Mobile */}
            <div className="lg:hidden">
              <Tooltip
                className="lg:hidden"
                content="Show lesson menu"
                placement="top"
              >
                <Button outline gradientDuoTone="tealToLime">
                  <VscLayoutMenubar />
                </Button>
              </Tooltip>
            </div>
            {/* Desktop */}
            <div className="hidden lg:flex lg:flex-col mt-4">
              {explanations?.map((e, index) => (
                <p key={`explanation-${index}`}>{e}</p>
              ))}
            </div>
          </div>
        </TransitionContainer>
      </div>
    </div>
  );
};
