import DebouncedInput from '@/components/DebounceInput';
import { LEVEL_RATING, Statues } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Lesson } from '@/types/lesson';
import { PuzzleDifficulty } from '@/types/puzzle';
import { StatusType } from '@/types/status';
import { fetcher } from '@/utils/fetcher';
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

interface LessonSearchModalProps {
  onClose: () => void;
  onAddLessons: (selectedLessons: Lesson[]) => void;
  selectedLessons: Lesson[];
}

const LessonSearchModal: React.FC<LessonSearchModalProps> = ({
  onClose,
  onAddLessons,
  selectedLessons,
}) => {
  const { apiDomain, locale } = useAppContext();
  const [selectedInModal, setSelectedInModal] = useState<Lesson[]>([]);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty | ''>('');
  const [title, setTitle] = useState<string | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');

  const queryString = useMemo(() => {
    // Define your query parameters as an object
    const queryObject: Record<string, any> = {
      difficulty,
      status,
      search: title,
      locale,
      page: currentPage,
      excludedIds: selectedLessons.map((l) => l._id).join(','),
    };

    const filteredQuery = Object.entries(queryObject)
      .filter(([, value]) => value) // Exclude undefined values
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(value as string | number)}`
      ) // Encode values for safety
      .join('&');

    return filteredQuery;
  }, [difficulty, status, title, locale, currentPage, selectedLessons]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/lessons?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
    items: Lesson[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
    nextPage: number;
    prevPage: number;
    lastPage: number;
  }>(queryKey, fetcher);

  const handleCheckboxChange = (lesson: Lesson) => {
    setSelectedInModal((prev) =>
      prev.find((l) => l._id === lesson._id)
        ? prev.filter((l) => l._id !== lesson._id)
        : [...prev, lesson]
    );
  };

  const handleAddLessons = () => {
    onAddLessons(selectedInModal);
    onClose();
  };

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <Modal show onClose={onClose} position="center">
      <Modal.Header>Search and Add Lessons</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4 mb-8">
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
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Edit</span>
              </Table.HeadCell>
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
                        {item.title[locale]}
                      </Table.Cell>
                      <Table.Cell>{item.difficulty}</Table.Cell>
                      <Table.Cell>{item.status}</Table.Cell>
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
            totalPages={data?.total || 0}
            onPageChange={onPageChange}
          />
          <Button className="mt-4" onClick={handleAddLessons}>
            Add Selected Lessons
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default LessonSearchModal;
