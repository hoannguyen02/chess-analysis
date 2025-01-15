import DebouncedInput from '@/components/DebounceInput';
import { LEVEL_RATING, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Puzzle, PuzzleDifficulty } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { fetcher } from '@/utils/fetcher';
import { previewPuzzle } from '@/utils/previewPuzzle';
import {
  Button,
  Checkbox,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
} from 'flowbite-react';
import React, { useMemo, useState } from 'react';
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
  const { apiDomain, themes, locale } = useAppContext();
  const [selectedInModal, setSelectedInModal] = useState<Puzzle[]>([]);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');
  const [theme, setTheme] = useState<string | ''>('');
  const [title, setTitle] = useState<string | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      title,
      page: currentPage,
      excludedIds: selectedPuzzles.map((l) => l._id).join(','),
      theme,
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value) // Exclude undefined values
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      ) // Encode values for safety
      .join('&');

    return filteredQuery;
  }, [difficulty, status, title, currentPage, selectedPuzzles, theme]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/puzzles?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
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

  const handlePreview = (item: Puzzle) => {
    const encodedData = encodeURIComponent(JSON.stringify(item));
    window.open(`/settings/puzzles/preview?data=${encodedData}`, '_blank');
  };

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
                  setTitle(value);
                }}
              />
            </div>
            <div className="flex flex-col">
              Status:
              <Select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusType)
                }
              >
                <option value="">Select a status</option>
                {Statues.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col">
              Theme:
              <Select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                <option value="">Select a theme</option>
                {themes.map((theme) => (
                  <option key={theme.code} label={theme.title[locale]}>
                    {theme.code}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col">
              Rating:
              <Select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as PuzzleDifficulty)
                }
              >
                <option value="">Select a rating</option>
                {Object.entries(LEVEL_RATING).map(([rating, title]) => (
                  <option key={rating} label={title}>
                    {rating}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell></Table.HeadCell>
              <Table.HeadCell>Title</Table.HeadCell>
              <Table.HeadCell>Difficulty</Table.HeadCell>
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
                      <Table.Cell>{item.difficulty}</Table.Cell>
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
