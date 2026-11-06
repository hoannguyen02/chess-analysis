import { Chess, type Square } from 'chess.js';

export type SetupPiece = `${'w' | 'b'}${'P' | 'N' | 'B' | 'R' | 'Q' | 'K'}`;
export type SetupPosition = {
  pieces: Partial<Record<Square, SetupPiece>>;
  turn: 'w' | 'b';
  castling: string;
  enPassant: string;
  halfmove: number;
  fullmove: number;
};

/** Setup deliberately allows incomplete boards while pieces are being arranged. */
export function setupFromFen(fen: string): SetupPosition {
  const fields = fen.trim().split(/\s+/);
  const ranks = fields[0]?.split('/');
  if (
    fields.length !== 6 ||
    ranks.length !== 8 ||
    !/^[wb]$/.test(fields[1]) ||
    !/^(-|K?Q?k?q?)$/.test(fields[2]) ||
    !/^(-|[a-h][36])$/.test(fields[3]) ||
    !/^\d+$/.test(fields[4]) ||
    !/^[1-9]\d*$/.test(fields[5])
  )
    throw new Error('FEN cần đủ tám hàng, bên đến lượt và các trường hợp lệ.');
  const pieces: SetupPosition['pieces'] = {};
  ranks.forEach((rank, index) => {
    let file = 0;
    for (const symbol of rank) {
      if (/^[1-8]$/.test(symbol)) file += Number(symbol);
      else if (/^[pnbrqkPNBRQK]$/.test(symbol) && file < 8) {
        pieces[`${'abcdefgh'[file]}${8 - index}` as Square] =
          `${symbol === symbol.toUpperCase() ? 'w' : 'b'}${symbol.toUpperCase()}` as SetupPiece;
        file += 1;
      } else throw new Error('Cách đặt quân trong FEN không hợp lệ.');
    }
    if (file !== 8) throw new Error('Mỗi hàng trong FEN phải có đúng tám ô.');
  });
  return {
    pieces,
    turn: fields[1] as 'w' | 'b',
    castling: fields[2],
    enPassant: fields[3],
    halfmove: Number(fields[4]),
    fullmove: Number(fields[5]),
  };
}

export function setupToFen(position: SetupPosition): string {
  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    let text = '',
      empty = 0;
    for (const file of 'abcdefgh') {
      const piece = position.pieces[`${file}${rank}` as Square];
      if (!piece) empty += 1;
      else {
        if (empty) text += empty;
        empty = 0;
        text += piece[0] === 'w' ? piece[1] : piece[1].toLowerCase();
      }
    }
    ranks.push(text + (empty || ''));
  }
  return `${ranks.join('/')} ${position.turn} ${position.castling || '-'} ${position.enPassant || '-'} ${position.halfmove} ${position.fullmove}`;
}

export function changeSetupPiece(
  position: SetupPosition,
  square: Square,
  piece?: SetupPiece,
  from?: Square
): SetupPosition {
  const pieces = { ...position.pieces };
  if (from) delete pieces[from];
  if (piece?.endsWith('K'))
    for (const [sq, current] of Object.entries(pieces))
      if (current === piece) delete pieces[sq as Square];
  if (piece) pieces[square] = piece;
  else delete pieces[square];
  const requirements: Record<string, [Square, SetupPiece, Square, SetupPiece]> =
    {
      K: ['e1', 'wK', 'h1', 'wR'],
      Q: ['e1', 'wK', 'a1', 'wR'],
      k: ['e8', 'bK', 'h8', 'bR'],
      q: ['e8', 'bK', 'a8', 'bR'],
    };
  const castling =
    [...position.castling]
      .filter((right) => {
        const condition = requirements[right];
        return (
          condition &&
          pieces[condition[0]] === condition[1] &&
          pieces[condition[2]] === condition[3] &&
          from !== condition[0] &&
          from !== condition[2] &&
          square !== condition[0] &&
          square !== condition[2]
        );
      })
      .join('') || '-';
  return { ...position, pieces, castling, enPassant: '-', halfmove: 0 };
}

/** Basic playability only. This does not verify the tactic or its objective. */
export function validateSetupFen(fen: string): string {
  const position = setupFromFen(fen);
  const entries = Object.entries(position.pieces);
  const kings = ['wK', 'bK'].map((piece) =>
    entries.filter(([, p]) => p === piece)
  );
  if (kings.some((group) => group.length !== 1))
    throw new Error('Mỗi bên cần có đúng một Vua.');
  const [white, black] = kings.map((group) => group[0][0]);
  if (
    Math.max(
      Math.abs(white.charCodeAt(0) - black.charCodeAt(0)),
      Math.abs(Number(white[1]) - Number(black[1]))
    ) <= 1
  )
    throw new Error('Hai Vua không được đứng cạnh nhau.');
  if (entries.some(([sq, p]) => p?.endsWith('P') && /[18]$/.test(sq)))
    throw new Error('Tốt không được đứng ở hàng 1 hoặc hàng 8.');
  const canonical = setupToFen(position);
  const board = new Chess();
  if (!board.load(canonical)) throw new Error('Thế cờ không hợp lệ.');
  const opposing = new Chess(
    canonical.replace(/ [wb] /, position.turn === 'w' ? ' b ' : ' w ')
  );
  if (opposing.in_check())
    throw new Error(
      'Vua của bên chưa đến lượt đang bị chiếu. Hãy kiểm tra bên đến lượt và cách đặt quân.'
    );
  if (board.in_checkmate() || board.in_stalemate())
    throw new Error('Thế cờ bắt đầu phải còn nước đi hợp lệ.');
  const rights = {
    K: ['e1', 'wK', 'h1', 'wR'],
    Q: ['e1', 'wK', 'a1', 'wR'],
    k: ['e8', 'bK', 'h8', 'bR'],
    q: ['e8', 'bK', 'a8', 'bR'],
  };
  for (const right of position.castling === '-' ? [] : position.castling) {
    const [king, kingPiece, rook, rookPiece] =
      rights[right as keyof typeof rights];
    if (
      position.pieces[king as Square] !== kingPiece ||
      position.pieces[rook as Square] !== rookPiece
    )
      throw new Error('Quyền nhập thành không phù hợp với vị trí Vua và Xe.');
  }
  if (position.enPassant !== '-') {
    const target = position.enPassant;
    const rank = position.turn === 'w' ? '6' : '3';
    const pawnSquare =
      `${target[0]}${position.turn === 'w' ? '5' : '4'}` as Square;
    const origin = `${target[0]}${position.turn === 'w' ? '7' : '2'}` as Square;
    if (
      target[1] !== rank ||
      position.pieces[target as Square] ||
      position.pieces[origin] ||
      position.pieces[pawnSquare] !== (position.turn === 'w' ? 'bP' : 'wP')
    )
      throw new Error('Ô bắt Tốt qua đường không phù hợp với thế cờ.');
  }
  return board.fen();
}
