import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import axiosInstance from '@/utils/axiosInstance';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Progress {
  completedPuzzles: string[];
  completedPuzzlesCount: number;
  completedAtVersion: number;
}

const DefaultProgress: Progress = {
  completedPuzzles: [],
  completedPuzzlesCount: 0,
  completedAtVersion: 1,
};
export const useLessonProgress = (
  lessonId: string,
  version: number,
  currentPuzzles: string[] = []
) => {
  const [progress, setProgress] = useState<Progress>(DefaultProgress);

  const { addToast } = useToast();

  const t = useTranslations();

  const { session } = useAppContext();

  const userId = useMemo(() => session?.id, [session]);

  // Load progress on mount
  const isFetching = useRef(false);
  useEffect(() => {
    const loadLocalProgress = () => {
      const localProgressRaw = JSON.parse(
        localStorage.getItem(`lesson_${lessonId}`) || 'null'
      ) as Progress | null;

      if (!localProgressRaw) return DefaultProgress;

      const { completedAtVersion, completedPuzzles } = localProgressRaw;

      if (completedAtVersion !== version) {
        const currentPuzzleSet = new Set(currentPuzzles);
        const filteredPuzzles = completedPuzzles.filter((id) =>
          currentPuzzleSet.has(id)
        );

        return {
          completedPuzzles: filteredPuzzles,
          completedPuzzlesCount: filteredPuzzles.length,
          completedAtVersion: version,
        };
      }

      return localProgressRaw;
    };

    const fetchProgress = async (localProgress: Progress) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        if (userId) {
          const response = await axiosInstance.get(
            `/v1/lessons/public/progress/${lessonId}`
          );
          const dbProgress: Progress = response.data;
          const isSynced = localStorage.getItem(`synced_${lessonId}`);

          if (isSynced) {
            setProgress((prevProgress) => {
              if (JSON.stringify(prevProgress) !== JSON.stringify(dbProgress)) {
                return dbProgress;
              }
              return prevProgress;
            });
            return;
          }

          const mergedPuzzles = Array.from(
            new Set([
              ...dbProgress.completedPuzzles,
              ...localProgress.completedPuzzles,
            ])
          );
          const mergedProgress = {
            completedPuzzles: mergedPuzzles,
            completedPuzzlesCount: mergedPuzzles.length,
            completedAtVersion: version,
          };

          const newPuzzles = mergedPuzzles.filter(
            (id) => !dbProgress.completedPuzzles.includes(id)
          );

          if (newPuzzles.length > 0) {
            await axiosInstance.post(
              `/v1/lessons/public/progress/${lessonId}`,
              { userId, completedPuzzles: newPuzzles, version }
            );
          }

          localStorage.setItem(`synced_${lessonId}`, 'true');
          localStorage.removeItem(`lesson_${lessonId}`);

          setProgress((prevProgress) => {
            if (
              JSON.stringify(prevProgress) !== JSON.stringify(mergedProgress)
            ) {
              return mergedProgress;
            }
            return prevProgress;
          });
        } else {
          setProgress((prevProgress) => {
            if (
              JSON.stringify(prevProgress) !== JSON.stringify(localProgress)
            ) {
              return localProgress;
            }
            return prevProgress;
          });
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error('Progress not found, defaulting to empty progress.');
          setProgress((prevProgress) => {
            if (
              JSON.stringify(prevProgress) !== JSON.stringify(localProgress)
            ) {
              return localProgress;
            }
            return prevProgress;
          });
        } else {
          console.error('Unexpected error:', err);
        }
      } finally {
        isFetching.current = false;
      }
    };

    const localProgress = loadLocalProgress();
    fetchProgress(localProgress);
  }, [currentPuzzles, lessonId, userId, version]);

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
          version,
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
