import { ReactNode, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FiMove } from 'react-icons/fi'; // Drag icon, install with npm install react-icons

type DraggableItemProps = {
  children: ReactNode;
  index: number;
  itemType: any; // Model name or Field name
  className?: string;
  moveItem: (fromIndex: number, toIndex: number) => void;
};

export const DraggableItem: React.FC<DraggableItemProps> = ({
  children,
  index,
  moveItem,
  itemType,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: itemType,
    item: { index },
  });

  const [, drop] = useDrop({
    accept: itemType,
    hover: (draggedItem: { id: number; index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(ref)); // Combine drag and drop refs

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 p-2 border border-gray-300 rounded hover:shadow-md ${className}`}
    >
      <div
        className="cursor-move text-gray-500 hover:text-gray-700"
        title="Drag to reorder"
      >
        <FiMove size={16} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};
