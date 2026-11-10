import type { ReactNode } from 'react';
import { ChessboardDnDProvider } from 'react-chessboard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

/** Share the chessboard's manager with hooks from the application's react-dnd. */
export function SetupBoardDnDProvider({
  children,
  context,
}: {
  children: ReactNode;
  context?: Window;
}) {
  return (
    <ChessboardDnDProvider context={context}>
      {/* react-chessboard bundles its own React context. This second provider
          reuses the existing singleton manager (including its touch backend),
          while exposing it through the application's React context as well.
          Use the same explicit context when sharing a practice board's manager,
          so nested dialog cleanup cannot reset its global instance. */}
      <DndProvider backend={HTML5Backend} context={context}>
        {children}
      </DndProvider>
    </ChessboardDnDProvider>
  );
}
