import { Drawer } from 'flowbite-react';
import React, { ReactNode, useState } from 'react';
import { VscMortarBoard } from 'react-icons/vsc';
import { Footer } from './Footer';
import Header from './Header';
import { MenuLeft } from './MenuLeft';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="flex flex-col h-[100vh]">
        <Header />
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
