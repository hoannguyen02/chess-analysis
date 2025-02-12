import { DefaultLocale } from '@/constants';
import { ThemeModeScript } from 'flowbite-react';
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document(props: any) {
  return (
    <Html lang={props.locale || DefaultLocale}>
      <Head>
        <ThemeModeScript />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: any) => {
  const initialProps = await ctx.renderPage();
  const locale = ctx.req.locale as string; // Getting locale from request
  return { ...initialProps, locale };
};
