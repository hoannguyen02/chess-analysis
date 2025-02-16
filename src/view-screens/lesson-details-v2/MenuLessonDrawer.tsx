import { Drawer } from 'flowbite-react';
import { forwardRef, ReactNode, useEffect } from 'react';
import { VscMortarBoard } from 'react-icons/vsc';

type Props = {
  onClose(): void;
  onOpen?: () => void;
  children?: ReactNode;
};

// forwardRef must receive (props, ref) instead of destructuring props inside the function
export const MenuLessonDrawer = forwardRef<HTMLDivElement, Props>(
  ({ onClose, onOpen, children }, ref) => {
    useEffect(() => {
      if (onOpen) {
        onOpen(); // Call onOpen when the drawer is opened
      }
    }, [onOpen]);

    return (
      <Drawer
        theme={{
          root: {
            base: 'bg-white fixed z-40 overflow-y-auto p-4 transition-transform',
          },
        }}
        open
        onClose={onClose}
      >
        <Drawer.Header titleIcon={VscMortarBoard}></Drawer.Header>
        <Drawer.Items
          ref={ref} // Attach ref to scrolling container
          className="h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {children}
        </Drawer.Items>
      </Drawer>
    );
  }
);

// Fix TypeScript typing for forwardRef
MenuLessonDrawer.displayName = 'MenuLessonDrawer';
