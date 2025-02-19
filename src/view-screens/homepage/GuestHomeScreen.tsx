import { useAppContext } from '@/contexts/AppContext';
import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

export const GuestHomeScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useAppContext();
  const pageTitle = `${t('home.headline')} | LIMA Chess`;

  const pageDescription =
    locale === 'vi'
      ? 'Tự tin chinh phục mọi giải đấu trong nước và quốc tế NHANH NHẤT với chi phí RẺ NHẤT. LIMA Chess giúp phát triển tư duy chiến lược, chiến thuật, nâng cao trình độ mỗi ngày.'
      : 'Master chess tournaments domestically and internationally in the FASTEST way at the LOWEST cost. LIMA Chess enhances strategic and tactical thinking, improving your skills every day.';

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

  const getStarted = () => {
    window.dataLayer?.push({
      event: 'homepage-get-started-button',
    });
    router.push(process.env.NEXT_PUBLIC_LEARN_MORE_LINK!);
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
      <div className="flex flex-col mt-6 w-full lg:px-4">
        <div className="flex flex-col items-center justify-center mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center gradient-text">
            {t('home.headline')}
          </h1>
          <Button
            id="homepage-register-button"
            outline
            gradientDuoTone="pinkToOrange"
            size="lg"
            className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
            onClick={getStarted}
          >
            {t('common.button.get-started')}
          </Button>
        </div>
        {/* Chess Puzzle Section */}
        <div className="flex flex-col md:flex-row gap-10 mt-6 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-2xl font-bold mb-3">
              {t('home.puzzle-title')}
            </h3>
            <p className="text-lg text-gray-700">
              {t('home.puzzle-description')}
            </p>
            <span className="mt-2 text-gray-500 text-sm">
              🔥 {t('home.puzzle-difficulty')}
            </span>
            <Button
              id="homepage-solve-puzzle-button"
              outline
              gradientDuoTone="cyanToBlue"
              size="lg"
              className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
              onClick={() => {
                window.dataLayer?.push({
                  event: 'homepage-solve-puzzle-button',
                });
                router.push(
                  `/solve-puzzles/${process.env.NEXT_PUBLIC_SOLVE_PUZZLE_ID}`
                );
              }}
            >
              {t('home.solve-puzzles')}
            </Button>
          </div>
          <div className="flex justify-center w-full">
            <Image
              src="/images/lima-chess-puzzle.png"
              alt="LIMA Chess Puzzle"
              width={400}
              height={400}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Chess Lesson Section - Reverse Order on Mobile */}
        <div className="flex flex-col md:flex-row-reverse gap-10 mt-10 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-2xl font-bold mb-3">
              {t('home.lesson-title')}
            </h3>
            <p className="text-lg text-gray-700">
              {t('home.lesson-description')}
            </p>
            <Button
              id="homepage-view-lessons-button"
              outline
              gradientDuoTone="greenToBlue"
              size="lg"
              className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
              onClick={() => {
                window.dataLayer?.push({
                  event: 'homepage-view-lessons-button',
                });
                router.push(process.env.NEXT_PUBLIC_VIEW_LESSONS!);
              }}
            >
              {t('home.view-lessons')}
            </Button>
          </div>
          <div className="flex justify-center w-full">
            <Image
              src="/images/lima-chess-lesson.png"
              alt="LIMA Chess Lesson"
              width={400}
              height={400}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </>
  );
};
