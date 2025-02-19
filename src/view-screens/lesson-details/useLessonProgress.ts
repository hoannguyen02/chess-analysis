import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { LessonProgress } from '@/types';
import axiosInstance from '@/utils/axiosInstance';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

const DefaultProgress: LessonProgress = {
  completedPuzzles: [],
  completedAtVersion: 1,
};
export const useLessonProgress = (
  lessonId: string,
  version: number,
  currentPuzzles: string[] = [],
  totalPuzzles: number
) => {
  const [progress, setProgress] = useState<LessonProgress>(DefaultProgress);

  const { addToast } = useToast();

  const t = useTranslations();

  const { session } = useAppContext();

  const userId = useMemo(() => session?.id, [session]);

  const completedPuzzleMap = useMemo(() => {
    const map = new Map<string, boolean>();
    progress.completedPuzzles.forEach((cur) => map.set(cur, true));
    return map;
  }, [progress.completedPuzzles]);

  // Load progress on mount
  const isFetching = useRef(false);
  useEffect(() => {
    const loadLocalProgress = () => {
      const localProgressRaw = JSON.parse(
        localStorage.getItem(`lesson_${lessonId}`) || 'null'
      ) as LessonProgress | null;

      if (!localProgressRaw) return DefaultProgress;

      const { completedAtVersion, completedPuzzles } = localProgressRaw;

      if (completedAtVersion !== version) {
        const currentPuzzleSet = new Set(currentPuzzles);
        const filteredPuzzles = completedPuzzles.filter((id) =>
          currentPuzzleSet.has(id)
        );

        return {
          completedPuzzles: filteredPuzzles,
          completedAtVersion: version,
        };
      }

      return localProgressRaw;
    };

    const fetchProgress = async (localProgress: LessonProgress) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        if (userId) {
          const response = await axiosInstance.get(
            `/v1/lessons/public/progress/${lessonId}`
          );
          const dbProgress: LessonProgress = response.data || DefaultProgress;
          const isSynced = localStorage.getItem(`synced_${lessonId}`);

          if (isSynced) {
            setProgress(dbProgress);
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
          setProgress(mergedProgress);
        } else {
          setProgress(localProgress);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error('Progress not found, defaulting to empty progress.');
          setProgress(localProgress);
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

    const updatedProgress: LessonProgress = {
      completedPuzzles: [...progress.completedPuzzles, puzzleId],
      completedAtVersion: progress.completedAtVersion,
      lessonId,
    };

    setProgress(updatedProgress);

    try {
      if (userId) {
        // Save progress to the server
        await axiosInstance.post(`/v1/lessons/public/progress/${lessonId}`, {
          userId,
          completedPuzzles: [puzzleId],
          version,
          totalPuzzles,
        });
      } else {
        // Save progress to local storage
        localStorage.setItem(
          `lesson_${lessonId}`,
          JSON.stringify(updatedProgress)
        );

        if (updatedProgress.completedPuzzles.length === totalPuzzles) {
          // Retrieve the existing list from localStorage
          const completedLessons = JSON.parse(
            localStorage.getItem('completed_lessonIds') || '[]'
          );

          // Check if the lessonId is already in the list
          if (!completedLessons.includes(lessonId)) {
            // Add the new lessonId to the list
            completedLessons.push(lessonId);

            // Save the updated list back to localStorage
            localStorage.setItem(
              'completed_lessonIds',
              JSON.stringify(completedLessons)
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
      addToast(t('solve-puzzle.message.save-progress-failed'), 'error');
    }
  };

  return { progress, saveProgress, completedPuzzleMap };
};
