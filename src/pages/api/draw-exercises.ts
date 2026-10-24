import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath } from '@/lib/server/private-hub';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { drawCategories } = await import('@/lib/chess/draw-practice');
  const { gameReference } = await import('@/lib/chess/draw-game-reference');
  const { practiceGameCaption, practicePlayerTitle, practicePlayers } =
    await import('@/lib/server/practice-game-caption');
  return res.status(200).json({
    hubPath: privateHubPath(),
    categories: drawCategories.map((category) => ({
      ...category,
      exercises: category.exercises.map((exercise) => {
        const reference = gameReference(exercise.fen);
        return {
          ...exercise,
          gameReference: reference ?? null,
          gameCaption: practiceGameCaption(reference),
          playerTitle: practicePlayerTitle(reference),
          players: practicePlayers(reference),
        };
      }),
    })),
  });
}
