import type { DrawExercise } from '@/lib/chess/draw-practice';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath } from '@/lib/server/private-hub';
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
  const [
    { default: beginners },
    { default: exercises },
    {
      practiceGameCaption,
      practiceGameOpening,
      practicePlayerTitle,
      practicePlayers,
    },
    { includeManualExercises },
  ] = await Promise.all([
    import('@/lib/server/hanging-piece-beginner-exercises.json'),
    import('@/lib/server/hanging-piece-exercises.json'),
    import('@/lib/server/practice-game-caption'),
    import('@/lib/server/manual-tactics'),
  ]);
  return res.status(200).json(
    await includeManualExercises('/hanging-piece', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'hanging-piece',
          title: 'Bắt quân không được bảo vệ',
          description:
            'Quân treo là quân đang bị tấn công mà bạn có thể bắt có lợi vì đối phương không bảo vệ đủ. Trước khi bắt, hãy xem đối phương có thể bắt lại, chiếu Vua hoặc bắt một quân khác của bạn không.',
          exercises: ([...beginners, ...exercises] as DrawExercise[]).map(
            (exercise) => ({
              ...exercise,
              gameCaption: practiceGameCaption(exercise.gameReference),
              gameOpening: practiceGameOpening(exercise.gameReference),
              playerTitle: practicePlayerTitle(exercise.gameReference),
              players: practicePlayers(exercise.gameReference),
            })
          ),
        },
      ],
    })
  );
}
