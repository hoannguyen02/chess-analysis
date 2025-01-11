import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const Footer = () => {
  const t = useTranslations('common');
  return (
    <footer className="py-[1rem] flex justify-center flex-col">
      <div className="grid lg:grid-cols-2 lg:w-[600px] lg:mx-auto mb-4 lg:mt-8 lg:gap-4 gap-2">
        <ul className="flex justify-around">
          <li className="p-0">
            <Link className="hover:text-[var(--s-bg)]" href="/privacy-policy">
              {t('navigation.privacy')}
            </Link>
          </li>
          <li className="">
            <Link className="hover:text-[var(--s-bg)]" href="/terms-of-service">
              {t('navigation.terms')}
            </Link>
          </li>
        </ul>
        <ul className="flex justify-around">
          <li className="">
            <Link className="hover:text-[var(--s-bg)]" href="/contact">
              {t('navigation.contact')}
            </Link>
          </li>
          <li className="">
            <Link className="hover:text-[var(--s-bg)]" href="/about">
              {t('navigation.about')}
            </Link>
          </li>
        </ul>
      </div>
      <hr className="mb-2" />
      <p className="text-center pt-2">
        © {new Date().getFullYear()} LIMA Chess. All Rights Reserved.
      </p>
    </footer>
  );
};
