// utils/withThemes.ts
import axiosInstance from '@/utils/axiosInstance';
import { getSession } from '@/utils/getSession';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import nookies from 'nookies';

type WithThemesHandler = (
  ctx: GetServerSidePropsContext,
  themes: any
) => Promise<GetServerSidePropsResult<any>>;

export const withThemes =
  (handler: WithThemesHandler): GetServerSideProps =>
  async (ctx) => {
    // Get themes from cookies
    const cookies = nookies.get(ctx);

    let themes = cookies.themes ? JSON.parse(cookies.themes) : null;
    let tags = cookies.tags ? JSON.parse(cookies.tags) : null;
    const apiDomain = process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN;

    // If themes are not available, fetch them
    if (!themes) {
      try {
        const { data } = await axiosInstance.get(
          `${apiDomain}/v1/puzzle-themes`
        );
        themes = data.items;

        // Store themes in cookies
        nookies.set(ctx, 'themes', JSON.stringify(themes), {
          httpOnly: false, // Accessible by JavaScript
          maxAge: 60 * 60, // 1 hour
          path: '/', // Available for all routes
        });
      } catch (error) {
        console.error('Error fetching themes:', error);
        themes = [];
      }
    }

    if (!tags) {
      try {
        const { data: data } = await axiosInstance.get(`${apiDomain}/v1/tags`);
        tags = data.items;
        // Store tags in cookies
        nookies.set(ctx, 'tags', JSON.stringify(tags), {
          httpOnly: false, // Accessible by JavaScript
          maxAge: 60 * 60, // 1 hour
          path: '/', // Available for all routes
        });
      } catch (error) {
        console.error('Error fetching tags:', error);
        tags = [];
      }
    }

    const userAgent = ctx.req.headers['user-agent'] || '';
    const isMobile = /mobile/i.test(userAgent);

    const session = await getSession(ctx.req, ctx.res);

    const result = await handler(ctx, {
      themes,
      apiDomain,
      tags,
      isMobile,
      session: {
        id: session.id,
        role: session.role,
        username: session.username,
        isManageCourses: session.permissions.write_courses,
        isManageUsers: session.permissions.user_accounts,
      },
    });

    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          themes,
          tags,
          apiDomain,
          isMobile,
          session: {
            id: session.id,
            role: session.role,
            username: session.username,
            isManageCourses: session.permissions.write_courses,
            isManageUsers: session.permissions.user_accounts,
          },
        },
      };
    }

    return result;
  };
