import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

const lifetime = 30 * 24 * 60 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest();
export const accessConfigured = () => Boolean(process.env.PRACTICE_PASSWORD);
export function passwordMatches(password: unknown): boolean {
  return (
    typeof password === 'string' &&
    password.length <= 256 &&
    accessConfigured() &&
    timingSafeEqual(digest(password), digest(process.env.PRACTICE_PASSWORD!))
  );
}
function signature(payload: string) {
  return createHmac(
    'sha256',
    digest(`practice-access:${process.env.PRACTICE_PASSWORD}`)
  )
    .update(payload)
    .digest('hex');
}
export function issueAccessToken(now = Date.now()): string {
  if (!accessConfigured())
    throw new Error('Practice password is not configured');
  const payload = `${now + lifetime}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${signature(payload)}`;
}
export function validAccessToken(token: unknown, now = Date.now()): boolean {
  if (!accessConfigured() || typeof token !== 'string') return false;
  const match = /^(\d{13})\.([a-f0-9]{48})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= now || Number(match[1]) > now + lifetime)
    return false;
  return timingSafeEqual(
    Buffer.from(match[3], 'hex'),
    Buffer.from(signature(`${match[1]}.${match[2]}`), 'hex')
  );
}
export function requirePracticeAccess(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const header = req.headers.authorization;
  if (
    !validAccessToken(header?.startsWith('Bearer ') ? header.slice(7) : null)
  ) {
    res.status(401).json({ error: 'Vui lòng nhập mật khẩu.' });
    return false;
  }
  return true;
}
