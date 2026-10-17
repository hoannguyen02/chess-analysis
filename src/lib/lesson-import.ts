import { Chess } from 'chess.js';

export type LessonPosition = {
  id: string;
  title: string;
  fen: string;
  previousMove?: string;
};

/** FEN always describes the position BEFORE the optional move. */
export function resolveLessonPosition(
  position: Pick<LessonPosition, 'fen' | 'previousMove'>
) {
  const game = new Chess();
  if (!game.load(position.fen)) throw new Error('fen');
  let move = null;
  if (position.previousMove?.trim()) {
    const san = position.previousMove
      .trim()
      .replace(/^\d+\.(?:\.\.)?\s*/, '')
      .replace(/[!?]+/g, '')
      .replace(/0/g, 'O');
    move = game.move(san, { sloppy: true });
    if (!move) throw new Error('move');
  }
  return { fen: game.fen(), move };
}

export function parseLessonSpreadsheet(text: string) {
  const rows = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((row) => row.split('\t').map((cell) => cell.trim()));
  const positions: Omit<LessonPosition, 'id'>[] = [];
  const errors: { row: number; column: number; reason: 'fen' | 'move' }[] = [];
  const width = Math.max(0, ...rows.map((row) => row.length));
  // Read down each FEN/move pair so each level stays together.
  for (let column = 0; column < width; column += 2) {
    let heading = '';
    let count = 0;
    for (let row = 0; row < rows.length; row++) {
      const fen = rows[row][column] || '';
      const previousMove = rows[row][column + 1] || '';
      if (!fen && !previousMove) continue;
      if (
        row === 0 &&
        fen &&
        fen.split('/').length < 3 &&
        !/\s[wb]\s/.test(fen)
      ) {
        heading = fen;
        continue;
      }
      try {
        resolveLessonPosition({ fen, previousMove });
        count++;
        positions.push({
          title: heading
            ? `${heading} — ${count}`
            : `Position ${positions.length + 1}`,
          fen,
          ...(previousMove ? { previousMove } : {}),
        });
      } catch (error) {
        errors.push({
          row: row + 1,
          column: column + 1,
          reason:
            error instanceof Error && error.message === 'move' ? 'move' : 'fen',
        });
      }
    }
  }
  return { positions, errors };
}
