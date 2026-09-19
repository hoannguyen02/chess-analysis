import { useRef } from 'react';
import { useDragLayer } from 'react-dnd';
import type { Square } from 'react-chessboard/dist/chessboard/types';

/** Paint empty squares while leaving existing pieces available for dragging. */
export function SetupBoardPaintLayer({
  orientation,
  occupiedSquares,
  enabled,
  onPaint,
  label,
}: {
  orientation: 'white' | 'black';
  occupiedSquares: Set<Square>;
  enabled: boolean;
  onPaint: (square: Square) => void;
  label: (square: Square) => string;
}) {
  // Observe drag state only: tray and existing-piece drags place on drop.
  // Painting starts exclusively with a pointer press on an empty square.
  const isDragging = useDragLayer((monitor) => monitor.isDragging());
  const stroke = useRef<{
    pointerId: number;
    x: number;
    y: number;
    visited: Set<Square>;
  } | null>(null);
  const squareAt = (column: number, row: number) =>
    `${'abcdefgh'[orientation === 'white' ? column : 7 - column]}${
      orientation === 'white' ? 8 - row : row + 1
    }` as Square;

  const paintTo = (element: HTMLDivElement, x: number, y: number) => {
    const current = stroke.current;
    if (!current) return;
    const rect = element.getBoundingClientRect();
    // Sample between pointer events so quick sweeps do not skip squares.
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(x - current.x, y - current.y) / (rect.width / 32))
    );
    for (let step = 1; step <= steps; step++) {
      const column = Math.floor(
        ((current.x + ((x - current.x) * step) / steps - rect.left) /
          rect.width) *
          8
      );
      const row = Math.floor(
        ((current.y + ((y - current.y) * step) / steps - rect.top) /
          rect.height) *
          8
      );
      if (column < 0 || column > 7 || row < 0 || row > 7) continue;
      const square = squareAt(column, row);
      if (!current.visited.has(square)) {
        current.visited.add(square);
        onPaint(square);
      }
    }
    current.x = x;
    current.y = y;
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 grid touch-none grid-cols-8 grid-rows-8"
      onPointerDown={(event) => {
        if (!enabled || isDragging || event.button !== 0 || stroke.current)
          return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        stroke.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          visited: new Set(),
        };
        paintTo(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (stroke.current?.pointerId === event.pointerId) {
          paintTo(event.currentTarget, event.clientX, event.clientY);
        }
      }}
      onPointerUp={(event) => {
        if (stroke.current?.pointerId !== event.pointerId) return;
        paintTo(event.currentTarget, event.clientX, event.clientY);
        stroke.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        stroke.current = null;
      }}
      onLostPointerCapture={() => {
        stroke.current = null;
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {Array.from({ length: 64 }, (_, index) => {
        const square = squareAt(index % 8, Math.floor(index / 8));
        const passThrough =
          !enabled || isDragging || occupiedSquares.has(square);
        return (
          <button
            key={square}
            type="button"
            aria-label={label(square)}
            aria-hidden={passThrough}
            tabIndex={passThrough ? -1 : 0}
            style={{ pointerEvents: passThrough ? 'none' : 'auto' }}
            className="cursor-crosshair hover:bg-blue-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            onClick={(event) => {
              if (event.detail === 0) onPaint(square);
            }}
          />
        );
      })}
    </div>
  );
}
