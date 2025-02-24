import { Button, Select, TextInput, Tooltip } from 'flowbite-react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { HiPlus, HiTrash } from 'react-icons/hi';

type Props = {
  control: any;
  register: any;
  name: string;
};

const arrowColors = [
  {
    label: 'Yellow (Recent Move)',
    value: '#FFD700',
    description: 'Highlights the last move played.',
  },
  {
    label: 'Orange (Attack)',
    value: '#FFA500',
    description: 'Marks an attacking idea or sequence.',
  },
  {
    label: 'Blue (Next Tactics)',
    value: '#0000FF',
    description: 'Suggests the best tactical move.',
  },
  {
    label: 'Green (Defensive Move)',
    value: '#008000',
    description: 'Shows a defensive or safe move.',
  },
  {
    label: 'Purple (Positional Move)',
    value: '#800080',
    description: 'Highlights a strong positional move.',
  },

  {
    label: 'Cyan (Weak Square)',
    value: '#00FFFF',
    description: 'Indicates a weak square to exploit.',
  },
  {
    label: 'Red (Check)',
    value: '#FF0000',
    description: 'Indicates the king is in check.',
  },
  {
    label: 'Pink (Forced Move)',
    value: '#FF69B4',
    description: 'Highlights a move that must be played.',
  },
  {
    label: "Gray (Opponent's Move)",
    value: '#808080',
    description: 'Tracks the opponent’s last move.',
  },
];

export const CustomArrowField = ({ control, register, name }: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // Track all selected colors at once
  const selectedColors = useWatch({
    control,
    name, // Watch the entire array
  }) as string[][]; // Type assertion assuming nested arrays

  return (
    <div>
      {fields.map((arrow, index) => {
        const selectedColor =
          selectedColors?.[index]?.[2] || arrowColors[0].value;
        const colorInfo = arrowColors.find(
          (color) => color.value === selectedColor
        );

        return (
          <div className="flex items-center space-x-2 mb-2" key={arrow.id}>
            <TextInput
              {...register(`${name}.${index}[0]`)}
              placeholder="From (e.g., e2)"
            />
            <TextInput
              {...register(`${name}.${index}[1]`)}
              placeholder="To (e.g., e4)"
            />
            <Tooltip
              content={colorInfo?.description || 'Select a color'}
              placement="top"
            >
              <Select {...register(`${name}.${index}[2]`)}>
                {arrowColors.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </Select>
            </Tooltip>
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
        );
      })}
      <Button
        type="button"
        outline
        size="md"
        onClick={() => append({ 0: '', 1: '', 2: arrowColors[0].value })}
      >
        <HiPlus className="mr-1" /> Add
      </Button>
    </div>
  );
};
