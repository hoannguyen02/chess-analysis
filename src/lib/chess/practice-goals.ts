export const practiceGoalLabels = {
  material: 'Thắng vật chất',
  checkmate: 'Chiếu hết',
  win: 'Giành thế thắng',
  draw: 'Hòa',
  defend: 'Hóa giải đe dọa',
  equalize: 'Cân bằng thế cờ',
  keepAdvantage: 'Giữ lợi thế',
} as const;

export type PracticeGoal = keyof typeof practiceGoalLabels;

export function isPracticeGoal(value: unknown): value is PracticeGoal {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(practiceGoalLabels, value)
  );
}
