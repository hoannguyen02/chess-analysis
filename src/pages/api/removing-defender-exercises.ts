import { privateHubPath } from '@/lib/server/private-hub';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { default: exercises } = await import(
    '@/lib/server/removing-defender-exercises.json'
  );
  const {
    practiceGameCaption,
    practiceGameOpening,
    practicePlayerTitle,
    practicePlayers,
  } = await import('@/lib/server/practice-game-caption');
  const { includeManualExercises } = await import(
    '@/lib/server/manual-tactics'
  );
  return res.status(200).json(
    await includeManualExercises('/removing-defender', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'removing-defender',
          title: 'Loại bỏ quân bảo vệ',
          description:
            'Tìm quân đang bảo vệ mục tiêu. Tính cách loại bỏ quân đó và kiểm tra các nước đáp trước khi bắt mục tiêu hoặc thực hiện đe dọa.',
          exercises: (exercises as DrawExercise[]).map((exercise) => ({
            ...exercise,
            gameCaption: practiceGameCaption(exercise.gameReference),
            gameOpening: practiceGameOpening(exercise.gameReference),
            playerTitle: practicePlayerTitle(exercise.gameReference),
            players: practicePlayers(exercise.gameReference),
          })),
        },
      ],
    })
  );
}
