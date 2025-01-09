import { Footer } from 'flowbite-react';
import React, { ReactNode } from 'react';
import { MenuLeft } from './MenuLeft';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="lg:w-[245px]">
        <MenuLeft />
      </div>
      <div className="pl-[245px] flex flex-col h-[100vh]">
        <main className="mx-auto max-w-[1140px] w-full py-4 flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
