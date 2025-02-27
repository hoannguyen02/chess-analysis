import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { StatusOptions } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { StatusType } from '@/types/status';
import { Role, User } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { handleSubmission } from '@/utils/handleSubmission';
import { Button, Label, Pagination, Spinner } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Select from 'react-select';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

type Props = {
  roles: Role[];
};
export const UserListScreen = ({ roles }: Props) => {
  const { apiDomain } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');
  const [username, setUsername] = useState<string | ''>('');
  const [role, setRole] = useState<string>();

  const RoleMap: Partial<Record<string, Role>> = useMemo(() => {
    return roles?.reduce((acc, role) => {
      return {
        ...acc,
        [role.value]: role,
      };
    }, {});
  }, [roles]);

  const queryString = useMemo(() => {
    const queryObject: Record<string, any> = {
      status,
      username,
      page: currentPage,
      role,
    };

    return filteredQuery(queryObject);
  }, [status, username, currentPage, role]);

  const queryKey = useMemo(
    () => `${apiDomain}/v1/users?${queryString}`,
    [apiDomain, queryString]
  );

  const { data, error, isLoading } = useSWR<{
    items: User[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
    nextPage: number;
    prevPage: number;
    lastPage: number;
  }>(queryKey, fetcher);

  const router = useRouter();

  const onPageChange = (page: number) => setCurrentPage(page);

  const { addToast } = useToast();
  const resetPracticeHistory = async (userId: string) => {
    await handleSubmission(
      async () => {
        return await axiosInstance.delete(
          `${apiDomain}/v1/practice-puzzle/history/reset/${userId}`
        );
      },
      addToast,
      'Practice history reset successfully!'
    );
  };

  const resetRatingHistory = async (userId: string) => {
    await handleSubmission(
      async () => {
        return await axiosInstance.delete(
          `${apiDomain}/v1/solve-puzzle/history/reset/${userId}`
        );
      },
      addToast,
      'Rating history reset successfully!'
    );
  };

  if (error || !data?.items?.length) return <div>Error occurred</div>;

  return (
    <>
      <TitlePage>
        User List{' '}
        <Button
          onClick={() => {
            router.push('/settings/users/create');
          }}
        >
          Add new
        </Button>
      </TitlePage>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col">
          Username:
          <DebouncedInput
            placeholder="Enter a username"
            initialValue={username}
            onChange={(value) => setUsername(value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col">
          Status:
          <Select
            options={StatusOptions}
            value={StatusOptions.find((option) => option.value === status)}
            onChange={(selectedOption) =>
              setStatus(selectedOption?.value as StatusType)
            }
            placeholder="Select status..."
            isClearable
          />
        </div>

        <div className="flex flex-col">
          Role:
          <Select
            options={roles}
            value={roles.find((option) => option.value === role)}
            onChange={(option) => setRole(option?.value as string)}
            placeholder="Select role..."
            isClearable
          />
        </div>
      </div>

      {/* Courses Table */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-6 mb-4">
          <Label className="font-bold">Username</Label>
          <Label className="font-bold">Role</Label>
          <Label className="font-bold">Status</Label>
          <Label className="font-bold">Edit</Label>
          <Label className="font-bold">Practice</Label>
          <Label className="font-bold">Rating</Label>
        </div>
        {isLoading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          data.items.map((item, index) => (
            <div
              className="grid grid-cols-6 mb-4"
              key={`${item.username}-${index}`}
            >
              <Label>{item.username}</Label>
              <Label>{RoleMap[item.role]?.label}</Label>
              <Label>{item.status}</Label>
              <Link
                href={`/settings/users/${item._id}`}
                className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
              >
                Edit
              </Link>
              <div>
                <Button
                  size="xs"
                  outline
                  onClick={() => resetPracticeHistory(item._id!)}
                >
                  Reset practice
                </Button>
              </div>
              <div>
                <Button
                  size="xs"
                  outline
                  onClick={() => resetRatingHistory(item._id!)}
                >
                  Reset rating
                </Button>
              </div>
            </div>
          ))
        )}
      </DndProvider>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={data?.lastPage || 1}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};
