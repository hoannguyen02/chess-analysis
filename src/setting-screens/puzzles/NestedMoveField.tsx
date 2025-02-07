import { DraggableItem } from '@/components/DraggableItem';
import { Puzzle } from '@/types/puzzle';
import { Button, TextInput } from 'flowbite-react';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useFieldArray, UseFormWatch, useWatch } from 'react-hook-form';
import { HiPlus, HiTrash } from 'react-icons/hi';

type NestedMoveFieldProps = {
  control: any;
  register: any;
  index: number;
  watch: UseFormWatch<Puzzle>;
};

export const NestedMoveField = ({
  control,
  register,
  index,
  watch,
}: NestedMoveFieldProps) => {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `solutions.${index}.moves`,
  });

  // 🔍 Watch player directly from the form state
  const player = useWatch({
    control,
    name: `solutions.${index}.player`,
  });

  // 🛠 Reset moves when switching to engine
  useEffect(() => {
    if (player === 'engine' && fields.length > 1) {
      replace([{ move: '', from: '', to: '' }]); // Engine can only have 1 move
    }
  }, [fields.length, player, replace]);

  const reorderMoves = (fromIndex: number, toIndex: number) => {
    const moves = watch(`solutions.${index}.moves`) || [];
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= moves.length ||
      toIndex >= moves.length
    ) {
      return; // Prevent out-of-bounds errors
    }

    const updatedMoves = [...moves];
    const [movedItem] = updatedMoves.splice(fromIndex, 1);
    updatedMoves.splice(toIndex, 0, movedItem);

    replace(updatedMoves); // Use replace to update the field array
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {fields.map((moveField, moveIndex) => (
          <DraggableItem
            itemType="solution-moves"
            index={moveIndex}
            moveItem={reorderMoves}
            key={moveField.id}
            className="mb-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              {/* Move Input */}
              <TextInput
                placeholder="Move (e.g., e4)"
                {...register(`solutions.${index}.moves.${moveIndex}.move`, {
                  required: 'Move is required',
                })}
                className="w-24 rounded-md shadow-sm"
              />

              {/* To Square */}
              <TextInput
                placeholder="To (e.g., e4)"
                {...register(`solutions.${index}.moves.${moveIndex}.to`)}
                className="w-20 rounded-md shadow-sm"
              />

              {/* From Square */}
              <TextInput
                placeholder="From (e.g., e2)"
                {...register(`solutions.${index}.moves.${moveIndex}.from`)}
                className="w-20 rounded-md shadow-sm"
              />

              {/* Remove Move Button */}
              {player === 'user' && (
                <Button
                  type="button"
                  color="failure"
                  size="xs"
                  onClick={() => remove(moveIndex)}
                  className="rounded-full"
                >
                  <HiTrash />
                </Button>
              )}
            </div>
          </DraggableItem>
        ))}

        {/* Add Move Button (Only for User) */}
        {player === 'user' && (
          <Button
            type="button"
            outline
            size="xs"
            onClick={() => append({ move: '', from: '', to: '' })}
            className="mt-2"
          >
            <HiPlus className="mr-1" /> Add Move
          </Button>
        )}
      </div>
    </DndProvider>
  );
};
