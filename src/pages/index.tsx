// pages/index.tsx
import Layout from '@/components/Layout';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { withThemes } from '@/HOF/withThemes';
import axiosInstance, { setAxiosLocale } from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Button, Dropdown } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToast();
  const { session, locale, apiDomain } = useAppContext();

  const [puzzleRating, setPuzzleRating] = useState(1200);
  const [puzzleStreak, setPuzzleStreak] = useState(0);
  const [recentCourses, setRecentCourses] = useState([]);

  // // Fetch user stats when logged in
  // useEffect(() => {
  //   if (session?.username) {
  //     fetchUserStats();
  //   }
  // }, [session]);

  // const fetchUserStats = async () => {
  //   try {
  //     const response = await axiosInstance.get(`${apiDomain}/v1/user/stats`);
  //     setPuzzleRating(response.data.puzzleRating || 1200);
  //     setPuzzleStreak(response.data.puzzleStreak || 0);
  //     setRecentCourses(response.data.recentCourses || []);
  //   } catch (error) {
  //     console.error('Error fetching user stats:', error);
  //   }
  // };

  const handleLogout = useCallback(async () => {
    const result = await handleSubmission(
      async () => {
        setAxiosLocale(locale);
        return await axiosInstance.post(`${apiDomain}/v1/auth/logout`);
      },
      addToast,
      t('common.title.logout-success')
    );
    if (result !== undefined) {
      router.push('/');
    }
  }, [addToast, apiDomain, locale, router, t]);

  return (
    <Layout>
      {session?.username ? (
        <div className="flex flex-col">
          <div className="my-4 flex justify-end">
            <Dropdown label={t('common.title.profile')}>
              <Dropdown.Item onClick={() => router.push('/change-password')}>
                {t('common.navigation.change-password')}
              </Dropdown.Item>
              <Dropdown.Item onClick={handleLogout}>
                {t('common.navigation.logout')}
              </Dropdown.Item>
            </Dropdown>
          </div>

          {/* Main Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Puzzle Rating Block */}
            <div className="bg-white shadow-lg p-6 rounded-lg">
              <h2 className="text-lg font-semibold">
                {t('home.puzzle-rating')}
              </h2>
              <p className="text-gray-600">
                {t('home.current-rating')}: <strong>{puzzleRating}</strong>
              </p>
              <p className="text-gray-600">
                {t('home.puzzle-streak')}: <strong>{puzzleStreak} days</strong>
              </p>

              {/* Buttons for Solve & Practice */}
              <div className="mt-4 flex space-x-4">
                <Link href="/puzzles">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    {t('home.solve-puzzles')}
                  </button>
                </Link>
                <Link href="/practice">
                  <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
                    {t('home.practice-mode')}
                  </button>
                </Link>
              </div>
            </div>

            {/* Next Course Block */}
            <div className="bg-white shadow-lg p-6 rounded-lg">
              <h2 className="text-lg font-semibold">{t('home.next-course')}</h2>
              <p className="text-gray-600">
                {t('home.course-title')}:{' '}
                <strong>Intermediate Checkmates</strong>
              </p>
              <Link href="/courses">
                <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                  {t('home.continue-course')}
                </button>
              </Link>
            </div>
          </div>

          {/* Show More Stats Section */}
          <div className="mt-6 bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{t('home.more-stats')}</h2>

            {/* Recently Completed Courses */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold">
                {t('home.recent-courses')}
              </h3>
              {recentCourses.length > 0 ? (
                <ul className="list-disc pl-5 mt-2">
                  {recentCourses.map((course) => (
                    <li
                      key={course.id}
                      className="text-blue-500 hover:underline"
                    >
                      <Link href={`/courses/${course.id}`}>{course.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t('home.no-recent-courses')}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-6 w-full px-4">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-center gradient-text">
            {t('home.headline')}
          </h1>
          <h4 className="mt-6 text-lg font-semibold">
            🚀 {t('home.benefits.heading')}
          </h4>
          <ul className="mt-2 text-gray-700 text-lg space-y-2">
            <li>✅ {t('home.benefits.learn-fast')}</li>
            <li>✅ {t('home.benefits.lowest-price')}</li>
            <li>✅ {t('home.benefits.support')}</li>
            <li>✅ {t('home.benefits.easy-started')}</li>
          </ul>
          <Button
            outline
            gradientDuoTone="pinkToOrange"
            size="lg"
            className="mt-4 font-semibold"
            onClick={() => router.push('/register-guide')}
          >
            {t('common.button.buy-now')}
          </Button>
        </div>
      )}
    </Layout>
  );
}
export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    const commonMessages = (await import(`@/locales/${locale}/common.json`))
      .default;
    const homeMessages = (await import(`@/locales/${locale}/home.json`))
      .default;
    return {
      props: {
        messages: {
          common: commonMessages,
          home: homeMessages,
        },
      },
    };
  }
);
