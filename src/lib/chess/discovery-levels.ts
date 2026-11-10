import { drawLevelDescriptions, type DrawLevel } from './draw-levels';
export const discoveryLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Mở đường tấn công và thu lợi trong phương án ngắn.',
  B: 'Chuẩn bị đơn giản trước khi mở đường tấn công.',
  C: 'Thí quân đơn giản để khai thác đòn mở.',
};
