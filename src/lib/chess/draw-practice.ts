import type { GamePlayer } from './game-player-title';
import type { GameReference } from './draw-game-viewer';
import type { DrawDifficulty } from './draw-levels';
import { drawLevelRatings } from './draw-level-ratings';
import { drawSelection } from './draw-selection';
import { drawAdditions } from './draw-additions';
import { expandedDrawExercises } from './draw-expansion';
import { realRepetitionExercises } from './real-repetition';

export type DrawExercise = {
  decision?: {
    options: { id: string; label: string }[];
    correctOption: string;
    retryMessage: string;
  };
  beginner?: boolean;
  promotionMaterial?: { minimumGain: number };
  promotionGain?: { minimumGain: number; solverMoves: number };
  beginnerKind?: 'king' | 'queen' | 'rook';
  pinSetup?: { pinner: string; front: string; back: string; target: string };
  gameReference?: GameReference;
  gameCaption?: string;
  gameOpening?: string;
  playerTitle?: string;
  players?: GamePlayer[];
  alternativeLines?: string[][];
  hints?: string[];
  difficulty?: DrawDifficulty;
  // Only populate when the source provides the actual preceding position/move.
  // fen remains the position at which the student starts solving.
  previousMove?: { fen: string; move: string };
  mode?: 'interactive' | 'study' | 'analysis' | 'recognition';
  forcedReplies?: boolean;
  discoveryKind?: 'check' | 'attack';
  goal?: 'win' | 'draw' | 'checkmate' | 'material';
  title: string;
  prompt: string;
  fen: string;
  moves: string[];
  outcome:
    | 'repetition'
    | 'stalemate'
    | 'material'
    | 'checkmate'
    | 'fortress'
    | 'simplification'
    | 'discovery'
    | 'fork'
    | 'pin'
    | 'skewer'
    | 'opening'
    | 'promotion';
  solution: string;
  url?: string;
  source?: string;
};

export type DrawCategory = {
  id: string;
  shortLabel?: string;
  title: string;
  description: string;
  exercises: DrawExercise[];
};

// Archived source pool; the published collection below also includes credited studies and compositions.
export const drawResearchCategories: DrawCategory[] = [
  {
    id: 'perpetual-check',
    title: 'Chiếu vĩnh viễn',
    description:
      'Tìm cách chuẩn bị và duy trì chuỗi chiếu để cứu hòa. Cùng thế cờ xuất hiện 3 lần thì được yêu cầu hòa; 5 lần thì tự động hòa. Phải cùng bên đến lượt và cùng quyền đi quân. Các nước đáp là diễn biến đã chơi, không nhất thiết bị bắt buộc.',
    exercises: expandedDrawExercises['perpetual-check'],
  },
  {
    id: 'stalemate',
    title: 'Bẫy hết nước đi',
    description:
      'Tìm cơ hội cứu hòa bằng hết nước đi (pat). Bên đến lượt không bị chiếu nhưng không còn nước hợp lệ thì ván cờ hòa. Đối thủ không nhất thiết bị buộc phải mắc bẫy.',
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
      'Các thế cờ giữ hòa nhờ chặn Tốt hoặc duy trì vùng phòng thủ. Theo dõi đoạn đã chọn để hiểu cách giữ góc và bảo vệ quân; đây không phải điều kiện tự động kết thúc ván.',
    exercises: expandedDrawExercises.fortress,
  },
];

// The research pool is retained; only explicit editorial selections reach practice/PDF.
export const drawCategories: DrawCategory[] = drawResearchCategories.map(
  (category) => ({
    ...category,
    exercises: category.exercises
      .filter((exercise) => Boolean(drawSelection[exercise.fen]))
      .map((exercise): DrawExercise => {
        const selection = drawSelection[exercise.fen];
        const beginner = selection.level === 'Beginner';
        const original = drawLevelRatings[exercise.fen];
        const ending =
          exercise.outcome === 'repetition'
            ? ' Thế cờ lặp lại ba lần trong đoạn đã chơi, cho phép yêu cầu hòa hợp lệ; ván chưa tự động kết thúc.'
            : exercise.outcome === 'fortress'
              ? ' Đây là đoạn phòng thủ trong ván gốc. Kết thúc đoạn không có nghĩa ván cờ tự động hòa.'
              : '';
        return {
          ...exercise,
          goal: 'draw' as const,
          beginner,
          difficulty: beginner
            ? undefined
            : {
                ...original,
                level: selection.level as DrawDifficulty['level'],
                reason: selection.solution,
              },
          prompt:
            exercise.outcome === 'fortress'
              ? 'Theo dõi cách giữ vùng phòng thủ để hòa trong đoạn ván đấu này.'
              : 'Tìm cách giữ hòa. Kiểm tra nước đáp của đối phương trước khi chọn nước đi.',
          solution: selection.solution + ending,
        };
      })
      .concat(drawAdditions[category.id] ?? []),
  })
);

export { drawExerciseUrl } from './draw-exercise-url';
