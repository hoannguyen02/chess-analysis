import Head from 'next/head';
import type { GetStaticProps } from 'next';
import PrivateContent from '@/components/PrivateContent';
import WorksheetBuilder from '@/components/WorksheetBuilder';
import { worksheetTopicsFromLibrary } from '@/lib/chess/worksheet';
import type { LibraryPage } from '@/components/PracticeLibrary';
export default function WorksheetsPage() {
  return (
    <>
      <Head>
        <title>Tạo phiếu bài tập | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className="mx-auto max-w-6xl p-4">
        <PrivateContent<{
          hubPath: string;
          pages: LibraryPage[];
        }> endpoint="/api/private-pages">
          {({ pages }) => (
            <WorksheetBuilder topics={worksheetTopicsFromLibrary(pages)} />
          )}
        </PrivateContent>
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
