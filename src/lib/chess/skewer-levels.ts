import type { DrawLevel } from './draw-levels';

export const skewerLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Đòn xiên trực tiếp, rồi bắt quân phía sau; không cần chuẩn bị hoặc thí quân.',
  B: 'Một nước chuẩn bị đơn giản để tạo đòn xiên; không thí quân.',
  C: 'Thí quân đơn giản để tạo đòn xiên, với phương án ngắn và rõ.',
  'C*': 'Không thí quân; tính sâu hơn cấp B thêm 2–3 nước của bên giải.',
  D: 'Thí quân phức tạp, phối hợp nhiều ý tưởng và hơn 3 nước của bên giải.',
};
