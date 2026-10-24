import { verifiedPlayerTitle } from './verified-player-titles';

export type GamePlayer = { name: string; title: string; rating: string };
export function gamePlayers(headers: Record<string, string>): GamePlayer[] {
  const players = (['White', 'Black'] as const).map((side) => {
    const name = headers[side]?.trim() ?? '';
    const title = headers[`${side}Title`]?.trim().toUpperCase();
    const knownTitle =
      title &&
      ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'].includes(title)
        ? title
        : verifiedPlayerTitle(name, headers.Date);
    const elo = headers[`${side}Elo`]?.trim();
    const rating =
      elo && /^\d{3,4}$/.test(elo) && Number(elo) > 0
        ? String(Number(elo))
        : '';
    return { name, title: knownTitle, rating };
  });
  return players.every((player) => player.name && !/^\?+$/.test(player.name))
    ? players
    : [];
}
export function gamePlayerTitle(headers: Record<string, string>): string {
  return gamePlayers(headers)
    .map(
      ({ name, title, rating }) =>
        `${title ? `${title} ` : ''}${name}${rating ? ` (${rating})` : ''}`
    )
    .join(' — ');
}
