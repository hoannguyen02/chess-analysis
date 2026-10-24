import { privateReturnPath } from '@/lib/private-navigation';
import { privateHubPath, privatePages } from '@/lib/server/private-hub';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  accessConfigured,
  passwordMatches,
  issueAccessToken,
} from '@/lib/server/practice-access';

// Per-instance throttling, with bounded memory. Add edge rate limiting for larger deployments.
const attempts = new Map<string, { count: number; until: number }>();
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!accessConfigured())
    return res
      .status(503)
      .json({ error: 'Chưa thiết lập mật khẩu giáo viên.' });
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until <= now) attempts.delete(key);
  const ip = req.socket.remoteAddress ?? 'unknown';
  const attempt = attempts.get(ip) ?? { count: 0, until: now + 15 * 60 * 1000 };
  if (attempt.count >= 10 || (!attempts.has(ip) && attempts.size >= 10000)) {
    res.setHeader('Retry-After', '900');
    return res
      .status(429)
      .json({ error: 'Thử quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
  }
  attempt.count++;
  attempts.set(ip, attempt);
  if (!passwordMatches(req.body?.password))
    return res.status(401).json({ error: 'Mật khẩu không đúng.' });
  attempts.delete(ip);
  const hub = privateHubPath();
  return res.status(200).json({
    token: issueAccessToken(),
    redirectTo: privateReturnPath(
      req.body?.next,
      req.body?.locale,
      [...privatePages.map((page) => page.href), ...(hub ? [hub] : [])],
      hub || '/skewer'
    ),
  });
}
export const config = { api: { bodyParser: { sizeLimit: '1kb' } } };
