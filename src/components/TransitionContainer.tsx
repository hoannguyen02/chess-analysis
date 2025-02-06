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
      className={`transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 '
      }`}
    >
      {children}
    </div>
  );
};
