import type { DrawCategory } from '@/lib/chess/draw-practice';
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
  const { default: categories } = await import(
    '@/lib/server/promotion-exercises.json'
  );
  const {
    practiceGameCaption,
    practicePlayerTitle,
    practicePlayers,
    practiceGameOpening,
  } = await import('@/lib/server/practice-game-caption');
  return res.status(200).json({
    hubPath: privateHubPath(),
    categories: (categories as DrawCategory[]).map((category) => ({
      ...category,
      exercises: category.exercises.map((exercise) => ({
        ...exercise,
        gameCaption: practiceGameCaption(exercise.gameReference),
        gameOpening: practiceGameOpening(exercise.gameReference),
        playerTitle: practicePlayerTitle(exercise.gameReference),
        players: practicePlayers(exercise.gameReference),
      })),
    })),
  });
}
