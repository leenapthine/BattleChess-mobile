import type { Piece, Square, Color, GameState } from '@/types/game';

let nextGeneratedId = 100;
export function generateId(): string {
  return `gen-${nextGeneratedId++}-${Date.now()}`;
}

export function isInBounds(square: Square): boolean {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

export function getPieceAt(square: Square, pieces: Piece[]): Piece | null {
  return pieces.find(p => p.row === square.row && p.col === square.col) ?? null;
}

export function isOpponent(square: Square, color: Color, pieces: Piece[]): boolean {
  const piece = getPieceAt(square, pieces);
  return piece !== null && piece.color !== color;
}

export function isFriendly(square: Square, color: Color, pieces: Piece[]): boolean {
  const piece = getPieceAt(square, pieces);
  return piece !== null && piece.color === color;
}

export function isEmpty(square: Square, pieces: Piece[]): boolean {
  return getPieceAt(square, pieces) === null;
}

export function getAdjacentSquares(square: Square): Square[] {
  const offsets = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return offsets
    .map(o => ({ row: square.row + o.row, col: square.col + o.col }))
    .filter(isInBounds);
}

export function getAllAdjacentSquares(square: Square): Square[] {
  const offsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 },                        { row: 0, col: 1 },
    { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
  ];
  return offsets
    .map(o => ({ row: square.row + o.row, col: square.col + o.col }))
    .filter(isInBounds);
}

export function isPathClear(
  from: Square,
  to: Square,
  pieces: Piece[],
): boolean {
  const dRow = Math.sign(to.row - from.row);
  const dCol = Math.sign(to.col - from.col);
  let current = { row: from.row + dRow, col: from.col + dCol };

  while (current.row !== to.row || current.col !== to.col) {
    if (getPieceAt(current, pieces) !== null) return false;
    current = { row: current.row + dRow, col: current.col + dCol };
  }
  return true;
}

export function squaresEqual(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col;
}

export function forwardDirection(color: Color): number {
  return color === 'White' ? 1 : -1;
}

export function pawnStartRow(color: Color): number {
  return color === 'White' ? 1 : 6;
}

export function removePiece(pieces: Piece[], pieceId: string): Piece[] {
  return pieces.filter(p => p.id !== pieceId);
}

export function updatePiece(
  pieces: Piece[],
  pieceId: string,
  updates: Partial<Piece>,
): Piece[] {
  return pieces.map(p => (p.id === pieceId ? { ...p, ...updates } : p));
}

export function findKing(color: Color, pieces: Piece[]): Piece | undefined {
  const kingTypes = ['King', 'GhoulKing', 'HellKing', 'FrogKing', 'WizardKing'] as const;
  return pieces.find(p => p.color === color && (kingTypes as readonly string[]).includes(p.type));
}
