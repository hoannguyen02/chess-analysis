import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const Footer = () => {
  const t = useTranslations('common');

  return (
    <footer className="py-6 bg-gray-100 text-gray-700 text-sm mt-auto">
      {/* Social Links */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-4 border-b pb-4 border-gray-300">
        <a
          href="https://www.facebook.com/limachess102"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 flex items-center gap-2"
        >
          📘 {t('navigation.facebook')}
        </a>
        <a
          href="https://www.youtube.com/@LIMAChess"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-red-600 flex items-center gap-2"
        >
          ▶️ {t('navigation.youtube')}
        </a>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4 max-w-4xl mx-auto">
        <Link href="/privacy-policy" className="hover:text-gray-900">
          {t('navigation.privacy')}
        </Link>
        <Link href="/terms-of-service" className="hover:text-gray-900">
          {t('navigation.terms')}
        </Link>
        <Link href="/contact" className="hover:text-gray-900">
          {t('navigation.contact')}
        </Link>
        <Link href="/about" className="hover:text-gray-900">
          {t('navigation.about')}
        </Link>
      </div>

      {/* Copyright */}
      <p className="text-center text-xs mt-6">
        © {new Date().getFullYear()} LIMA Chess. All Rights Reserved.
      </p>
    </footer>
  );
};
