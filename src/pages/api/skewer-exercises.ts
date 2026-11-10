import { privateHubPath } from '@/lib/server/private-hub';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { requirePracticeAccess } from '@/lib/server/practice-access';

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
    '@/lib/chess/skewer-exercises.json'
  );
  const {
    practiceGameCaption,
    practicePlayerTitle,
    practicePlayers,
    practiceGameOpening,
  } = await import('@/lib/server/practice-game-caption');
  const { includeManualExercises } = await import(
    '@/lib/server/manual-tactics'
  );
  return res.status(200).json(
    await includeManualExercises('/skewer', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'skewer',
          title: 'Đòn xiên',
          description:
            'Tấn công quân có giá trị cao hơn ở phía trước. Khi quân đó rời đường tấn công, quân phía sau có thể bị bắt.',
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
