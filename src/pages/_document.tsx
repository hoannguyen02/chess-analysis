import { DefaultLocale } from '@/constants';
import { schemaData } from '@/utils/schemaData';
import { Analytics } from '@vercel/analytics/next';
import { ThemeModeScript } from 'flowbite-react';
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document(props: any) {
  return (
    <Html lang={props.locale || DefaultLocale}>
      <Head>
        <meta name="title" content="A dedicated chess academy | LIMA Chess" />
        <meta
          name="description"
          content="LIMA Chess is a dedicated chess academy focused on helping students develop strong thinking skills, confidence, and discipline through structured training. We offer engaging lessons for all levels, from beginners to advanced players, with a focus on tactics, strategy, and real-game improvement. Our programs combine practical learning, puzzle training, and guided coaching to help students achieve consistent progress and success in tournaments."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
        <ThemeModeScript />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
        <Analytics />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: any) => {
  const initialProps = await ctx.renderPage();
  const locale = ctx.req.locale as string; // Getting locale from request
  return { ...initialProps, locale };
};
