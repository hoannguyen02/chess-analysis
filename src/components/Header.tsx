import Brand from './Brand';
import { changeLanguage, SiteLanguage } from '@/lib/changeLanguage';
import { useAppContext } from '@/contexts/AppContext';
import { LocaleType } from '@/types/locale';
import { Drawer, Dropdown } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { VscMenu, VscMortarBoard } from 'react-icons/vsc';
import { MenuLeft } from './MenuLeft';

const LANG_MAP: Record<LocaleType, string> = {
  vi: 'VIE',
  en: 'ENG',
};

export default function Header() {
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();
  const { locale } = useAppContext();

  const switchLanguage = (lang: SiteLanguage) => {
    void changeLanguage(router, lang);
  };

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 69) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={isSticky ? 'pt-[70px]' : ''}>
      <nav
        data-site-header
        className={`${
          isSticky
            ? 'fixed top-0 z-50 left-1/2 transform -translate-x-1/2'
            : 'mx-auto'
        } transition-[top] duration-500 w-full max-w-[1920px]  bg-[#101827] text-white px-3 lg:px-6 py-3 shadow-md flex items-center justify-between`}
      >
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center">
          <VscMenu
            className="pointer text-white mx-2 xl:hidden"
            onClick={() => {
              setIsOpenDrawer((prev) => !prev);
            }}
          />
          <Brand />
          <div className="ml-3 hidden xl:flex">
            <Link
              href="/setup-board"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.setup-board')}
            </Link>
            <Link
              href="/analysis"
              target="_blank"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.analysis')}
            </Link>
            <Link
              href="/team-rank"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.team-rank')}
            </Link>
            <Link
              href="https://www.youtube.com/@LIMAChess?sub_confirmation=1"
              rel="noopener noreferrer"
              target="_blank"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.youtube')}
            </Link>
            <Link
              href="/english-practice"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.english-practice')}
            </Link>
            <Link
              href="/math-practice"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.math-practice')}
            </Link>
          </div>
        </div>
        <div className="flex items-center ">
          {/* Right Side: Icons & Profile */}
          <div className="flex items-center ml-2">
            <Dropdown label={LANG_MAP[locale]} inline>
              <Dropdown.Item onClick={() => switchLanguage('vi')}>
                VIE
              </Dropdown.Item>
              <Dropdown.Item onClick={() => switchLanguage('en')}>
                ENG
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
      </nav>
      <Drawer
        theme={{
          root: {
            base: 'bg-[var(--p-bg)] fixed z-40 overflow-y-auto p-4 transition-transform ',
          },
        }}
        open={isOpenDrawer}
        onClose={() => {
          setIsOpenDrawer(false);
        }}
      >
        <Drawer.Header titleIcon={VscMortarBoard}></Drawer.Header>
        <Drawer.Items className="h-[calc(100vh-4rem)] overflow-y-auto">
          <MenuLeft />
        </Drawer.Items>
      </Drawer>
    </div>
  );
}
