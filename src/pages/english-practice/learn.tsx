import Head from 'next/head';
import SharedLesson from '@/components/english/SharedLesson';

export default function SharedEnglishLessonPage() {
  return (
    <>
      <Head>
        <title>Shared English lesson · LIMA</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <SharedLesson />
    </>
  );
}
