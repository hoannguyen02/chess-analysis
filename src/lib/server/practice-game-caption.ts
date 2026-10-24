import { gamePlayerTitle, gamePlayers } from '../chess/game-player-title';
import drawSources from './draw-game-sources.json';
import skewerSources from './skewer-game-sources.json';
import type { GameReference } from '../chess/draw-game-viewer';

/** Only this small caption is sent with exercise cards, not the full game. */
export function practiceGameCaption(reference?: GameReference): string {
  if (!reference || reference.kind !== 'game') return '';
  const sources = (
    reference.collection === 'skewer' ? skewerSources : drawSources
  ) as Record<string, { headers: Record<string, string> }>;
  const headers = sources[reference.id]?.headers;
  if (!headers) return '';
  const year = headers.Date?.match(/^\d{4}/)?.[0];
  const event = headers.Event?.trim();
  return [year, event && !/^\?+$/.test(event) ? event : '']
    .filter(Boolean)
    .join(' · ');
}

export function practicePlayerTitle(reference?: GameReference): string {
  if (!reference || reference.kind !== 'game') return '';
  const sources = (
    reference.collection === 'skewer' ? skewerSources : drawSources
  ) as Record<string, { headers: Record<string, string> }>;
  const headers = sources[reference.id]?.headers;
  return headers ? gamePlayerTitle(headers) : '';
}

export function practicePlayers(reference?: GameReference) {
  if (!reference || reference.kind !== 'game') return [];
  const sources = (
    reference.collection === 'skewer' ? skewerSources : drawSources
  ) as Record<string, { headers: Record<string, string> }>;
  const headers = sources[reference.id]?.headers;
  return headers ? gamePlayers(headers) : [];
}
