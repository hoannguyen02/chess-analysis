import { requirePracticeAccess } from '@/lib/server/practice-access';
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
  const { default: sources } = await import(
    '@/lib/server/defensive-move-game-sources.json'
  );
  const { withGameOpenings } = await import(
    '@/lib/server/game-source-openings'
  );
  res.status(200).json(withGameOpenings(sources, 'defensive-move'));
}
