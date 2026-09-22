import Head from 'next/head';
import SharedMathLesson from '@/components/math/SharedMathLesson';
import { isMathPracticeEnabled } from '@/lib/math/availability';
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

export async function getServerSideProps() {
  return isMathPracticeEnabled() ? { props: {} } : { notFound: true };
}
