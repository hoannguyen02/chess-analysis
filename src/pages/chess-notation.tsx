import Layout from '@/components/Layout';
import { Button } from 'flowbite-react';
import fs from 'fs';
import matter from 'gray-matter';
import { GetStaticProps } from 'next';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import path from 'path';
import { remark } from 'remark';
import breaks from 'remark-breaks'; // Import the plugin
import html from 'remark-html';

interface Props {
  content: string;
  title: string;
  description: string;
  locale: string;
}

const ChessNotationPage = ({ content, title, description, locale }: Props) => {
  const router = useRouter();
  const t = useTranslations();

  const pageTitle =
    locale === 'vi'
      ? 'Ký hiệu và cách viết biên bản cờ vua | LIMA Chess'
      : 'Chess Notation and Move Recording | LIMA Chess';

  const pageDescription =
    locale === 'vi'
      ? 'Tìm hiểu cách đọc và viết ký hiệu cờ vua với hướng dẫn dễ hiểu cho người mới. Hiểu các ký hiệu quân cờ, cách ghi nước đi cơ bản, ăn quân, chiếu, chiếu hết, nhập thành, phong cấp và bắt tốt qua đường. Cần thiết để nâng cao kỹ năng chơi cờ và chiến thuật của bạn'
      : 'Learn how to read and write chess notation with this beginner-friendly guide. Understand piece symbols, basic move recording, capturing, check, checkmate, castling, pawn promotion, and en passant. Essential for improving your chess gameplay and strategy.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDescription,
    publisher: {
      '@type': 'Organization',
      name: 'LIMA Chess',
      url: 'https://limachess.com',
    },
    inLanguage: locale,
  };

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content="https://limachess.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <Layout>
        <h1 className="font-bold text-[24px]">{title}</h1>
        <p className="my-4">{description}</p>
        <div className="flex flex-col md:flex-row gap-10 mt-6 items-center">
          <div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
            <Button
              id="learn-movement-and-capture-button"
              outline
              gradientDuoTone="cyanToBlue"
              size="lg"
              className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
              onClick={() => {
                window.dataLayer?.push({
                  event: 'learn-movement-and-capture-button',
                });
                router.push(process.env.NEXT_PUBLIC_LEARN_MORE_LINK!);
              }}
            >
              {t('common.title.learn-moves')}
            </Button>
          </div>
          <div className="flex justify-center max-w-[300px] w-full">
            <Image
              src="/images/board-and-pieces.png"
              alt="LIMA Chess - Board and pieces"
              width={300}
              height={300}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  // Load the correct Markdown file based on the locale
  const filePath = path.join(
    process.cwd(),
    'contents',
    `notation.${locale}.md`
  );
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Parse metadata and content
  const { data, content } = matter(fileContents);

  // Convert Markdown to HTML with remark-breaks for line breaks
  const processedContent = await remark()
    .use(breaks) // Use remark-breaks to convert single line breaks to <br>
    .use(html) // Convert Markdown to HTML
    .process(content);

  const contentHtml = processedContent.toString();

  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;

  return {
    props: {
      messages: { common: commonMessages },
      title: data.title,
      description: data.description,
      content: contentHtml,
      locale,
    },
  };
};

export default ChessNotationPage;
