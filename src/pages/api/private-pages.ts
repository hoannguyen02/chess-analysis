import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath, privatePages } from '@/lib/server/private-hub';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  return res
    .status(200)
    .json({ hubPath: privateHubPath(), pages: privatePages });
}
