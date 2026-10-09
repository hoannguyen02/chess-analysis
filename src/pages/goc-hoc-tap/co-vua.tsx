import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

export default function ChessLearningPage() {
  return (
    <>
      <Head>
        <title>Góc học tập · Cờ vua | LIMA</title>
        <meta
          name="description"
          content="Bài hướng dẫn và kinh nghiệm thi đấu cờ vua dành cho học sinh và phụ huynh LIMA."
        />
      </Head>
      <main
        lang="vi"
        className="min-h-[75vh] bg-[#f6f7f2] px-5 py-12 text-[#243b35] sm:py-16"
      >
        <div className="mx-auto max-w-[920px]">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#58734b]">
            Góc học tập
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Cờ vua</h1>
          <p className="mt-4 text-lg">
            Những điều con cần biết khi học và thi đấu cờ vua.
          </p>
          <Link
            href="/dan-do-truoc-giai-dau"
            className="group mt-10 block rounded-2xl border border-[#d8dfd0] bg-white p-6 transition hover:border-[#58734b] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#58734b] sm:p-8"
          >
            <span className="rounded-full bg-[#eaf0de] px-3 py-1 text-xs font-semibold text-[#58734b]">
              Dành cho kỳ thủ mới
            </span>
            <h2 className="mt-5 text-2xl font-bold">Cẩm nang thi đấu cờ vua</h2>
            <p className="mt-3 leading-relaxed text-[#53675f]">
              Chuẩn bị trước giờ thi, luật cần nhớ và cách giữ bình tĩnh trong
              từng ván đấu.
            </p>
            <span className="mt-6 inline-block font-semibold text-[#58734b] group-hover:underline">
              Đọc hướng dẫn →
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
