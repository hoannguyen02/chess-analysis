import underpromotionSources from './underpromotion-game-sources.json';
import passedPawnSources from './passed-pawn-simplification-game-sources.json';
import promotionMateSources from './promotion-mate-game-sources.json';
import promotionSources from './promotion-game-sources.json';
import anastasiaMateSources from './anastasia-mate-game-sources.json';
import arabianMateSources from './arabian-mate-game-sources.json';
import rookBishopMateSources from './rook-bishop-mate-game-sources.json';
import queenRookMateSources from './queen-rook-mate-game-sources.json';
import backRankMateSources from './back-rank-mate-game-sources.json';
import queenMateSources from './queen-mate-game-sources.json';
import { sourceOpeningCaption } from './game-source-openings';
import oneRookMateSources from './one-rook-mate-game-sources.json';
import { gamePlayerTitle, gamePlayers } from '../chess/game-player-title';
import twoRookMateSources from './two-rook-mate-game-sources.json';
import drawSources from './draw-game-sources.json';
import simplificationSources from './simplification-game-sources.json';
import discoverySources from './discovery-game-sources.json';
import forkSources from './fork-game-sources.json';
import pinSources from './pin-game-sources.json';
import removingDefenderSources from './removing-defender-game-sources.json';
import skewerSources from './skewer-game-sources.json';
import type { GameReference } from '../chess/draw-game-viewer';

/** Only this small caption is sent with exercise cards, not the full game. */
export function practiceGameCaption(reference?: GameReference): string {
  if (!reference || reference.kind !== 'game') return '';
  const headers = practiceHeaders(reference);
  if (!headers) return '';
  const year = headers.Date?.match(/^\d{4}/)?.[0];
  const event = headers.Event?.trim();
  return [year, event && !/^\?+$/.test(event) ? event : '']
    .filter(Boolean)
    .join(' · ');
}

export function practicePlayerTitle(reference?: GameReference): string {
  if (!reference || reference.kind !== 'game') return '';
  const headers = practiceHeaders(reference);
  return headers ? gamePlayerTitle(headers) : '';
}

export function practicePlayers(reference?: GameReference) {
  if (!reference || reference.kind !== 'game') return [];
  const headers = practiceHeaders(reference);
  return headers ? gamePlayers(headers) : [];
}

function practiceHeaders(reference: GameReference) {
  const sources = (
    reference.collection === 'removing-defender'
      ? removingDefenderSources
      : reference.collection === 'promotion-mate'
        ? promotionMateSources
        : reference.collection === 'underpromotion'
          ? underpromotionSources
          : reference.collection === 'passed-pawn-simplification'
            ? passedPawnSources
            : reference.collection === 'promotion'
              ? promotionSources
              : reference.collection === 'anastasia-mate'
                ? anastasiaMateSources
                : reference.collection === 'arabian-mate'
                  ? arabianMateSources
                  : reference.collection === 'rook-bishop-mate'
                    ? rookBishopMateSources
                    : reference.collection === 'queen-rook-mate'
                      ? queenRookMateSources
                      : reference.collection === 'back-rank-mate'
                        ? backRankMateSources
                        : reference.collection === 'queen-mate'
                          ? queenMateSources
                          : reference.collection === 'one-rook-mate'
                            ? oneRookMateSources
                            : reference.collection === 'two-rook-mate'
                              ? twoRookMateSources
                              : reference.collection === 'simplification'
                                ? simplificationSources
                                : reference.collection === 'discovery'
                                  ? discoverySources
                                  : reference.collection === 'fork'
                                    ? forkSources
                                    : reference.collection === 'pin'
                                      ? pinSources
                                      : reference.collection === 'skewer'
                                        ? skewerSources
                                        : drawSources
  ) as Record<string, { headers: Record<string, string> }>;
  return sources[reference.id]?.headers;
}

export function practiceGameOpening(reference?: GameReference): string {
  if (!reference || reference.kind !== 'game') return '';
  const headers = practiceHeaders(reference);
  if (!headers) return '';
  return sourceOpeningCaption(
    reference.collection ?? 'draw',
    reference.id,
    headers
  );
}
