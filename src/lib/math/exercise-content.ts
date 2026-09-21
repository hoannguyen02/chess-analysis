import type { MathExercise } from './lessons';

export type ExercisePrompt = Pick<MathExercise, 'prompt' | 'inputInstruction'>;

// These are snapshots of the original examples. Keep them stable for upgrading
// old saves, imports and shared links; new questions author the fields directly.
export const builtInExercisePrompts = {
  integerTemperature: {
    prompt:
      'Nhiệt độ ban đầu là -4 °C, sau đó tăng 9 °C. Nhiệt độ mới bằng bao nhiêu °C?',
    inputInstruction: 'Chỉ nhập số.',
  },
  integerDiver: {
    prompt:
      'Một thợ lặn đang ở độ cao -12 m so với mực nước biển, rồi lặn xuống thêm 7 m. Độ cao mới là bao nhiêu mét?',
    inputInstruction: 'Chỉ nhập số.',
  },
  integerGame: {
    prompt:
      'Một trò chơi cho 5 điểm mỗi câu đúng và trừ 2 điểm mỗi câu sai. An đúng 4 câu, sai 3 câu. An được bao nhiêu điểm?',
    inputInstruction: 'Chỉ nhập số.',
  },
  integerPenalty: {
    prompt:
      'Một đội bị trừ 3 điểm mỗi lần phạm lỗi. Sau 4 lần phạm lỗi, tổng thay đổi điểm là bao nhiêu?',
    inputInstruction: 'Nhập số nguyên có dấu phù hợp.',
  },
  rationalTemperature: {
    prompt:
      'Nhiệt độ ban đầu là -2,5 °C, sau đó tăng 3,75 °C. Nhiệt độ mới bằng bao nhiêu °C?',
    inputInstruction: 'Chỉ nhập số.',
  },
  rationalWater: {
    prompt:
      'Bình có 3/4 lít nước. Rót ra 1/3 lít rồi thêm 1/6 lít. Còn bao nhiêu lít?',
    inputInstruction: 'Nhập phân số.',
  },
  rationalDistance: {
    prompt:
      'Một bạn đi 2/5 km rồi đi thêm 3/4 km. Tổng quãng đường là bao nhiêu km?',
    inputInstruction: 'Nhập phân số.',
  },
  rationalMoney: {
    prompt:
      'Tài khoản có 150 nghìn đồng, chi 62,5 nghìn rồi nhận 20 nghìn. Còn bao nhiêu nghìn đồng?',
    inputInstruction: 'Chỉ nhập số.',
  },
} satisfies Record<string, ExercisePrompt>;

const legacyPrompts = new Map(
  Object.values(builtInExercisePrompts).map((content) => [
    `${content.prompt} ${content.inputInstruction}`,
    content,
  ])
);

export function migrateLegacyExerciseContent<
  T extends ExercisePrompt & { skill?: string },
>(exercise: T): T {
  if (exercise.inputInstruction !== undefined) return exercise;
  // Exact historical records only: never strip phrases or infer a boundary in
  // teacher-authored text. The PDF renderer doesn't perform this migration.
  const content = legacyPrompts.get(exercise.prompt);
  if (!content) return exercise;
  return {
    ...exercise,
    ...content,
    ...(exercise.skill === exercise.prompt ? { skill: content.prompt } : {}),
  };
}
