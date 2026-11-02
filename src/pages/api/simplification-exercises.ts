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
    '@/lib/server/simplification-exercises.json'
  );
  const {
    practiceGameCaption,
    practicePlayerTitle,
    practicePlayers,
    practiceGameOpening,
  } = await import('@/lib/server/practice-game-caption');
  return res.status(200).json({
    hubPath: privateHubPath(),
    categories: [
      {
        id: 'simplification',
        title: 'Đơn giản hóa',
        description:
          'Đổi quân để chuyển sang thế cờ dễ xử lý hơn. Trước khi đổi, hãy đánh giá tàn cuộc còn lại: có thắng được hoặc giữ hòa không?',
        exercises: (exercises as DrawExercise[]).map((exercise) => ({
          ...exercise,
          gameCaption: practiceGameCaption(exercise.gameReference),
          gameOpening: practiceGameOpening(exercise.gameReference),
          playerTitle: practicePlayerTitle(exercise.gameReference),
          players: practicePlayers(exercise.gameReference),
        })),
      },
    ],
  });
}
