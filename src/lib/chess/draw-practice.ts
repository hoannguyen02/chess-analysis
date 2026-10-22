import type { DrawDifficulty } from './draw-levels';
import { drawLevelRatings } from './draw-level-ratings';
import { expandedDrawExercises } from './draw-expansion';
import { realRepetitionExercises } from './real-repetition';

export type DrawExercise = {
  gameReference?: { id: string; kind: string; ply: number; branch: number };
  difficulty?: DrawDifficulty;
  // Only populate when the source provides the actual preceding position/move.
  // fen remains the position at which the student starts solving.
  previousMove?: { fen: string; move: string };
  mode?: 'interactive' | 'study' | 'analysis' | 'recognition';
  forcedReplies?: boolean;
  title: string;
  prompt: string;
  fen: string;
  moves: string[];
  outcome: 'repetition' | 'stalemate' | 'material' | 'checkmate' | 'fortress';
  solution: string;
  url?: string;
  source?: string;
};

export type DrawCategory = {
  id: string;
  title: string;
  description: string;
  exercises: DrawExercise[];
};

// Active exercises come exclusively from complete, recorded drawn games.
const sourceDrawCategories: DrawCategory[] = [
  {
    id: 'perpetual-check',
    title: 'Chiếu vĩnh viễn',
    description:
      'Tìm chuỗi chiếu để cứu hòa trong ván đấu thực tế. Cùng thế cờ xuất hiện 3 lần thì được yêu cầu hòa; 5 lần thì tự động hòa. Phải cùng bên đến lượt và cùng quyền đi quân. Các nước đáp là diễn biến đã chơi, không nhất thiết bị bắt buộc.',
    exercises: expandedDrawExercises['perpetual-check'],
  },
  {
    id: 'stalemate',
    title: 'Bẫy hết nước đi',
    description:
      'Tìm cơ hội cứu hòa bằng hết nước đi trong ván đấu thực tế. Bên đến lượt không bị chiếu nhưng không còn nước hợp lệ thì ván cờ hòa. Đối thủ không nhất thiết bị buộc phải mắc bẫy.',
    exercises: expandedDrawExercises.stalemate,
  },
  {
    id: 'insufficient-material',
    title: 'Đổi quân về thế không đủ lực chiếu hết',
    description:
      'Tìm nước đổi hoặc bắt quân cuối cùng để đưa ván đấu về thế không thể chiếu hết bằng bất kỳ chuỗi nước hợp lệ nào. Không ép được chiếu hết chưa chắc là không thể chiếu hết.',
    exercises: expandedDrawExercises['insufficient-material'],
  },
  {
    id: 'repetition',
    title: 'Lặp lại thế cờ không cần chiếu',
    description:
      'Các thế lấy từ ván đấu thực tế có kết quả hòa. Tìm chuỗi lặp lại không chiếu đã được chơi; cùng thế xuất hiện 3 lần thì được yêu cầu hòa. Các nước đáp là diễn biến ván đấu, không nhất thiết bị bắt buộc.',
    exercises: realRepetitionExercises,
  },
  {
    id: 'fortress',
    title: 'Pháo đài giữ hòa',
    description:
      'Các vùng phòng thủ giữ hòa xuất hiện trong ván đấu thực tế. Theo dõi đoạn đã chọn để hiểu cách giữ góc và bảo vệ quân; đây không phải điều kiện tự động kết thúc ván.',
    exercises: expandedDrawExercises.fortress,
  },
];

export const drawCategories: DrawCategory[] = sourceDrawCategories.map(
  (category) => ({
    ...category,
    exercises: category.exercises.map((exercise) => ({
      ...exercise,
      difficulty: drawLevelRatings[exercise.fen],
    })),
  })
);

export { drawExerciseUrl } from './draw-exercise-url';
