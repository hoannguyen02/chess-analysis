import { drawLevelDescriptions, type DrawLevel } from './draw-levels';
export const pinLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Khai thác đòn ghim trực tiếp trong phương án ngắn.',
  B: 'Phối hợp đơn giản để khai thác quân bị ghim.',
  C: 'Thí quân đơn giản để khai thác đòn ghim.',
};
