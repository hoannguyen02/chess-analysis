import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="mx-auto max-w-[1172px] w-full py-4 min-h-[85vh] flex-grow px-[1rem] pb-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
