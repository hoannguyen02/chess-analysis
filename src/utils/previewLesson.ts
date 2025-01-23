import { Lesson } from '@/types/lesson';

export const previewLesson = (lesson: Lesson) => {
  const encodedData = encodeURIComponent(JSON.stringify(lesson));
  window.open(`/settings/lessons/preview?data=${encodedData}`, '_blank');
};
