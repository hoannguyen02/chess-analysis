import type { DrawExercise } from '@/lib/chess/draw-practice';
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
  const { tacticsCatalog } = await import('@/lib/server/tactics-catalog');
  const theme = tacticsCatalog.themes.find(
    (t) => t.id === req.query.theme && !t.dedicatedPage
  );
  if (!theme) return res.status(404).json({ error: 'Không tìm thấy chủ đề.' });
  const { readManualTactics, manualExercise, includeManualExercises } =
    await import('@/lib/server/manual-tactics');
  const { includePracticeManagement } = await import(
    '@/lib/server/practice-management'
  );
  const { manualTopicPath, defensiveMoveTheme, mateInOneTheme } = await import(
    '@/lib/chess/manual-tactics'
  );
  if (theme.id === defensiveMoveTheme || theme.id === mateInOneTheme) {
    const isMateInOne = theme.id === mateInOneTheme;
    const [{ default: rows }, captions] = await Promise.all([
      isMateInOne
        ? import('@/lib/server/mate-in-one-exercises.json')
        : import('@/lib/server/defensive-move-exercises.json'),
      import('@/lib/server/practice-game-caption'),
    ]);
    return res.json(
      await includeManualExercises(manualTopicPath(theme), {
        hubPath: privateHubPath(),
        categories: [
          {
            id: theme.id,
            title: theme.label,
            description: isMateInOne
              ? 'Tìm một nước chiếu hết. Kiểm tra xem Vua đối phương có thể chạy, bắt quân chiếu hoặc che đường chiếu hay không.'
              : 'Hãy xác định đối phương đang dọa chiếu hết ở đâu. Tìm cách hóa giải rồi kiểm tra nước đáp nguy hiểm nhất.',
            exercises: (rows as DrawExercise[]).map((exercise) => ({
              ...exercise,
              gameCaption: captions.practiceGameCaption(exercise.gameReference),
              gameOpening: captions.practiceGameOpening(exercise.gameReference),
              playerTitle: captions.practicePlayerTitle(exercise.gameReference),
              players: captions.practicePlayers(exercise.gameReference),
            })),
          },
        ],
      })
    );
  }
  return res.json({
    hubPath: privateHubPath(),
    categories: await includePracticeManagement(manualTopicPath(theme), [
      {
        id: theme.id,
        title: theme.label,
        description: 'Tính phương án để đạt mục tiêu của thế cờ.',
        exercises: (await readManualTactics())
          .filter((e) => e.themeId === theme.id)
          .map(manualExercise),
      },
    ]),
  });
}
