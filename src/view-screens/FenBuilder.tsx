import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

const DragDropSetupChessboard = dynamic(
  () => import('@/components/DragDropSetupChessboard'),
  { ssr: false }
);

export const FenBuilderScreen = () => {
  const router = useRouter();
  const fen = useMemo(() => {
    return router.query.fen as string;
  }, [router]);

  return <DragDropSetupChessboard fen={fen} />;
};
