import { drawLevelDescriptions, type DrawLevel } from './draw-levels';

export const skewerLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Đòn xiên trực tiếp, rồi bắt quân phía sau; không cần chuẩn bị hoặc thí quân.',
  B: 'Một nước chuẩn bị đơn giản để tạo đòn xiên; không thí quân.',
  C: 'Thí quân đơn giản để tạo đòn xiên, với phương án ngắn và rõ.',
};
