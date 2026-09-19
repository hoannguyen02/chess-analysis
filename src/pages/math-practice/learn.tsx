import Head from 'next/head';
import SharedMathLesson from '@/components/math/SharedMathLesson';
export default function SharedMathPage() {
  return (
    <>
      <Head>
        <title>Bài học được chia sẻ · LIMA Math</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <SharedMathLesson />
    </>
  );
}
