import { Puzzle } from '@/types/puzzle';
import { Drawer } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { VscClose } from 'react-icons/vsc';
import { Logo } from './Logo';
import SolvePuzzle from './SolvePuzzle';

type Props = {
  onClose(): void;
  puzzle: Puzzle;
  showNextButton?: boolean;
  onNextClick?(): void;
  onSolved?(): void;
};

export const SolvePuzzleDrawer = ({
  onClose,
  puzzle,
  showNextButton = false,
  onNextClick,
  onSolved,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayedPuzzle, setDisplayedPuzzle] = useState(puzzle);
  const [isVisible, setIsVisible] = useState(false); // For fade-in transition

  useEffect(() => {
    setIsVisible(false); // Hide content before changing
    setIsLoading(true); // Show loading effect

    setTimeout(() => {
      setDisplayedPuzzle(puzzle); // Update puzzle
      setIsLoading(false); // Hide loading effect
      setIsVisible(true); // Show new content smoothly
    }, 300); // Adjust transition duration if needed
  }, [puzzle]);

  return (
    <Drawer
      edge
      open
      onClose={onClose}
      position="bottom"
      className="p-0 h-full"
    >
      <Drawer.Header
        closeIcon={VscClose}
        titleIcon={Logo}
        className="cursor-pointer px-4 pt-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={onClose}
        theme={{
          inner: {
            closeIcon: 'h-8 w-8',
            titleIcon: 'hidden md:flex w-32 h-auto',
            titleText:
              'mb-0 inline-flex items-center text-base font-semibold text-gray-500',
          },
        }}
      />
      <Drawer.Items className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-500 ease-in-out transform ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <SolvePuzzle
              showNextButton={showNextButton}
              highlightPossibleMoves
              onNextClick={onNextClick}
              showBackButton={false}
              puzzle={displayedPuzzle}
              onSolved={onSolved}
            />
          </div>
        )}
      </Drawer.Items>
    </Drawer>
  );
};
