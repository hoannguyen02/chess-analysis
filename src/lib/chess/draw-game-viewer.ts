import { practiceAccessHeaders, readPracticeToken } from '../practice-access';
import { Chess } from 'chess.js';

export type GameReference = {
  collection?:
    | 'skewer'
    | 'pin'
    | 'removing-defender'
    | 'fork'
    | 'discovery'
    | 'simplification'
    | 'back-rank-mate'
    | 'rook-bishop-mate'
    | 'arabian-mate'
    | 'anastasia-mate'
    | 'promotion'
    | 'underpromotion'
    | 'passed-pawn-simplification'
    | 'promotion-mate'
    | 'queen-rook-mate'
    | 'queen-mate'
    | 'one-rook-mate'
    | 'two-rook-mate';
  id: string;
  kind: string;
  ply: number;
  branch: number;
};
export type GameSource = {
  gameOpening?: string;
  kind: 'game' | 'study';
  headers: Record<string, string>;
  fen: string;
  lines: string[][];
};
export type GameExercisePosition = {
  fen: string;
  moves: string[];
  alternativeLines?: string[][];
  previousMove?: { fen: string; move: string };
};
export type ReferenceGame = {
  reference: GameReference;
  source?: GameSource;
  position?: GameExercisePosition;
};

function positionKey(fen: string) {
  const board = new Chess(fen);
  const fields = board.fen().split(' ');
  if (!board.moves({ verbose: true }).some((move) => move.flags.includes('e')))
    fields[3] = '-';
  return fields.slice(0, 4).join(' ');
}

/** A teaching position must never masquerade as a played source-game frame. */
export function exerciseGamePreview(
  source: GameSource,
  reference: Pick<GameReference, 'branch' | 'ply'>,
  position?: GameExercisePosition
): { source: GameSource; markerPly: number } | null {
  if (!position) return null;
  const frame = gameFrames(source, reference.branch)[reference.ply];
  if (frame && positionKey(frame.fen) === positionKey(position.fen))
    return null;
  let fen = position.fen;
  let prefix: string[] = [];
  if (position.previousMove) {
    const before = new Chess(position.previousMove.fen);
    const move = before.move(position.previousMove.move);
    if (move && positionKey(before.fen()) === positionKey(position.fen)) {
      fen = position.previousMove.fen;
      prefix = [move.san];
    }
  }
  return {
    markerPly: prefix.length,
    source: {
      kind: 'study',
      headers: source.headers,
      fen,
      lines: [position.moves, ...(position.alternativeLines ?? [])].map(
        (line) => [...prefix, ...line]
      ),
    },
  };
}

/** One entry per original game, retaining the active exercise's exact marker. */
export function referenceGameList(
  items: ReferenceGame[],
  active: ReferenceGame
) {
  const key = (item: ReferenceGame) =>
    `${item.reference.collection ?? 'draw'}:${item.reference.id}`;
  const unique = new Map<string, ReferenceGame>();
  for (const item of items)
    if (!unique.has(key(item))) unique.set(key(item), item);
  unique.set(key(active), active);
  return Array.from(unique.values());
}

// Replay once per selected variation, not on every playback tick.
export function gameFrames(source: GameSource, branch: number) {
  const game = new Chess(source.fen);
  const frames = [{ fen: game.fen(), label: 'Bắt đầu', from: '', to: '' }];
  for (const san of source.lines[branch]) {
    const number = game.fen().split(' ')[5];
    const prefix = `${number}${game.turn() === 'w' ? '.' : '…'}`;
    const move = game.move(san);
    if (!move) throw new Error('Invalid saved game move');
    frames.push({
      fen: game.fen(),
      label: `${prefix} ${move.san}`,
      from: move.from,
      to: move.to,
    });
  }
  return frames;
}

/** Keep the last played move outside the exercise's solution line. */
export function gameExerciseContext(
  source: GameSource,
  reference: Pick<GameReference, 'branch' | 'ply'>
) {
  const line = source.lines[reference.branch];
  if (
    !line ||
    !Number.isInteger(reference.ply) ||
    reference.ply < 0 ||
    reference.ply > line.length
  )
    throw new Error('Invalid exercise source position');
  const game = new Chess(source.fen);
  let previousMove: { fen: string; move: string } | undefined;
  for (const san of line.slice(0, reference.ply)) {
    const fen = game.fen();
    const move = game.move(san);
    if (!move) throw new Error('Invalid exercise source move');
    previousMove = { fen, move: move.san };
  }
  return { fen: game.fen(), previousMove };
}
const collections = new Map<string, Promise<Record<string, GameSource>>>();
export async function loadGameSource(
  id: string,
  collection?:
    | 'skewer'
    | 'pin'
    | 'removing-defender'
    | 'fork'
    | 'discovery'
    | 'simplification'
    | 'back-rank-mate'
    | 'rook-bishop-mate'
    | 'arabian-mate'
    | 'anastasia-mate'
    | 'promotion'
    | 'underpromotion'
    | 'passed-pawn-simplification'
    | 'promotion-mate'
    | 'queen-rook-mate'
    | 'queen-mate'
    | 'one-rook-mate'
    | 'two-rook-mate'
): Promise<GameSource> {
  const endpoint =
    collection === 'removing-defender'
      ? '/api/removing-defender-game-sources'
      : collection === 'promotion-mate'
        ? '/api/promotion-mate-game-sources'
        : collection === 'underpromotion'
          ? '/api/underpromotion-game-sources'
          : collection === 'passed-pawn-simplification'
            ? '/api/passed-pawn-simplification-game-sources'
            : collection === 'promotion'
              ? '/api/promotion-game-sources'
              : collection === 'anastasia-mate'
                ? '/api/anastasia-mate-game-sources'
                : collection === 'arabian-mate'
                  ? '/api/arabian-mate-game-sources'
                  : collection === 'rook-bishop-mate'
                    ? '/api/rook-bishop-mate-game-sources'
                    : collection === 'queen-rook-mate'
                      ? '/api/queen-rook-mate-game-sources'
                      : collection === 'back-rank-mate'
                        ? '/api/back-rank-mate-game-sources'
                        : collection === 'queen-mate'
                          ? '/api/queen-mate-game-sources'
                          : collection === 'one-rook-mate'
                            ? '/api/one-rook-mate-game-sources'
                            : collection === 'two-rook-mate'
                              ? '/api/two-rook-mate-game-sources'
                              : collection === 'simplification'
                                ? '/api/simplification-game-sources'
                                : collection === 'discovery'
                                  ? '/api/discovery-game-sources'
                                  : collection === 'fork'
                                    ? '/api/fork-game-sources'
                                    : collection === 'pin'
                                      ? '/api/pin-game-sources'
                                      : collection === 'skewer'
                                        ? '/api/skewer-game-sources'
                                        : '/api/draw-game-sources';
  const cacheKey = `${endpoint}:${readPracticeToken()}`;
  let sources = collections.get(cacheKey);
  if (!sources) {
    sources = fetch(endpoint, {
      cache: 'no-store',
      headers: practiceAccessHeaders(),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Source unavailable');
        return response.json();
      })
      .catch((error) => {
        collections.delete(cacheKey);
        throw error;
      });
    collections.set(cacheKey, sources);
  }
  const source = (await sources)[id];
  if (!source) throw new Error('Missing source');
  return source;
}
