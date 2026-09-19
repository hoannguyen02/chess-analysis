import Brand from './Brand';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const MenuLeft = () => {
  const t = useTranslations('common');

  return (
    <nav
      className="flex flex-col w-full h-full bg-[var(--p-bg)] text-white p-[1rem] pb-0]
    "
    >
      <div className="mb-6">
        <Brand />
      </div>
      <Link
        href="https://www.youtube.com/@LIMAChess?sub_confirmation=1"
        rel="noopener noreferrer"
        target="_blank"
        className="mb-2 hover:text-[var(--p-highlight)]"
      >
        {t('navigation.youtube')}
      </Link>
      <Link href="/analysis" className="mb-2 hover:text-[var(--p-highlight)]">
        {t('navigation.analysis')}
      </Link>
      <Link href="/team-rank" className="mb-2 hover:text-[var(--p-highlight)]">
        {t('navigation.team-rank')}
      </Link>
      <Link
        href="/setup-board"
        className="mb-2 hover:text-[var(--p-highlight)]"
      >
        {t('navigation.setup-board')}
      </Link>
      <Link
        href="/english-practice"
        className="mb-2 hover:text-[var(--p-highlight)]"
      >
        {t('navigation.english-practice')}
      </Link>
      <Link
        href="/math-practice"
        className="mb-2 hover:text-[var(--p-highlight)]"
      >
        {t('navigation.math-practice')}
      </Link>
    </nav>
  );
};
