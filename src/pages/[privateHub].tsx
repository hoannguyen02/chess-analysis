import PrivateContent from '@/components/PrivateContent';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import PracticeLibrary, {
  type LibraryPage,
} from '@/components/PracticeLibrary';

type HubData = {
  hubPath: string;
  pages: LibraryPage[];
};

export default function PrivateHubPage() {
  return (
    <>
      <Head>
        <title>Thư viện học cờ | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<HubData> endpoint="/api/private-pages" hub>
            {({ pages }) => <PracticeLibrary pages={pages} />}
          </PrivateContent>
        </article>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale,
  res,
}) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const { matchesPrivateHub } = await import('@/lib/server/private-hub');
  if (!matchesPrivateHub(params?.privateHub)) return { notFound: true };
  return {
    props: {
      messages: {
        common: (await import(`@/locales/${locale || 'vi'}/common.json`))
          .default,
      },
    },
  };
};
