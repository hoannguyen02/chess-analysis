import { ConfirmModal } from '@/components/ConfirmModal';
import DebouncedInput from '@/components/DebounceInput';
import { TitlePage } from '@/components/TitlePage';
import { StatusOptions } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useDialog from '@/hooks/useDialog';
import { StatusType } from '@/types/status';
import { Role, User } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import { checkIsSubscriptionExpired } from '@/utils/checkIsSubscriptionExpired';
import { filteredQuery } from '@/utils/filteredQuery';
import { handleSubmission } from '@/utils/handleSubmission';
import { Button, Label, Pagination, Spinner, Tooltip } from 'flowbite-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import Select from 'react-select';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';

type Props = {
  roles: Role[];
};

type ConfirmData = {
  userId: string;
  username: string;
  type: 'delete' | 'reset-practice' | 'reset-rating' | 'make-subscription';
};

export const UserListScreen = ({ roles }: Props) => {
  const { apiDomain } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusType | ''>('');
  const [username, setUsername] = useState<string | ''>('');
  const [role, setRole] = useState<string>();

  const {
    open,
    onOpenDialog,
    onCloseDialog,
    data: confirmData,
  } = useDialog<ConfirmData>();

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

  const { data, error, isLoading, mutate } = useSWR<{
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

  const handleOnOk = async () => {
    if (!confirmData) return;
    const { type, userId } = confirmData;
    switch (type) {
      case 'reset-practice':
        await handleSubmission(
          async () => {
            return await axiosInstance.delete(
              `${apiDomain}/v1/practice-puzzle/history/reset/${userId}`
            );
          },
          addToast,
          'Practice history reset successfully!'
        );
        break;
      case 'delete':
        await handleSubmission(
          async () => {
            return await axiosInstance.delete(
              `${apiDomain}/v1/users/${userId}`
            );
          },
          addToast,
          'User delete successfully!'
        );
        break;
      case 'make-subscription':
        await handleSubmission(
          async () => {
            return await axiosInstance.put(
              `${apiDomain}/v1/users/make-subscription/${userId}`,
              {
                username,
              }
            );
          },
          addToast,
          'User delete successfully!'
        );
        break;
      case 'reset-rating':
        await handleSubmission(
          async () => {
            return await axiosInstance.delete(
              `${apiDomain}/v1/solve-puzzle/history/reset/${userId}`
            );
          },
          addToast,
          'Rating history reset successfully!'
        );
        break;

      default:
        break;
    }

    mutate();
    onCloseDialog();
  };

  const confirmContent = useMemo(() => {
    if (!confirmData) return '';

    const { type, username } = confirmData;
    switch (type) {
      case 'make-subscription':
        return `Are you sure you want to MAKE SUBSCRIPTION this user: ${username}`;
      case 'delete':
        return `Are you sure you want to DELETE this user: ${username}`;
      case 'reset-practice':
        return `Are you sure you want to RESET PRACTICE this user: ${username}`;
      case 'reset-rating':
        return `Are you sure you want to RESET RATING HISTORY for this user: ${username}`;

      default:
        break;
    }
  }, [confirmData]);

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

      <div className="">
        <div className="grid grid-cols-[200px_120px_120px_120px_160px_160px_160px_160px] mb-4 text-center">
          <Label className="font-bold">Username</Label>
          <Label className="font-bold">Role</Label>
          <Label className="font-bold">Status</Label>
          <Label className="font-bold">Edit</Label>
          <Label className="font-bold">Practice</Label>
          <Label className="font-bold">Rating</Label>
          <Label className="font-bold">Remove</Label>
          <Label className="font-bold">Make subscription</Label>
        </div>
        {isLoading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          data.items.map((item, index) => {
            const isExpired = checkIsSubscriptionExpired(item?.subscriptionEnd);
            return (
              <div
                className="grid grid-cols-[200px_120px_120px_120px_160px_160px_160px_160px] mb-4 text-center"
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
                <div className="flex w-full justify-center">
                  <Button
                    size="xs"
                    outline
                    onClick={() =>
                      onOpenDialog({
                        type: 'reset-practice',
                        userId: item._id!,
                        username: item.username,
                      })
                    }
                  >
                    Reset practice
                  </Button>
                </div>
                <div className="flex w-full justify-center">
                  <Button
                    size="xs"
                    outline
                    onClick={() =>
                      onOpenDialog({
                        type: 'reset-rating',
                        userId: item._id!,
                        username: item.username,
                      })
                    }
                  >
                    Reset rating
                  </Button>
                </div>
                <div className="flex w-full justify-center">
                  <Button
                    size="xs"
                    outline
                    onClick={() =>
                      onOpenDialog({
                        type: 'delete',
                        userId: item._id!,
                        username: item.username,
                      })
                    }
                  >
                    Delete / Remove
                  </Button>
                </div>
                <div className="flex w-full justify-center">
                  <Tooltip
                    placement="top"
                    content="Thưc hiện nút này sau khi user mua gói nâng cao"
                  >
                    <Button
                      size="xs"
                      outline
                      gradientDuoTone="tealToLime"
                      disabled={!isExpired}
                      onClick={() =>
                        onOpenDialog({
                          type: 'make-subscription',
                          userId: item._id!,
                          username: item.username,
                        })
                      }
                    >
                      Make
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={data?.lastPage || 1}
          onPageChange={onPageChange}
        />
      </div>
      {open && (
        <ConfirmModal onClose={onCloseDialog} onOk={handleOnOk}>
          {confirmContent}
        </ConfirmModal>
      )}
    </>
  );
};
