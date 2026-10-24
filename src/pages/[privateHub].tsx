import PrivateContent from '@/components/PrivateContent';
import styles from '@/styles/TournamentNotice.module.css';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowUpRight, FiGrid } from 'react-icons/fi';

type HubData = {
  hubPath: string;
  pages: { href: string; title: string; description: string }[];
};

export default function PrivateHubPage() {
  return (
    <>
      <Head>
        <title>Khu vực riêng | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <PrivateContent<HubData> endpoint="/api/private-pages" hub>
            {({ pages }) => (
              <nav
                aria-label="Các trang riêng"
                className="grid gap-4 sm:grid-cols-2"
              >
                {pages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    prefetch={false}
                    className="group rounded-xl border border-[#dde4d9] bg-white p-6 transition hover:border-[#486b42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <div className="flex items-center justify-between text-[#355b29]">
                      <FiGrid size={22} aria-hidden="true" />
                      <FiArrowUpRight size={20} aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">{page.title}</h2>
                    <p className="mt-2 text-sm text-[#606957]">
                      {page.description}
                    </p>
                  </Link>
                ))}
              </nav>
            )}
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
