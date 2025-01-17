import { Drawer } from 'flowbite-react';
import Link from 'next/link';
import React, { ReactNode, useState } from 'react';
import { VscMenu, VscMortarBoard } from 'react-icons/vsc';
import { Footer } from './Footer';
import LanguageSwitcher from './LanguageSwitcher';
import { Logo } from './Logo';
import { MenuLeft } from './MenuLeft';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="hidden lg:flex lg:w-[245px] h-[100vh] fixed left-0 z-10">
        <MenuLeft />
        <LanguageSwitcher />
      </div>
      <div className="lg:pl-[245px] flex flex-col h-[100vh]">
        <div className="lg:hidden flex items-center bg-[var(--p-bg)]">
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
        <Drawer.Items>
          <MenuLeft />
          <LanguageSwitcher />
        </Drawer.Items>
      </Drawer>
    </div>
  );
};

export default Layout;
