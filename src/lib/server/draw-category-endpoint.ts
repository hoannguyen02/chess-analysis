import type { NextApiRequest, NextApiResponse } from 'next';
import { drawThemeLinks } from '@/lib/chess/draw-practice-view';
import { requirePracticeAccess } from './practice-access';
import { privateHubPath } from './private-hub';

/** Build a protected API handler for one Draw theme route and worksheet source. */
export function createDrawCategoryHandler(categoryId: string) {
  return async function drawCategoryHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (!requirePracticeAccess(req, res)) return;
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).end();
    }

    const [practice, references, captions] = await Promise.all([
      import('@/lib/chess/draw-practice'),
      import('@/lib/chess/draw-game-reference'),
      import('@/lib/server/practice-game-caption'),
    ]);
    const category = practice.drawCategories.find(
      (item) => item.id === categoryId
    );
    if (!category) return res.status(404).end();

    const categories = [
      {
        ...category,
        exercises: category.exercises.map((exercise) => {
          const reference = references.gameReference(exercise.fen);
          return {
            ...exercise,
            gameReference: reference ?? null,
            gameCaption: captions.practiceGameCaption(reference),
            gameOpening: captions.practiceGameOpening(reference),
            playerTitle: captions.practicePlayerTitle(reference),
            players: captions.practicePlayers(reference),
          };
        }),
      },
    ];
    return res.status(200).json({
      hubPath: privateHubPath(),
      categories,
      themeLinks: drawThemeLinks(practice.drawCategories),
    });
  };
}
