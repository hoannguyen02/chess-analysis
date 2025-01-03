import { Button } from 'flowbite-react';
import { ReactNode } from 'react';

type Props = {
  onClick: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
};
export const PrimaryButton = ({
  onClick,
  className,
  disabled,
  children,
}: Props) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`bg-[var(--p-text-hover)] text-white ${className}`}
      gradientMonochrome="cyan"
    >
      {children}
    </Button>
  );
};
