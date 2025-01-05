// utils/withThemes.ts
import axios from 'axios';
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
    const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;

    // If themes are not available, fetch them
    if (!themes) {
      try {
        const { data } = await axios.get(`${apiDomain}/v1/puzzle-themes`);
        themes = data;

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

    const result = await handler(ctx, { themes, apiDomain });

    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          themes,
          apiDomain,
        },
      };
    }

    return result;
  };
