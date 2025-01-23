import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { StatusType } from '@/types/status';
import { Role, UserExpanded } from '@/types/user';
import axiosInstance from '@/utils/axiosInstance';
import getDiffBetweenTwoObjects from '@/utils/getDiffBetweenTwoObjects';
import { handleSubmission } from '@/utils/handleSubmission';
import { Label, Select, TextInput } from 'flowbite-react';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type CreateUserFormValues = {
  username: string;
  role: string;
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  _id?: string;
  status?: StatusType;
};

type Props = {
  roles: Role[];
  user?: UserExpanded;
};
export const CreateUserForm = ({ roles, user }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { apiDomain } = useAppContext();
  const { addToast } = useToast();
  const t = useTranslations();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    defaultValues: user
      ? {
          username: user.username,
          role: user.role?._id,
          subscriptionStart: user.subscriptionStart
            ? DateTime.fromISO(user.subscriptionStart).toISODate()
            : undefined,
          subscriptionEnd: user.subscriptionEnd
            ? DateTime.fromISO(user.subscriptionEnd).toISODate()
            : undefined,
          status: user.status,
        }
      : {
          username: '',
          role: '',
        },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    const { username, role, subscriptionEnd, subscriptionStart, status } =
      values;
    setIsSubmitting(true);
    const result = await handleSubmission(
      async () => {
        if (user?._id) {
          const formattedStart = user?.subscriptionStart
            ? DateTime.fromISO(user.subscriptionStart).toISODate()
            : undefined;
          const formattedEnd = user?.subscriptionEnd
            ? DateTime.fromISO(user.subscriptionEnd).toISODate()
            : undefined;
          const diff = getDiffBetweenTwoObjects(
            {
              username,
              role,
              subscriptionStart,
              subscriptionEnd,
              status,
            },
            {
              username: user?.username,
              role: user?.role?._id,
              subscriptionStart: formattedStart,
              subscriptionEnd: formattedEnd,
              status: user?.status,
            }
          );

          return await axiosInstance.put(
            `${apiDomain}/v1/users/${user._id}`,
            diff.newValue
          );
        } else {
          return await axiosInstance.post(`${apiDomain}/v1/users`, {
            username,
            role,
          });
        }
      },
      addToast, // Pass addToast to show toast notifications
      t('common.title.success') // Success message
    );

    setIsSubmitting(false);

    if (result !== undefined && !user?._id) {
      router.push(`/settings/users/${result.data?._id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
      <div className="mb-4">
        <Label htmlFor="username" value="Username(email)" />
        <TextInput
          id="username"
          type="email"
          {...register('username', {
            required: 'This is required',
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: 'Username is invalid',
            },
          })}
          color={errors.username ? 'failure' : undefined} // Error styling
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
      </div>

      <div className="flex items-center mb-4">
        <Label htmlFor="role" value="Role" />
        <Select className="ml-2" id="role" required {...register('role')}>
          <option value="">Select a role...</option>
          {roles.map((role) => (
            <option key={role.label} value={role.value}>
              {role.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="subscriptionStart" value="Subscription Start Date" />
        <TextInput
          id="subscriptionStart"
          type="date"
          {...register('subscriptionStart')}
          color={errors.subscriptionStart ? 'failure' : undefined}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="subscriptionEnd" value="Subscription End Date" />
        <TextInput
          id="subscriptionEnd"
          type="date"
          {...register('subscriptionEnd')}
          color={errors.subscriptionEnd ? 'failure' : undefined}
        />
      </div>

      <div className="flex justify-center mt-8">
        <PrimaryButton disabled={isSubmitting} type="submit">
          Submit
        </PrimaryButton>
      </div>
    </form>
  );
};
