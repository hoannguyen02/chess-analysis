import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="">
      <div className="flex flex-col min-h-[calc(100vh-70px)]">
        <main className="mx-auto max-w-[1172px] w-full py-4 min-h-[85vh] flex-grow px-[1rem] pb-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
