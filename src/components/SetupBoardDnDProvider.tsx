import type { ReactNode } from 'react';
import { ChessboardDnDProvider } from 'react-chessboard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

/** Share the chessboard's manager with hooks from the application's react-dnd. */
export function SetupBoardDnDProvider({ children }: { children: ReactNode }) {
  return (
    <ChessboardDnDProvider>
      {/* react-chessboard bundles its own React context. This second provider
          reuses the existing singleton manager (including its touch backend),
          while exposing it through the application's React context as well.
          Keep both providers mounted together for the manager's lifetime. */}
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    </ChessboardDnDProvider>
  );
}
