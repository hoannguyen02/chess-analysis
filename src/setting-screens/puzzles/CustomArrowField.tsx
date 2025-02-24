import { Button, TextInput } from 'flowbite-react';
import { useFieldArray } from 'react-hook-form';
import { HiPlus, HiTrash } from 'react-icons/hi';

type Props = {
  control: any;
  register: any;
  name: string;
};

export const CustomArrowField = ({ control, register, name }: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div>
      {fields.map((arrow, index) => (
        <div className="flex items-center space-x-2 mb-2" key={arrow.id}>
          <TextInput
            {...register(`${name}.${index}[0]`)}
            placeholder="From (e.g., e2)"
          />
          <TextInput
            {...register(`${name}.${index}[1]`)}
            placeholder="To (e.g., e4)"
          />
          <Button
            type="button"
            color="failure"
            size="xs"
            onClick={() => remove(index)}
            className="rounded-full"
          >
            <HiTrash />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        outline
        size="md"
        onClick={() => append({ 0: '', 1: '', 2: '' })}
      >
        <HiPlus className="mr-1" /> Add
      </Button>
    </div>
  );
};
