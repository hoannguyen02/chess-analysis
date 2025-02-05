import { useAppContext } from '@/contexts/AppContext';
import axiosInstance from '@/utils/axiosInstance';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Progress {
  completedLessons: string[];
  completedAtVersion: number;
}

const DefaultProgress: Progress = {
  completedLessons: [],
  completedAtVersion: 1,
};
export const useCourseProgress = (
  courseId: string,
  version: number,
  currentLessons: string[] = []
) => {
  const [progress, setProgress] = useState<Progress>(DefaultProgress);

  const { session } = useAppContext();

  const userId = useMemo(() => session?.id, [session]);

  // Load progress on mount
  const isFetching = useRef(false);
  useEffect(() => {
    const loadLocalProgress = () => {
      const completedLessons = JSON.parse(
        localStorage.getItem('completed_lessonIds') || '[]'
      );

      if (!completedLessons?.length) return DefaultProgress;

      const currentLessonSet = new Set(currentLessons);
      const filteredLessons = completedLessons.filter((id: string) =>
        currentLessonSet.has(id)
      );

      return {
        completedLessons: filteredLessons,
        completedAtVersion: version,
      };
    };

    const fetchProgress = async (localProgress: Progress) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        if (userId) {
          const response = await axiosInstance.get(
            `/v1/courses/public/progress/${courseId}`
          );
          const dbProgress: Progress = response.data || localProgress;

          setProgress(dbProgress);
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
  }, [currentLessons, courseId, userId, version]);

  return { progress };
};
