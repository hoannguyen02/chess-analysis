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
  const { default: beginnerExercises } = await import(
    '@/lib/chess/skewer-beginner-exercises.json'
  );
  const { default: queenExercises } = await import(
    '@/lib/server/queen-skewer-pilot.json'
  );
  const { default: queenIntroExercises } = await import(
    '@/lib/server/queen-skewer-intro.json'
  );
  const { practiceGameCaption, practicePlayerTitle, practicePlayers } =
    await import('@/lib/server/practice-game-caption');
  return res.status(200).json({
    hubPath: privateHubPath(),
    categories: [
      {
        id: 'skewer',
        title: 'Tìm đòn xiên',
        description:
          'Tấn công quân phía trước để khai thác quân phía sau trên cùng một đường. Bắt đầu với Nhập môn, rồi chọn mức A, B, C, C* hoặc D.',
        exercises: (
          [
            ...beginnerExercises,
            ...[...queenIntroExercises, ...queenExercises].map((exercise, i) => ({
              ...exercise,
              title: `Xiên Hậu · ${i + 1}`,
            })),
            ...exercises,
          ] as DrawExercise[]
        ).map((exercise) => ({
          ...exercise,
          gameCaption: practiceGameCaption(exercise.gameReference),
          playerTitle: practicePlayerTitle(exercise.gameReference),
          players: practicePlayers(exercise.gameReference),
        })),
      },
    ],
  });
}
