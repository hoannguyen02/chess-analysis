import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { LocaleType } from '@/types/locale';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Drawer, Dropdown } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const { session, apiDomain, locale, isMobile } = useAppContext();
  const { addToast } = useToast();
  const currentPath = useMemo(() => {
    return router.asPath;
  }, [router]);

  const switchLanguage = (lang: string) => {
    router.replace(router.asPath, undefined, { locale: lang }); // Faster language switch
  };

  const handleLogout = useCallback(async () => {
    const result = await handleSubmission(
      async () => {
        return await axiosInstance.post(`${apiDomain}/v1/auth/logout`);
      },
      addToast,
      t('title.logout-success')
    );
    if (result !== undefined) {
      router.push('/');
    }
  }, [addToast, apiDomain, router, t]);

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
    <>
      <nav
        className={`${
          isSticky
            ? 'fixed top-0 z-50 left-1/2 transform -translate-x-1/2'
            : 'mx-auto'
        } transition-[top] duration-500 w-full max-w-[1920px]  bg-[var(--p-bg)] text-white lg:px-6 py-3 shadow-md flex items-center justify-between`}
      >
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center">
          <VscMenu
            className="pointer text-white mx-2 lg:hidden"
            onClick={() => {
              setIsOpenDrawer((prev) => !prev);
            }}
          />
          <Link href="/" className="hover:text-[var(--p-highlight)]">
            {isMobile ? (
              <svg
                width="71"
                height="45"
                viewBox="0 0 71 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.27 29.67H13.17V33H2.07V12.06H6.27V29.67ZM20.0395 12.06V33H15.8395V12.06H20.0395ZM47.0191 12.06V33H42.8191V19.38L37.2091 33H34.0291L28.3891 19.38V33H24.1891V12.06H28.9591L35.6191 27.63L42.2791 12.06H47.0191ZM64.0116 29.01H55.6716L54.2916 33H49.8816L57.4116 12.03H62.3016L69.8316 33H65.3916L64.0116 29.01ZM62.8716 25.65L59.8416 16.89L56.8116 25.65H62.8716Z"
                  fill="#F5A623"
                />
              </svg>
            ) : (
              <svg
                width="172"
                height="45"
                viewBox="0 0 172 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.27 29.67H13.17V33H2.07V12.06H6.27V29.67ZM20.0395 12.06V33H15.8395V12.06H20.0395ZM47.0191 12.06V33H42.8191V19.38L37.2091 33H34.0291L28.3891 19.38V33H24.1891V12.06H28.9591L35.6191 27.63L42.2791 12.06H47.0191ZM64.0116 29.01H55.6716L54.2916 33H49.8816L57.4116 12.03H62.3016L69.8316 33H65.3916L64.0116 29.01ZM62.8716 25.65L59.8416 16.89L56.8116 25.65H62.8716ZM79.4791 22.53C79.4791 20.49 79.9491 18.66 80.8891 17.04C81.8491 15.42 83.1391 14.16 84.7591 13.26C86.3991 12.34 88.1891 11.88 90.1291 11.88C92.3491 11.88 94.3191 12.43 96.0391 13.53C97.7791 14.61 99.0391 16.15 99.8191 18.15H95.7091C95.1691 17.05 94.4191 16.23 93.4591 15.69C92.4991 15.15 91.3891 14.88 90.1291 14.88C88.7491 14.88 87.5191 15.19 86.4391 15.81C85.3591 16.43 84.5091 17.32 83.8891 18.48C83.2891 19.64 82.9891 20.99 82.9891 22.53C82.9891 24.07 83.2891 25.42 83.8891 26.58C84.5091 27.74 85.3591 28.64 86.4391 29.28C87.5191 29.9 88.7491 30.21 90.1291 30.21C91.3891 30.21 92.4991 29.94 93.4591 29.4C94.4191 28.86 95.1691 28.04 95.7091 26.94H99.8191C99.0391 28.94 97.7791 30.48 96.0391 31.56C94.3191 32.64 92.3491 33.18 90.1291 33.18C88.1691 33.18 86.3791 32.73 84.7591 31.83C83.1391 30.91 81.8491 29.64 80.8891 28.02C79.9491 26.4 79.4791 24.57 79.4791 22.53ZM112.372 16.2C113.632 16.2 114.752 16.47 115.732 17.01C116.732 17.55 117.512 18.35 118.072 19.41C118.652 20.47 118.942 21.75 118.942 23.25V33H115.552V23.76C115.552 22.28 115.182 21.15 114.442 20.37C113.702 19.57 112.692 19.17 111.412 19.17C110.132 19.17 109.112 19.57 108.352 20.37C107.612 21.15 107.242 22.28 107.242 23.76V33H103.822V10.8H107.242V18.39C107.822 17.69 108.552 17.15 109.432 16.77C110.332 16.39 111.312 16.2 112.372 16.2ZM138.455 24.33C138.455 24.95 138.415 25.51 138.335 26.01H125.705C125.805 27.33 126.295 28.39 127.175 29.19C128.055 29.99 129.135 30.39 130.415 30.39C132.255 30.39 133.555 29.62 134.315 28.08H138.005C137.505 29.6 136.595 30.85 135.275 31.83C133.975 32.79 132.355 33.27 130.415 33.27C128.835 33.27 127.415 32.92 126.155 32.22C124.915 31.5 123.935 30.5 123.215 29.22C122.515 27.92 122.165 26.42 122.165 24.72C122.165 23.02 122.505 21.53 123.185 20.25C123.885 18.95 124.855 17.95 126.095 17.25C127.355 16.55 128.795 16.2 130.415 16.2C131.975 16.2 133.365 16.54 134.585 17.22C135.805 17.9 136.755 18.86 137.435 20.1C138.115 21.32 138.455 22.73 138.455 24.33ZM134.885 23.25C134.865 21.99 134.415 20.98 133.535 20.22C132.655 19.46 131.565 19.08 130.265 19.08C129.085 19.08 128.075 19.46 127.235 20.22C126.395 20.96 125.895 21.97 125.735 23.25H134.885ZM147.82 33.27C146.52 33.27 145.35 33.04 144.31 32.58C143.29 32.1 142.48 31.46 141.88 30.66C141.28 29.84 140.96 28.93 140.92 27.93H144.46C144.52 28.63 144.85 29.22 145.45 29.7C146.07 30.16 146.84 30.39 147.76 30.39C148.72 30.39 149.46 30.21 149.98 29.85C150.52 29.47 150.79 28.99 150.79 28.41C150.79 27.79 150.49 27.33 149.89 27.03C149.31 26.73 148.38 26.4 147.1 26.04C145.86 25.7 144.85 25.37 144.07 25.05C143.29 24.73 142.61 24.24 142.03 23.58C141.47 22.92 141.19 22.05 141.19 20.97C141.19 20.09 141.45 19.29 141.97 18.57C142.49 17.83 143.23 17.25 144.19 16.83C145.17 16.41 146.29 16.2 147.55 16.2C149.43 16.2 150.94 16.68 152.08 17.64C153.24 18.58 153.86 19.87 153.94 21.51H150.52C150.46 20.77 150.16 20.18 149.62 19.74C149.08 19.3 148.35 19.08 147.43 19.08C146.53 19.08 145.84 19.25 145.36 19.59C144.88 19.93 144.64 20.38 144.64 20.94C144.64 21.38 144.8 21.75 145.12 22.05C145.44 22.35 145.83 22.59 146.29 22.77C146.75 22.93 147.43 23.14 148.33 23.4C149.53 23.72 150.51 24.05 151.27 24.39C152.05 24.71 152.72 25.19 153.28 25.83C153.84 26.47 154.13 27.32 154.15 28.38C154.15 29.32 153.89 30.16 153.37 30.9C152.85 31.64 152.11 32.22 151.15 32.64C150.21 33.06 149.1 33.27 147.82 33.27ZM163.846 33.27C162.546 33.27 161.376 33.04 160.336 32.58C159.316 32.1 158.506 31.46 157.906 30.66C157.306 29.84 156.986 28.93 156.946 27.93H160.486C160.546 28.63 160.876 29.22 161.476 29.7C162.096 30.16 162.866 30.39 163.786 30.39C164.746 30.39 165.486 30.21 166.006 29.85C166.546 29.47 166.816 28.99 166.816 28.41C166.816 27.79 166.516 27.33 165.916 27.03C165.336 26.73 164.406 26.4 163.126 26.04C161.886 25.7 160.876 25.37 160.096 25.05C159.316 24.73 158.636 24.24 158.056 23.58C157.496 22.92 157.216 22.05 157.216 20.97C157.216 20.09 157.476 19.29 157.996 18.57C158.516 17.83 159.256 17.25 160.216 16.83C161.196 16.41 162.316 16.2 163.576 16.2C165.456 16.2 166.966 16.68 168.106 17.64C169.266 18.58 169.886 19.87 169.966 21.51H166.546C166.486 20.77 166.186 20.18 165.646 19.74C165.106 19.3 164.376 19.08 163.456 19.08C162.556 19.08 161.866 19.25 161.386 19.59C160.906 19.93 160.666 20.38 160.666 20.94C160.666 21.38 160.826 21.75 161.146 22.05C161.466 22.35 161.856 22.59 162.316 22.77C162.776 22.93 163.456 23.14 164.356 23.4C165.556 23.72 166.536 24.05 167.296 24.39C168.076 24.71 168.746 25.19 169.306 25.83C169.866 26.47 170.156 27.32 170.176 28.38C170.176 29.32 169.916 30.16 169.396 30.9C168.876 31.64 168.136 32.22 167.176 32.64C166.236 33.06 165.126 33.27 163.846 33.27Z"
                  fill="#F5A623"
                />
              </svg>
            )}
          </Link>
          <div className="ml-4 hidden lg:flex">
            <Link
              href="/tactics"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.tactics')}
            </Link>
            <Link
              href="/openings"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.openings')}
            </Link>
            <Link
              href="/endgames"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.endgames')}
            </Link>
            <Link
              href="/traps"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.traps')}
            </Link>
            <Link
              href="/board-and-pieces"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.board-pieces')}
            </Link>
            <Link
              href="/chess-notation"
              className="ml-4 hover:text-[var(--p-highlight)]"
            >
              {t('navigation.chess-notation')}
            </Link>
          </div>
          {/* Manage route */}
          {(session?.role === 'Teacher' || session?.role === 'Admin') && (
            <div className="hidden lg:flex ml-4">
              <Dropdown label={t('title.manage')} inline>
                <Dropdown.Item as={Link} href="/settings/puzzles">
                  {t('navigation.puzzles')}
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/settings/lessons">
                  {t('navigation.lessons')}
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/settings/puzzle-themes">
                  {t('navigation.puzzle-themes')}
                </Dropdown.Item>
                {session?.role === 'Admin' && (
                  <Dropdown.Item as={Link} href="/settings/users">
                    {t('navigation.users')}
                  </Dropdown.Item>
                )}
              </Dropdown>
            </div>
          )}
        </div>
        <div className="flex items-center ">
          {/* Center: Search Bar */}
          {/* <div className="w-[300px] relative hidden lg:flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full px-4 py-2 rounded-lg text-black placeholder-gray-500"
            />
            <VscSearch
              className="absolute right-3 top-2.5 text-gray-500"
              size={20}
            />
          </div> */}
          {/* Search mobile icon */}
          {/* <svg
            className="cursor-pointer lg:hidden mr-4"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
          </svg> */}

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
          <div className="flex items-center mx-2">
            {session?.id ? (
              <Dropdown label={t('title.profile')} inline>
                <Dropdown.Item onClick={() => router.push('/change-password')}>
                  {t('navigation.change-password')}
                </Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>
                  {t('navigation.logout')}
                </Dropdown.Item>
              </Dropdown>
            ) : (
              <Link
                href={
                  currentPath !== '/'
                    ? `/login?redirect=${encodeURIComponent(currentPath)}`
                    : '/login'
                }
                className="hover:text-[var(--p-highlight)] text-center"
              >
                {t('navigation.login')}
              </Link>
            )}
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
    </>
  );
}
