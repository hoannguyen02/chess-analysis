import { Button } from 'flowbite-react';
import { ReactNode } from 'react';

type Props = {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'reset' | 'submit';
  gradientMonochrome?:
    | 'dark'
    | 'failure'
    | 'gray'
    | 'info'
    | 'light'
    | 'purple'
    | 'success'
    | 'warning';
};
export const PrimaryButton = ({
  onClick,
  className,
  disabled,
  children,
  type,
  gradientMonochrome = 'info',
}: Props) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`${className}`}
      gradientMonochrome={gradientMonochrome}
      type={type}
    >
      {children}
    </Button>
  );
};
