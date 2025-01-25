import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import axiosInstance from '@/utils/axiosInstance';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

interface Progress {
  completedPuzzles: string[];
  completedPuzzlesCount: number;
  completedAtVersion: number;
}

export const useLessonProgress = (lessonId: string) => {
  const [progress, setProgress] = useState<Progress>({
    completedPuzzles: [],
    completedPuzzlesCount: 0,
    completedAtVersion: 1,
  });

  const { addToast } = useToast();

  const t = useTranslations();

  const { session } = useAppContext();

  const userId = useMemo(() => session?.id, [session]);

  // Load progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        if (userId) {
          // 1. Fetch progress from the server
          const response = await axiosInstance.get(
            `/v1/lessons/public/progress/${lessonId}?userId=${userId}`
          );
          const dbProgress: Progress = await response.data;
          const isSynced = localStorage.getItem(`synced_${lessonId}`);
          // Check if user synced successfully previously
          if (isSynced) {
            setProgress(dbProgress);
            return;
          }
          // 2. Fetch progress from localStorage (guest progress)
          const localProgressRaw = localStorage.getItem(`lesson_${lessonId}`);
          const localProgress = localProgressRaw
            ? JSON.parse(localProgressRaw)
            : {
                completedPuzzles: [],
                completedPuzzlesCount: 0,
                completedAtVersion: 1,
              };

          // 3. Merge localProgress with dbProgress
          const mergedPuzzles = Array.from(
            new Set([
              ...dbProgress.completedPuzzles,
              ...localProgress.completedPuzzles,
            ])
          );
          const mergedProgress = {
            completedPuzzles: mergedPuzzles,
            completedPuzzlesCount: mergedPuzzles.length,
            completedAtVersion: progress.completedAtVersion,
          };

          // 4. Update the database with merged progress if there are new puzzles
          const newPuzzles = mergedPuzzles.filter(
            (puzzleId) => !dbProgress.completedPuzzles.includes(puzzleId)
          );
          if (newPuzzles.length > 0) {
            await axiosInstance.post(
              `/v1/lessons/public/progress/${lessonId}`,
              {
                userId,
                completedPuzzles: [newPuzzles],
              }
            );
          }

          // 5. Set sync & clear localStorage after syncing
          localStorage.setItem(`synced_${lessonId}`, 'true');
          localStorage.removeItem(`lesson_${lessonId}`);

          // 6. Update progress state with merged progress
          setProgress(mergedProgress);
        } else {
          // Fetch progress from local storage
          const localProgress = JSON.parse(
            localStorage.getItem(`lesson_${lessonId}`) || 'null'
          ) as Progress | null;

          setProgress(
            localProgress || {
              completedPuzzles: [],
              completedPuzzlesCount: 0,
              completedAtVersion: 1,
            }
          );
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    };

    fetchProgress();
  }, [lessonId, progress.completedAtVersion, userId]);

  // Save progress
  const saveProgress = async (puzzleId: string) => {
    if (progress.completedPuzzles.includes(puzzleId)) return;

    const updatedProgress: Progress = {
      completedPuzzles: [...progress.completedPuzzles, puzzleId],
      completedPuzzlesCount: progress.completedPuzzlesCount + 1,
      completedAtVersion: progress.completedAtVersion,
    };

    setProgress(updatedProgress);

    try {
      if (userId) {
        // Save progress to the server
        await axiosInstance.post(`/v1/lessons/public/progress/${lessonId}`, {
          userId,
          completedPuzzles: [puzzleId],
        });
      } else {
        // Save progress to local storage
        localStorage.setItem(
          `lesson_${lessonId}`,
          JSON.stringify(updatedProgress)
        );
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
      addToast(t('solve-puzzle.message.save-progress-failed'), 'error');
    }
  };

  return { progress, saveProgress };
};
