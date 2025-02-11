import { IncomingMessage, ServerResponse } from 'http';
import { getIronSession } from 'iron-session';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';

export const getSession = async (
  rq: IncomingMessage & {
    cookies: NextApiRequestCookies;
  },
  res: ServerResponse
) => {
  return await getIronSession<{
    username: string;
    role: string;
    id: string;
    permissions: Record<string, boolean>;
  }>(rq, res, {
    // Make sure it same as server side configuration
    cookieName: process.env.COOKIE_NAME!,
    password: process.env.SESSION_SECRET!,
    cookieOptions: {
      domain: process.env.NEXT_PUBLIC_BASE_URL,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    },
  });
};
