import { requirePracticeAccess } from '@/lib/server/practice-access';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }
  const { default: sources } = await import(
    '@/lib/server/draw-game-sources.json'
  );
  res.status(200).json(sources);
}
