import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath, privatePages } from '@/lib/server/private-hub';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { readManualTactics, manualTopicPages } = await import(
    '@/lib/server/manual-tactics'
  );
  const { readPracticeAdjustments } = await import(
    '@/lib/server/practice-management'
  );
  const additional = manualTopicPages(
    await readManualTactics(),
    await readPracticeAdjustments()
  ).filter((p) => !privatePages.some((page) => page.href === p.href));
  return res.status(200).json({
    hubPath: privateHubPath(),
    pages: [...privatePages, ...additional],
  });
}
