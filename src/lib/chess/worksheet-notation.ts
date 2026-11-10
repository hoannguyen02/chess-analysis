import { explainLine } from './worksheet';

// Composed positions isolate notation; they are not practice exercises or games.
export const notationExamples = {
  knight: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    move: 'Nf3',
  },
  pawn: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    move: 'e4',
  },
  capture: { fen: '4k3/8/8/8/3p4/5N2/8/4K3 w - - 0 1', move: 'Nxd4' },
  pawnCapture: { fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', move: 'exd5' },
  check: { fen: '6k1/8/8/8/8/8/8/4R1K1 w - - 0 1', move: 'Re8+' },
  mate: { fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1', move: 'Qg7#' },
  kingside: { fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1', move: 'O-O' },
  queenside: { fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', move: 'O-O-O' },
  promotion: { fen: '8/k3P3/8/8/8/8/8/7K w - - 0 1', move: 'e8=Q' },
  capturePromotion: { fen: '3r4/k3P3/8/8/8/8/8/7K w - - 0 1', move: 'exd8=N' },
  promotionCheck: { fen: 'k7/4P3/8/8/8/8/8/7K w - - 0 1', move: 'e8=Q+' },
  promotionMate: { fen: 'k7/4P3/1K6/8/8/8/8/8 w - - 0 1', move: 'e8=Q#' },
  enPassant: { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2', move: 'exd6' },
  file: { fen: '6k1/8/8/8/8/5N2/8/1N4K1 w - - 0 1', move: 'Nbd2' },
  rank: { fen: '6k1/8/8/8/8/4R3/8/4R1K1 w - - 0 1', move: 'R1e2' },
  square: { fen: '6k1/8/8/8/8/1N6/8/1N3NK1 w - - 0 1', move: 'Nb1d2' },
} as const;
export type NotationExampleKey = keyof typeof notationExamples;
export function notationExampleText(key: NotationExampleKey) {
  const example = notationExamples[key];
  const prefix =
    key === 'file'
      ? 'Cột: '
      : key === 'rank'
        ? 'Hàng: '
        : key === 'square'
          ? 'Cả ô: '
          : '';
  return (
    prefix +
    explainLine(example.fen, [example.move])[0].replace(/^(Trắng|Đen): /, '')
  );
}
export const notationGuideRows: {
  title: string;
  english: string;
  rule: string;
  examples: NotationExampleKey[];
}[] = [
  {
    title: 'Nước đi',
    english: 'Moves',
    rule: 'Ký hiệu quân + ô đến. Với Tốt, chỉ ghi ô đến, không ghi chữ P.',
    examples: ['knight', 'pawn'],
  },
  {
    title: 'Bắt quân',
    english: 'Captures',
    rule: 'Dấu x chỉ nước bắt quân. Khi Tốt bắt quân, ghi cột xuất phát trước x.',
    examples: ['capture', 'pawnCapture'],
  },
  {
    title: 'Chiếu, chiếu hết',
    english: 'Check, checkmate',
    rule: '+ là chiếu Vua; # là chiếu hết: không có nước đi hợp lệ để thoát chiếu.',
    examples: ['check', 'mate'],
  },
  {
    title: 'Nhập thành',
    english: 'Castling',
    rule: 'O-O và O-O-O cũng được viết 0-0 và 0-0-0. Chỉ nhập thành khi đủ điều kiện theo luật.',
    examples: ['kingside', 'queenside'],
  },
  {
    title: 'Phong cấp',
    english: 'Pawn promotion',
    rule: 'Ghi = và quân mới: Q, R, B hoặc N. Dấu + hoặc # đứng sau quân mới. Một số tài liệu bỏ dấu =, như e8Q.',
    examples: ['promotion', 'capturePromotion', 'promotionCheck', 'promotionMate'],
  },
  {
    title: 'Bắt Tốt qua đường',
    english: 'En passant',
    rule: 'Tốt đối phương vừa đi hai ô đến cạnh Tốt của bên bắt. Chỉ bắt ngay ở nước tiếp theo; có thể thêm e.p. sau nước bắt.',
    examples: ['enPassant'],
  },
  {
    title: 'Phân biệt quân đi',
    english: 'Disambiguation',
    rule: 'Khi nhiều quân cùng loại có thể đi hợp lệ đến một ô, thêm cột, hàng hoặc cả ô xuất phát để xác định quân đi.',
    examples: ['file', 'rank', 'square'],
  },
];
