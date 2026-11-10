import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';

/** Protected, read-only extraction from the registered local topic catalog. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (typeof req.query.scope !== 'string' || req.query.scope.length > 240)
    return res.status(400).json({ error: 'Chọn chủ đề hợp lệ.' });
  try {
    const { beginnerTacticCandidates } = await import(
      '@/lib/server/beginner-tactic-candidates'
    );
    res.setHeader('Cache-Control', 'private, no-store');
    return res
      .status(200)
      .json(await beginnerTacticCandidates(req.query.scope));
  } catch {
    return res
      .status(400)
      .json({ error: 'Không tải được nguồn cho chủ đề đã chọn.' });
  }
}
