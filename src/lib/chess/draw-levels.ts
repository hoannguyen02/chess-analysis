export const drawLevels = ['A', 'B', 'C', 'C*', 'D'] as const;
export type DrawLevel = (typeof drawLevels)[number];
// Catalog spelling includes Beginner; exercise storage keeps beginner: true.
export const practiceLevels = ['Beginner', ...drawLevels] as const;
export type PracticeLevel = (typeof practiceLevels)[number];
export type DrawDifficulty = {
  level: DrawLevel;
  reason: string;
  status: 'suggested' | 'manual';
  solverMoves: number;
  sacrificeCount?: number;
};
export const drawLevelDescriptions: Record<DrawLevel, string> = {
  A: 'Nhận biết — một nước rõ ràng, mẫu cơ bản.',
  B: 'Phối hợp đơn giản — tính ngắn hoặc giữ một vùng phòng thủ quen thuộc.',
  C: 'Thí quân đơn giản — nhường vật chất để đạt mục tiêu của bài.',
  'C*': 'Tính trước — không thí quân, cần tính xa hơn B từ hai đến ba nước.',
  D: 'Chiến thuật nâng cao — thí quân phức tạp và tính hơn 3 nước của mình.',
};

export function filterDrawLevel<T extends { difficulty?: DrawDifficulty }>(
  exercises: T[],
  level: DrawLevel | 'all'
): T[] {
  return level === 'all'
    ? exercises
    : exercises.filter((exercise) => exercise.difficulty?.level === level);
}
