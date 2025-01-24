import { Puzzle } from '@/types/puzzle';
import { Drawer } from 'flowbite-react';
import { VscClose } from 'react-icons/vsc';
import { Logo } from './Logo';
import SolvePuzzle from './SolvePuzzle';

type Props = {
  onClose(): void;
  puzzle: Puzzle;
  showNextButton?: boolean;
  onNextClick?(): void;
};

export const SolvePuzzleDrawer = ({
  onClose,
  puzzle,
  showNextButton = false,
  onNextClick,
}: Props) => {
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
        className="cursor-pointer px-4 pt-4 hover:bg-gray-50 dark:hover:bg-gray-700 "
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
        <SolvePuzzle
          showNextButton={showNextButton}
          highlightPossibleMoves
          onNextClick={onNextClick}
          showBackButton={false}
          puzzle={puzzle}
        />
      </Drawer.Items>
    </Drawer>
  );
};
