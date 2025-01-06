import { TextInput } from 'flowbite-react';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';

type Props = {
  onChange(value: string): void;
  placeholder?: string;
  initialValue?: string;
};
const DebouncedInput = ({ onChange, placeholder, initialValue }: Props) => {
  const [value, setValue] = useState<string | ''>('');

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleInputChange = useCallback(
    debounce((inputValue: string) => {
      onChange(inputValue);
    }, 500),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    handleInputChange(newValue);
  };

  // Cleanup the debounce function on component unmount
  useEffect(() => {
    return () => {
      handleInputChange.cancel();
    };
  }, [handleInputChange]);

  return (
    <div className="w-full">
      <TextInput
        placeholder={placeholder || 'Search...'}
        type="text"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default DebouncedInput;
