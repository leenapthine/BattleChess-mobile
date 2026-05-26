import type { Piece, Highlight, Square } from '@/types/game';
import { getValidMoves as getPawnMoves } from './Pawn';
import { isInBounds, getPieceAt, isOpponent, forwardDirection } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getPawnMoves(piece, pieces);
  const dir = forwardDirection(piece.color);
  const zapSquare: Square = { row: piece.row + dir, col: piece.col };

  if (isInBounds(zapSquare) && isOpponent(zapSquare, piece.color, pieces)) {
    const existing = highlights.find(h => h.row === zapSquare.row && h.col === zapSquare.col);
    if (!existing) {
      highlights.push({ ...zapSquare, color: 'capture' });
    }
  }

  return highlights;
}
