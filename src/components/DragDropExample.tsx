import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define item types
const ItemType = {
  ITEM: 'item',
};

// Define the type for an item
interface Item {
  id: number;
  text: string;
}

// Define the type for the draggable item's props
interface DraggableItemProps {
  id: number;
  text: string;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
}

// Draggable Item Component
const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  text,
  index,
  moveItem,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType.ITEM,
    item: { id, index },
  });

  const [, drop] = useDrop({
    accept: ItemType.ITEM,
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
      style={{
        padding: '10px',
        margin: '5px 0',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        cursor: 'move',
      }}
    >
      {text}
    </div>
  );
};

// Main Component
export const DragDropExample: React.FC = () => {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' },
    { id: 4, text: 'Item 4' },
  ]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ width: '300px', margin: '0 auto' }}>
        {items.map((item, index) => (
          <DraggableItem
            key={item.id}
            id={item.id}
            text={item.text}
            index={index}
            moveItem={moveItem}
          />
        ))}
      </div>
    </DndProvider>
  );
};
