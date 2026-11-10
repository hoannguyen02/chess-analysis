import openings from './practice-openings.json';
import { gameOpeningCaption } from '../chess/game-opening';

export function sourceOpeningCaption(
  collection: string,
  id: string,
  headers: Record<string, string>
): string {
  const originalCollection =
    collection === 'passed-pawn-simplification'
      ? 'simplification'
      : ['underpromotion', 'promotion-mate'].includes(collection)
        ? 'promotion'
        : collection;
  const matched = (openings as Record<string, { name: string; eco: string }>)[
    `${originalCollection}/${id}`
  ];
  return gameOpeningCaption(headers, matched);
}

/** Add compact metadata without changing saved PGN headers or replay moves. */
export function withGameOpenings<
  T extends { kind: string; headers: Record<string, string> },
>(sources: Record<string, T>, collection: string) {
  return Object.fromEntries(
    Object.entries(sources).map(([id, source]) => [
      id,
      {
        ...source,
        gameOpening:
          source.kind === 'game'
            ? sourceOpeningCaption(collection, id, source.headers)
            : '',
      },
    ])
  );
}
