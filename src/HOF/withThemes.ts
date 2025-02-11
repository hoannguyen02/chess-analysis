// utils/withThemes.ts => Actually should rename to withSession
import { getSession } from '@/utils/getSession';
import isEmpty from 'lodash/isEmpty';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';

type WithThemesHandler = (
  ctx: GetServerSidePropsContext,
  themes: any
) => Promise<GetServerSidePropsResult<any>>;

export const withThemes =
  (handler: WithThemesHandler): GetServerSideProps =>
  async (ctx) => {
    const apiDomain = process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN;

    const userAgent = ctx.req.headers['user-agent'] || '';
    const isMobile = /mobile/i.test(userAgent);

    const session = await getSession(ctx.req, ctx.res);

    let customSession = null;
    if (!isEmpty(session)) {
      customSession = {
        id: session.id,
        role: session.role,
        username: session.username,
      };
    }

    const result = await handler(ctx, {
      apiDomain,
      isMobile,
      session: customSession,
    });

    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          apiDomain,
          isMobile,
          session: customSession,
        },
      };
    }

    return result;
  };
