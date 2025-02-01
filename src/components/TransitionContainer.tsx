import { ReactNode } from 'react';

type Props = {
  isLoading: boolean;
  isVisible: boolean;
  children: ReactNode;
};
export const TransitionContainer = ({
  isLoading,
  isVisible,
  children,
}: Props) => {
  return isLoading ? (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <div
      className={`transition-opacity duration-500 ease-in-out lg:transform ${
        isVisible
          ? 'opacity-100 lg:translate-y-0'
          : 'opacity-0 lg:translate-y-4'
      }`}
    >
      {children}
    </div>
  );
};
