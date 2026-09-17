export const HISTORY_KEY = 'lima-english-shared-history-v1';
export type SharedBookmark = {
  shareId: string;
  title: string;
  link: string;
  lastOpened: string;
};
export function parseSharedHistory(raw: unknown): SharedBookmark[] {
  if (!Array.isArray(raw) || raw.length > 200)
    throw new Error('Invalid shared lesson history.');
  return raw.map((entry) => {
    if (
      !entry ||
      typeof entry.shareId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(entry.shareId) ||
      typeof entry.title !== 'string' ||
      !entry.title ||
      entry.title.length > 120 ||
      typeof entry.link !== 'string' ||
      entry.link.length > 16100 ||
      !/^\/english-practice\/learn#lesson=v1\.[A-Za-z0-9_-]+$/.test(
        entry.link
      ) ||
      typeof entry.lastOpened !== 'string' ||
      !Number.isFinite(Date.parse(entry.lastOpened))
    )
      throw new Error('Invalid shared lesson bookmark.');
    return {
      shareId: entry.shareId,
      title: entry.title,
      link: entry.link,
      lastOpened: entry.lastOpened,
    };
  });
}
export function rememberSharedLesson(
  entries: SharedBookmark[],
  entry: SharedBookmark
): SharedBookmark[] {
  return [
    entry,
    ...entries.filter((item) => item.shareId !== entry.shareId),
  ].slice(0, 200);
}
export function readSharedHistory(): SharedBookmark[] {
  return parseSharedHistory(
    JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  );
}
