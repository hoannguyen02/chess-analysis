import { useAppContext } from '@/contexts/AppContext';
import { Drawer } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactNode, useMemo, useState } from 'react';
import { VscMenu, VscMortarBoard } from 'react-icons/vsc';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { MenuLeft } from './MenuLeft';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const t = useTranslations('common');
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const router = useRouter();
  const { session, isMobile } = useAppContext();
  const currentPath = useMemo(() => {
    return router.asPath;
  }, [router]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="hidden lg:flex lg:w-[245px] h-[100vh] fixed left-0 z-10 flex-col">
        <MenuLeft />
      </div>
      <div className="lg:pl-[245px] flex flex-col h-[100vh]">
        <div className="lg:hidden flex items-center bg-[var(--p-bg)] justify-between ">
          <div className="flex items-center">
            <VscMenu
              className="pointer text-white mx-2"
              onClick={() => {
                setIsOpenDrawer((prev) => !prev);
              }}
            />
            <Link href="/" className="">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center mr-2">
            {isMobile && !session?.username && (
              <Link
                href={
                  currentPath !== '/'
                    ? `/login?redirect=${encodeURIComponent(currentPath)}`
                    : '/login'
                }
                className=" text-white cursor-pointer text-center flex "
              >
                {t('navigation.login')}
              </Link>
            )}
          </div>
        </div>
        <main className="mx-auto max-w-[1172px] w-full py-4 flex-1 px-[1rem]">
          {children}
        </main>
        <Footer />
      </div>
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
};

export default Layout;
