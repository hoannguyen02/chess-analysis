export type TagType = 'Lesson' | 'Course' | 'Global';
export type Tag = {
  name: string;
  type: TagType;
  value: string;
  label: string;
  _id: string;
};
