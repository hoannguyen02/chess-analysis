export function getActivePlayerFromFEN(fen: string): 'White' | 'Black' {
  const parts = fen.split(' ');
  if (parts.length < 2) {
    console.warn('Invalid FEN string');
    return 'White';
  }
  const activeColor = parts[1];
  return activeColor === 'w' ? 'White' : 'Black';
}
