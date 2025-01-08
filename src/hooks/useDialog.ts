import { useState } from 'react';

const useDialog = <T = null>() => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const onOpenDialog = (data: T | null = null) => {
    setOpen(true);
    setData(data);
  };

  const onCloseDialog = () => {
    setOpen(false);
    setData(null);
  };

  return {
    open,
    data,
    onCloseDialog,
    onOpenDialog,
  };
};

export default useDialog;
