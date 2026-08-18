'use client';

import { MoveAnnotation, MoveQuality } from '@/types/move-annotation';
import { Button, Modal, Select, TextInput } from 'flowbite-react';

type MoveOption = {
  ply: number;
  label: string;
};

type MoveTagsDialogProps = {
  open: boolean;
  onClose: () => void;
  moveAnnotations: MoveAnnotation[];
  moveOptions: MoveOption[];
  onAddTag: () => void;
  onUpdateAnnotation: (
    index: number,
    patch: Partial<MoveAnnotation>
  ) => void;
  onRemoveAnnotation: (index: number) => void;
  moveQualityOptions: MoveQuality[];
  getMoveQualityLabel: (quality: MoveQuality) => string;
};

export const MoveTagsDialog = ({
  open,
  onClose,
  moveAnnotations,
  moveOptions,
  onAddTag,
  onUpdateAnnotation,
  onRemoveAnnotation,
  moveQualityOptions,
  getMoveQualityLabel,
}: MoveTagsDialogProps) => {
  return (
    <Modal show={open} onClose={onClose} size="3xl" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                Move Tags
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add tags only for the key teaching moments you want to show.
              </p>
            </div>
            <Button color="gray" onClick={onAddTag}>
              Add Tag
            </Button>
          </div>

          {moveAnnotations.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No move tags yet. Add one to mark a brilliant move, blunder, or
              another teaching moment.
            </div>
          ) : (
            <div className="space-y-3">
              {moveAnnotations.map((annotation, index) => (
                <div
                  key={`${annotation.ply}-${index}`}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                    <Select
                      value={annotation.ply}
                      onChange={(event) =>
                        onUpdateAnnotation(index, {
                          ply: Number(event.target.value),
                        })
                      }
                    >
                      {moveOptions.map((option) => (
                        <option key={option.ply} value={option.ply}>
                          {option.label}
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={annotation.quality}
                      onChange={(event) =>
                        onUpdateAnnotation(index, {
                          quality: event.target.value as MoveQuality,
                        })
                      }
                    >
                      {moveQualityOptions.map((quality) => (
                        <option key={quality} value={quality}>
                          {getMoveQualityLabel(quality)}
                        </option>
                      ))}
                    </Select>

                    <Button color="gray" onClick={() => onRemoveAnnotation(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="mt-3">
                    <TextInput
                      value={annotation.note ?? ''}
                      onChange={(event) =>
                        onUpdateAnnotation(index, {
                          note: event.target.value,
                        })
                      }
                      placeholder="Optional note, e.g. Queen sacrifice starts the mating net"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};
