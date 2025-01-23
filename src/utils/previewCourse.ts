import { Course } from '@/types/course';

export const previewCourse = (course: Course) => {
  const encodedData = encodeURIComponent(JSON.stringify(course));
  window.open(`/settings/course/preview?data=${encodedData}`, '_blank');
};
