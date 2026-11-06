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
  const { readManualTactics, manualExercise } = await import(
    '@/lib/server/manual-tactics'
  );
  const { includePracticeManagement } = await import(
    '@/lib/server/practice-management'
  );
  const { manualTopicPath } = await import('@/lib/chess/manual-tactics');
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
