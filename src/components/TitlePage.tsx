import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};
export const TitlePage = ({ children }: Props) => {
  return <h3 className="my-4 flex justify-between">{children}</h3>;
};
