export const drawLevels = ['A', 'B', 'C', 'C*', 'D', 'D*', 'E', 'E*'] as const;
export type DrawLevel = (typeof drawLevels)[number];
export const beginnerSourceLevels: readonly DrawLevel[] = drawLevels.filter(
  (level) => level !== 'A'
);
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
  'C*': 'Không thí quân. Cần tính 2–3 nước của mình để xử lý nước phòng thủ mạnh.',
  D: 'Thí quân phức tạp và phối hợp quân trong 4–5 nước của mình.',
  'D*': 'Không thí quân. Cần tính 4–5 nước của mình để đạt mục tiêu trước nước phòng thủ mạnh.',
  E: 'Thí quân phức tạp và phối hợp quân trong ít nhất 6 nước của mình.',
  'E*': 'Không thí quân. Cần tính ít nhất 6 nước của mình để đạt mục tiêu trước nước phòng thủ mạnh.',
};

export function filterDrawLevel<T extends { difficulty?: DrawDifficulty }>(
  exercises: T[],
  level: DrawLevel | 'all'
): T[] {
  return level === 'all'
    ? exercises
    : exercises.filter((exercise) => exercise.difficulty?.level === level);
}
