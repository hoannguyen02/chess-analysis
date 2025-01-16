import { Puzzle } from '@/types/puzzle';
import { Drawer } from 'flowbite-react';
import { VscClose } from 'react-icons/vsc';
import SolvePuzzle from './SolvePuzzle';

type Props = {
  onClose(): void;
  puzzle: Puzzle;
};

export const SolvePuzzleDrawer = ({ onClose, puzzle }: Props) => {
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
        // title="Solve puzzle"
        className="cursor-pointer px-4 pt-4 hover:bg-gray-50 dark:hover:bg-gray-700"
      />
      <Drawer.Items className="p-4">
        <SolvePuzzle showBackButton={false} puzzle={puzzle} />
      </Drawer.Items>
    </Drawer>
  );
};
