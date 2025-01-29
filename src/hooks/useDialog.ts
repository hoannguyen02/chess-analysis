import { useState } from 'react';

const useDialog = <T = null>() => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const onOpenDialog = (newData: T | null = null) => {
    setOpen(true);
    setData((prevData) => {
      return prevData ? { ...prevData, ...newData } : newData;
    });
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
