import { useFieldArray, useFormContext } from 'react-hook-form';

const ContentExplanations = ({ contentIndex }: { contentIndex: number }) => {
  const { control, watch, setValue, register } = useFormContext<LessonForm>();

  // Nested useFieldArray for explanations inside each content
  const {
    fields: explanationFields,
    append: appendExplanation,
    remove: removeExplanation,
  } = useFieldArray({
    control,
    name: `contents.${contentIndex}.explanations`,
  });

  const reorderExplanations = (fromIndex: number, toIndex: number) => {
    const explanations = watch(`contents.${contentIndex}.explanations`) || [];
    const updatedItems = [...explanations];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setValue(`contents.${contentIndex}.explanations`, updatedItems, {
      shouldDirty: true,
    });
  };

  return (
    <div className="mt-2">
      Explanations:
      <DndProvider backend={HTML5Backend}>
        {explanationFields.map((field, index) => (
          <DraggableItem
            itemType="explanations"
            index={index}
            moveItem={reorderExplanations}
            key={field.id}
            className="flex justify-between items-center mb-2"
          >
            <div className="w-full">
              <TextInput
                placeholder="English Explanation"
                {...register(
                  `contents.${contentIndex}.explanations.${index}.en`
                )}
                defaultValue={field.en}
                className="mb-2"
              />
              <TextInput
                placeholder="Vietnamese Explanation"
                {...register(
                  `contents.${contentIndex}.explanations.${index}.vi`
                )}
                defaultValue={field.vi}
              />
            </div>
            <Button
              outline
              size="sm"
              type="button"
              onClick={() => removeExplanation(index)}
            >
              -
            </Button>
          </DraggableItem>
        ))}
      </DndProvider>
      <Button
        type="button"
        outline
        size="sm"
        onClick={() => appendExplanation({ en: '', vi: '' })}
      >
        Add Explanation
      </Button>
    </div>
  );
};
