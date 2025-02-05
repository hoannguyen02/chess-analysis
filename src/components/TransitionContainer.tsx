import { ReactNode } from 'react';
import { Loading } from './Loading';

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
    <Loading />
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
