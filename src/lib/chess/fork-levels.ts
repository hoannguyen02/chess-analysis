import { drawLevelDescriptions, type DrawLevel } from './draw-levels';
export const forkLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Tạo đòn tấn công đôi rồi bắt quân trong phương án ngắn.',
  B: 'Chuẩn bị đơn giản trước khi tạo đòn tấn công đôi.',
  C: 'Thí quân đơn giản để tạo đòn tấn công đôi.',
};
