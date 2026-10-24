import { Chess } from 'chess.js';

export type LondonLevel = 'A' | 'B' | 'C' | 'C*' | 'D';
export type LondonTrack = 'classical' | 'jobava';
export type LondonSide = 'white' | 'black';
export type LondonGame = {
  id: string;
  white: string;
  black: string;
  event: string;
  date: string;
  round: string;
  result: string;
  timeControl: string;
  source: string;
  pgn: string;
  moves: string[];
  fens: string[];
  summary: string;
};
export type LondonExercise = {
  id: string;
  side: LondonSide;
  gameId: string;
  ply: number;
  fen: string;
  prompt: string;
  explanation: string;
  hints: string[];
  lines: string[][];
};
export type LondonLesson = {
  track?: LondonTrack;
  id: string;
  level: LondonLevel;
  title: string;
  goal: string;
  white: string;
  black: string;
  error: string;
  takeaway: string;
  exercises: LondonExercise[];
};
export type LondonCourseData = {
  hubPath: string;
  version: number;
  lessons: LondonLesson[];
  games: LondonGame[];
};
export const londonLevels: {
  id: LondonLevel;
  title: string;
  description: string;
}[] = [
  {
    id: 'A',
    title: 'Hiểu cách bố trí',
    description: 'Phát triển quân, giữ trung tâm, an toàn vua.',
  },
  {
    id: 'B',
    title: 'Đọc ý đồ đối thủ',
    description: 'Nhận ra đe dọa và tránh đi theo thói quen.',
  },
  {
    id: 'C',
    title: 'Chọn kế hoạch',
    description: 'Điểm tựa, phá tốt và phối hợp quân.',
  },
  {
    id: 'C*',
    title: 'Thích nghi',
    description: 'Đổi cấu trúc, đổi quân và phòng thủ chủ động.',
  },
  {
    id: 'D',
    title: 'Tự ra quyết định',
    description: 'Tính toán, sửa sai và chuyển hóa ưu thế.',
  },
];

export function londonPosition(fen: string, moves: string[]) {
  const game = new Chess(fen);
  for (const move of moves) {
    if (!game.move(move))
      throw new Error(`Invalid London continuation: ${move}`);
  }
  return game;
}

/** Saved lines are bounded teaching examples, never an exhaustive move judge. */
export function playLondonMove(
  exercise: LondonExercise,
  played: string[],
  san: string
) {
  const game = londonPosition(exercise.fen, played);
  const move = game.move(san);
  if (!move) return { kind: 'illegal' as const, moves: played };
  const next = [...played, move.san];
  const compatible = exercise.lines.filter((line) =>
    next.every((m, i) => line[i] === m)
  );
  if (!compatible.length) return { kind: 'unreviewed' as const, moves: played };
  const line = compatible[0];
  if (line.length > next.length) next.push(line[next.length]);
  return {
    kind: 'accepted' as const,
    moves: next,
    complete: compatible.some((candidate) => candidate.length === next.length),
  };
}

export type LondonProgress = Record<string, 'assisted' | 'independent'>;
export function parseLondonProgress(
  raw: string | null,
  ids: string[]
): LondonProgress {
  try {
    const value: unknown = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, status]) =>
          ids.includes(id) &&
          (status === 'assisted' || status === 'independent')
      )
    );
  } catch {
    return {};
  }
}
