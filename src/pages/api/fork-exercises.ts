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
  if (req.query?.beginnerCandidates === '1') {
    const { forkBeginnerCandidates } = await import(
      '@/lib/server/fork-beginner-candidates'
    );
    return res.status(200).json(await forkBeginnerCandidates());
  }
  const { default: exercises } = await import(
    '@/lib/server/fork-exercises.json'
  );
  const { default: beginners } = await import(
    '@/lib/server/fork-beginner-exercises.json'
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
    await includeManualExercises('/fork', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'fork',
          title: 'Tấn công đôi',
          description:
            'Dùng một quân tấn công đồng thời hai hoặc nhiều mục tiêu. Tính nước đáp của đối phương và khả năng bắt lại trước khi kết luận có lợi thế vật chất.',
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
