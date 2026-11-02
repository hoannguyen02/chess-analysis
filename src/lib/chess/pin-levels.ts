import type { DrawLevel } from './draw-levels';
export const pinLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Khai thác đòn ghim trực tiếp trong phương án ngắn.',
  B: 'Phối hợp đơn giản để khai thác quân bị ghim.',
  C: 'Thí quân đơn giản để khai thác đòn ghim.',
  'C*': 'Không thí quân; tính sâu hơn cấp B thêm 2–3 nước của bên giải.',
  D: 'Thí quân phức tạp và tính hơn ba nước của bên giải.',
};
