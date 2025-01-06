import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableItem } from './DraggableItem';

// Define the type for an item
interface Item {
  id: number;
  text: string;
}

// Main Component
export const DragDropExample: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

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
            itemType="item"
            key={item.id}
            index={index}
            moveItem={moveItem}
          >
            {item.text}
          </DraggableItem>
        ))}
      </div>
    </DndProvider>
  );
};
