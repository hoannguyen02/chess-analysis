import { drawLevelDescriptions, type DrawLevel } from './draw-levels';

export const removingDefenderLevelDescriptions: Record<DrawLevel, string> = {
  ...drawLevelDescriptions,
  A: 'Loại bỏ quân bảo vệ trực tiếp trong phương án ngắn.',
  B: 'Phối hợp hoặc chuẩn bị ngắn để loại bỏ quân bảo vệ.',
  C: 'Thí quân đơn giản để loại bỏ quân bảo vệ.',
};
