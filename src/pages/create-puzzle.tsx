

import dynamic from "next/dynamic";

// Dynamically import the chessboard component with no SSR
const DragDropSetupChessboard = dynamic(
  () => import("@/components/DragDropSetupChessboard"),
  { ssr: false }
);

const CreatePuzzlePage = () => {
    return <DragDropSetupChessboard />
}

export default CreatePuzzlePage