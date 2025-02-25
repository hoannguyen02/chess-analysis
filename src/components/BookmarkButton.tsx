import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import axiosInstance from '@/utils/axiosInstance';
import { handleSubmission } from '@/utils/handleSubmission';
import { Button, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { VscBookmark } from 'react-icons/vsc';

export const BookmarkButton = ({ puzzleId }: { puzzleId: string }) => {
  const { bookmarks, apiDomain, mutateBookmark } = useAppContext();
  const t = useTranslations('solve-puzzle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const isBookmarked = useMemo(
    () => bookmarks.some((b) => b._id === puzzleId),
    [bookmarks, puzzleId]
  );

  const handleBookmark = async () => {
    setIsSubmitting(true);
    if (isBookmarked) {
      await handleSubmission(
        async () => {
          return await axiosInstance.delete(
            `${apiDomain}/v1/bookmarks/${puzzleId}`
          );
        },
        addToast, // Pass addToast to show toast notifications
        t('message.puzzle_remove_bookmarked') // Success message
      );
    } else {
      await handleSubmission(
        async () => {
          return await axiosInstance.post(
            `${apiDomain}/v1/bookmarks/${puzzleId}`
          );
        },
        addToast, // Pass addToast to show toast notifications
        t('message.puzzle_bookmarked') // Success message
      );
    }
    setIsSubmitting(false);
    mutateBookmark();
  };

  return (
    <Tooltip
      content={isBookmarked ? t('button.un-bookmark') : t('button.bookmark')}
      placement="top"
    >
      <Button
        outline
        color="primary"
        onClick={handleBookmark}
        disabled={isSubmitting}
        className={`mr-2 transition-all duration-200 ${
          isBookmarked ? 'border-yellow-500 bg-yellow-100' : 'border-gray-400'
        } hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        isProcessing={isSubmitting}
      >
        <VscBookmark
          color={isBookmarked ? '#FFD700' : '#B0B0B0'}
          size={20}
          className={`ml-1 transition-all duration-300 ${
            isBookmarked ? 'scale-110' : 'scale-100'
          }`}
        />
      </Button>
    </Tooltip>
  );
};
