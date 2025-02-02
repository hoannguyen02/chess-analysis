import { LimaBenefits } from '@/components/LimaBenefits';
import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/router';

export const GuestHomeScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  return (
    <div className="flex flex-col mt-6 w-full px-4">
      <div className="flex flex-col items-center justify-center mb-4">
        <h1 className="sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-center gradient-text">
          {t('home.headline')}
        </h1>
        <h4 className="mt-6 text-lg font-semibold">🚀 {t('home.heading')}</h4>
        <LimaBenefits />
        <Button
          outline
          gradientDuoTone="pinkToOrange"
          size="lg"
          className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
          onClick={() => router.push('/register-guide')}
        >
          {t('common.button.join-now')}
        </Button>
      </div>
      {/* Chess Puzzle Section */}
      <div className="flex flex-col md:flex-row gap-10 mt-6 items-center">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-2xl font-bold mb-3">{t('home.puzzle-title')}</h3>
          <p className="text-lg text-gray-700">
            {t('home.puzzle-description')}
          </p>
          <span className="mt-2 text-gray-500 text-sm">
            🔥 {t('home.puzzle-difficulty', { level: 'Intermediate' })}
          </span>
          <Button
            outline
            gradientDuoTone="cyanToBlue"
            size="lg"
            className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
            onClick={() =>
              router.push(`/solve-puzzles/679eecd1e162bcfe06b7dbd5`)
            }
          >
            {t('home.solve-puzzles')}
          </Button>
        </div>
        <div className="flex justify-center w-full">
          <Image
            src="/images/lima-chess-puzzle.svg"
            alt="Chess Puzzle"
            width={400}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* Chess Lesson Section - Reverse Order on Mobile */}
      <div className="flex flex-col md:flex-row-reverse gap-10 mt-10 items-center">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-2xl font-bold mb-3">{t('home.lesson-title')}</h3>
          <p className="text-lg text-gray-700">
            {t('home.lesson-description')}
          </p>
          <Button
            outline
            gradientDuoTone="greenToBlue"
            size="lg"
            className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
            onClick={() => router.push('/tactics')}
          >
            {t('home.view-lessons')}
          </Button>
        </div>
        <div className="flex justify-center w-full">
          <Image
            src="/images/lima-chess-lesson.svg"
            alt="Chess Lesson"
            width={400}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
};
