import { TextInput } from 'flowbite-react';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { VscClose } from 'react-icons/vsc';

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

  const onClear = useCallback(() => {
    setValue('');
    handleInputChange('');
  }, [handleInputChange]);

  // Cleanup the debounce function on component unmount
  useEffect(() => {
    return () => {
      handleInputChange.cancel();
    };
  }, [handleInputChange]);

  return (
    <div className="w-full relative">
      <TextInput
        placeholder={placeholder || 'Search...'}
        type="text"
        value={value}
        onChange={handleChange}
      />
      {value && (
        <VscClose
          className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={onClear}
        />
      )}
    </div>
  );
};

export default DebouncedInput;
