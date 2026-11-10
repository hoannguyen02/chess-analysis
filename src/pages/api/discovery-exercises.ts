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
    '@/lib/server/discovery-exercises.json'
  );
  const { default: beginners } = await import(
    '@/lib/server/discovery-beginner-exercises.json'
  );
  const {
    practiceGameCaption,
    practicePlayerTitle,
    practicePlayers,
    practiceGameOpening,
  } = await import('@/lib/server/practice-game-caption');
  const items = ([...beginners, ...exercises] as DrawExercise[]).map(
    (exercise) => ({
      ...exercise,
      gameCaption: practiceGameCaption(exercise.gameReference),
      gameOpening: practiceGameOpening(exercise.gameReference),
      playerTitle: practicePlayerTitle(exercise.gameReference),
      players: practicePlayers(exercise.gameReference),
    })
  );
  const { includeManualExercises } = await import(
    '@/lib/server/manual-tactics'
  );
  return res.status(200).json(
    await includeManualExercises('/discovered-attack', {
      hubPath: privateHubPath(),
      categories: [
        {
          id: 'discovery',
          shortLabel: 'Tất cả',
          title: 'Chiếu mở và tấn công mở',
          description:
            'Di chuyển quân chắn đường để Xe, Tượng hoặc Hậu phía sau tấn công. Tính nước đáp rồi khai thác để thắng vật chất hoặc chiếu hết.',
          exercises: items,
        },
        {
          id: 'discovered-check',
          title: 'Chiếu mở',
          description:
            'Di chuyển quân chắn để quân phía sau chiếu Vua. Tận dụng nước chiếu để thắng vật chất hoặc chiếu hết.',
          exercises: items.filter((e) => e.discoveryKind === 'check'),
        },
        {
          id: 'discovered-attack',
          title: 'Tấn công mở',
          description:
            'Di chuyển quân chắn để quân phía sau tấn công một quân đối phương. Phối hợp hai quân để thu lợi về vật chất.',
          exercises: items.filter((e) => e.discoveryKind === 'attack'),
        },
      ],
    })
  );
}
