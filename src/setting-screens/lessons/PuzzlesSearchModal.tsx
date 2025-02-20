import DebouncedInput from '@/components/DebounceInput';
import { RatingOptions, StatusOptions } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { DifficultyType } from '@/types';
import { Puzzle } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { fetcher } from '@/utils/fetcher';
import { previewPuzzle } from '@/utils/previewPuzzle';
import {
  Button,
  Checkbox,
  Modal,
  Pagination,
  Spinner,
  Table,
} from 'flowbite-react';
import React, { useMemo, useState } from 'react';
import Select from 'react-select';
import useSWR from 'swr';

interface PuzzlesSearchModalProps {
  onClose: () => void;
  onAddPuzzles: (selectedPuzzles: Puzzle[]) => void;
  selectedPuzzles: Puzzle[];
}

export const PuzzlesSearchModal: React.FC<PuzzlesSearchModalProps> = ({
  onClose,
  onAddPuzzles,
  selectedPuzzles,
}) => {
  const { apiDomain, themes: themeOptions, locale } = useAppContext();
  const [selectedInModal, setSelectedInModal] = useState<Puzzle[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [themes, setThemes] = useState<string[]>([]);
  const [title, setTitle] = useState<string | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      title,
      locale,
      page: currentPage,
      excludedIds: selectedPuzzles.map((l) => l._id).join(','),
      themes: themes.join(','),
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value) // Exclude undefined values
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      ) // Encode values for safety
      .join('&');

    return filteredQuery;
  }, [difficulty, status, title, locale, currentPage, selectedPuzzles, themes]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/puzzles?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, isLoading } = useSWR<{
    items: Puzzle[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
    nextPage: number;
    prevPage: number;
    lastPage: number;
  }>(queryKey, fetcher);

  const handleCheckboxChange = (lesson: Puzzle) => {
    setSelectedInModal((prev) =>
      prev.find((l) => l._id === lesson._id)
        ? prev.filter((l) => l._id !== lesson._id)
        : [...prev, lesson]
    );
  };

  const handleAddPuzzles = () => {
    onAddPuzzles(selectedInModal);
    onClose();
  };

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <Modal show onClose={onClose} position="center">
      <Modal.Header>Search and Add Puzzles</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div className="grid grid-cols-[auto_200px] gap-4 mb-8">
            <div className="flex flex-col">
              Title:
              <DebouncedInput
                placeholder="Enter a title"
                initialValue={title}
                onChange={(value) => {
                  setCurrentPage(1);
                  setTitle(value);
                }}
              />
            </div>
            {/* Status Filter */}
            <div className="flex flex-col">
              Status:
              <Select
                options={StatusOptions}
                value={StatusOptions.find((option) => option.value === status)}
                onChange={(selectedOption) => {
                  setCurrentPage(1);
                  setStatus(selectedOption?.value as StatusType);
                }}
                placeholder="Select status..."
                isClearable
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Themes Filter */}
            <div className="flex flex-col">
              Themes:
              <Select
                isMulti
                options={themeOptions}
                value={themeOptions.filter((option) =>
                  themes.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setCurrentPage(1);
                  setThemes(selectedOptions.map((option) => option.value));
                }}
                placeholder="Select themes..."
              />
            </div>
            {/* Rating Filter */}
            <div className="flex flex-col">
              Rating:
              <Select
                options={RatingOptions}
                value={RatingOptions.find(
                  (option) => option.value === difficulty
                )}
                onChange={(selectedOption) => {
                  setCurrentPage(1);
                  setDifficulty(selectedOption?.value as DifficultyType);
                }}
                placeholder="Select rating..."
                isClearable
              />
            </div>
          </div>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell></Table.HeadCell>
              <Table.HeadCell>Title</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {isLoading ? (
                <div className="text-center">
                  <Spinner />
                </div>
              ) : (
                data?.items.map((item, index) => {
                  return (
                    <Table.Row
                      key={`item-${index}`}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <Table.Cell>
                        <Checkbox
                          id={`item-${item._id}`}
                          checked={selectedInModal.some(
                            (l) => l._id === item._id
                          )}
                          onChange={() => handleCheckboxChange(item)}
                        />
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {item?.title?.[locale]}
                      </Table.Cell>
                      <Table.Cell>
                        <Button onClick={() => previewPuzzle(item)}>
                          View
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-center mt-4 flex-col">
          <Pagination
            currentPage={currentPage}
            totalPages={data?.lastPage || 0}
            onPageChange={onPageChange}
          />
          <Button className="mt-4" onClick={handleAddPuzzles}>
            Add Selected Puzzles
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
