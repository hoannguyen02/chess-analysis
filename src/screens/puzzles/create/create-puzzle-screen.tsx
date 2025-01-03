import dynamic from 'next/dynamic';

const DragDropSetupChessboard = dynamic(
  () => import('@/components/DragDropSetupChessboard'),
  { ssr: false }
);

export const CreatePuzzleScreen = () => {
  return <DragDropSetupChessboard />;
};
