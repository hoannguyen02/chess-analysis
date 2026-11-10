import { practiceAccessHeaders } from '../practice-access';
import type { DrawCategory } from './draw-practice';
import { practicePositionKey } from './practice-position-key';
import { worksheetTopicsFromLibrary } from './worksheet';

type PracticeCatalog = { href: string; title: string; worksheetEndpoint?: string };

export async function otherPracticeTopics(fen: string, scope: string) {
  async function get<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint, {
      headers: practiceAccessHeaders(),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Không kiểm tra được thế cờ trùng. Hãy thử lại.');
    return response.json();
  }
  const key = practicePositionKey(fen);
  const { pages } = await get<{ pages: PracticeCatalog[] }>('/api/private-pages');
  const topics = worksheetTopicsFromLibrary(pages).filter(
    (topic) => topic.id !== scope.replace(/^\//, '')
  );
  const matches = [];
  for (let start = 0; start < topics.length; start += 6) {
    const batch = await Promise.all(topics.slice(start, start + 6).map(async (page) => {
      const { categories } = await get<{ categories: DrawCategory[] }>(page.endpoint);
      return categories.some((category) => category.exercises.some(
        (exercise) => practicePositionKey(exercise.fen) === key
      )) ? page.title : null;
    }));
    matches.push(...batch.filter((title): title is string => Boolean(title)));
  }
  return matches;
}
