export type TagType = 'Lesson' | 'Global';
export type Tag = {
  name: string;
  title?: {
    en: string;
    vi: string;
  };
  type: TagType;
  value: string;
  label: string;
  _id: string;
};
