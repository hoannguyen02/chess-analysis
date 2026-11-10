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
    '@/lib/server/passed-pawn-simplification-game-sources.json'
  );
  const { withGameOpenings } = await import(
    '@/lib/server/game-source-openings'
  );
  return res.status(200).json(withGameOpenings(sources, 'simplification'));
}
