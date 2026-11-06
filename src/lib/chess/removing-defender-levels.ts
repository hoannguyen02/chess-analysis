import type { DrawLevel } from './draw-levels';

export const removingDefenderLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Loại bỏ quân bảo vệ trực tiếp trong phương án ngắn.',
  B: 'Phối hợp hoặc chuẩn bị ngắn để loại bỏ quân bảo vệ.',
  C: 'Thí quân đơn giản để loại bỏ quân bảo vệ.',
  'C*': 'Không thí quân; tính sâu hơn cấp B thêm 2–3 nước của mình.',
  D: 'Thí quân phức tạp và tính hơn ba nước của mình.',
};
