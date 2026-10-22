export const drawLevels = ['A', 'B', 'C', 'C*', 'D'] as const;
export type DrawLevel = (typeof drawLevels)[number];
export type DrawDifficulty = {
  level: DrawLevel;
  reason: string;
  status: 'suggested';
  solverMoves: number;
  sacrificeCount: number;
};
export const drawLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Nhận biết — một nước rõ ràng, mẫu cơ bản.',
  B: 'Phối hợp đơn giản — tính ngắn hoặc giữ một vùng phòng thủ quen thuộc.',
  C: 'Hy sinh đơn giản — nhường vật chất với mục đích rõ trong đoạn đã chơi.',
  'C*': 'Tính trước — so sánh các nhánh hoặc phối hợp nhiều nước; chưa xác nhận hy sinh.',
  D: 'Chiến thuật nâng cao — hy sinh phức tạp và tính hơn 3 nước của bên giải.',
};

export function filterDrawLevel<T extends { difficulty?: DrawDifficulty }>(
  exercises: T[],
  level: DrawLevel | 'all'
): T[] {
  return level === 'all'
    ? exercises
    : exercises.filter((exercise) => exercise.difficulty?.level === level);
}
