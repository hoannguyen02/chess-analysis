export function getActivePlayerFromFEN(fen: string): 'White' | 'Black' {
  const parts = fen.split(' ');
  if (parts.length < 2) {
    throw new Error('Invalid FEN string');
  }
  const activeColor = parts[1];
  return activeColor === 'w' ? 'White' : 'Black';
}
