import { Button } from 'flowbite-react';
import { ReactNode } from 'react';

type Props = {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'reset' | 'submit';
};
export const PrimaryButton = ({
  onClick,
  className,
  disabled,
  children,
  type,
}: Props) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`${className}`}
      gradientMonochrome="info"
      type={type}
    >
      {children}
    </Button>
  );
};
