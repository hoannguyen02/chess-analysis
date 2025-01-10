import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const Footer = () => {
  const t = useTranslations();
  return (
    <footer
      style={{
        padding: '1rem',
      }}
    >
      <div className="flex justify-center mb-4 mt-8">
        <ul className="flex gap-2">
          <li className="p-0">
            <Link className="hover:text-[var(--s-bg)]" href="/privacy-policy">
              {t('navigation.privacy')}
            </Link>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <Link className="hover:text-[var(--s-bg)]" href="/terms-of-service">
              {t('navigation.terms')}
            </Link>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <Link className="hover:text-[var(--s-bg)]" href="/contact">
              {t('navigation.contact')}
            </Link>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <Link className="hover:text-[var(--s-bg)]" href="/about">
              {t('navigation.about')}
            </Link>
          </li>
        </ul>
      </div>
      <p className="text-center">
        © {new Date().getFullYear()} LIMA Chess. All Rights Reserved.
      </p>
    </footer>
  );
};
