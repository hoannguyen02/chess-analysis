// utils/withThemes.ts => Actually should rename to withSession
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
    const userAgent = ctx.req.headers['user-agent'] || '';
    const isMobile = /mobile/i.test(userAgent);

    const result = await handler(ctx, {
      isMobile,
    });

    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          isMobile,
        },
      };
    }

    return result;
  };
