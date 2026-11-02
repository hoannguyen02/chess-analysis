import type { DrawLevel } from './draw-levels';
export const simplificationLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Đổi quân trực tiếp, đánh giá tàn cuộc còn lại.',
  B: 'Chuẩn bị một chuỗi đổi quân ngắn.',
  C: 'Nhường vật chất để chuyển sang tàn cuộc có lợi.',
  'C*': 'Tính trước nhiều nước đổi quân, không hy sinh.',
  D: 'Hy sinh và phối hợp hơn ba nước trước khi đơn giản hóa.',
};
