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
    '@/lib/server/pin-exercises.json'
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
    await includeManualExercises('/pin', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'pin',
          title: 'Đòn ghim',
          description:
            'Ghim quân đối phương vào Vua hoặc quân có giá trị cao hơn ở phía sau. Quân bị ghim vào Vua không được rời đường ghim nếu làm lộ chiếu; với ghim vào quân khác, cần tính cả khả năng phản công.',
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
