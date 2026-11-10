import { drawLevelDescriptions, type DrawLevel } from './draw-levels';
export const simplificationLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Đổi quân trực tiếp, đánh giá tàn cuộc còn lại.',
  B: 'Chuẩn bị một chuỗi đổi quân ngắn.',
  C: 'Nhường vật chất để chuyển sang tàn cuộc có lợi.',
};
