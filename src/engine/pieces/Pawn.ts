import type { Piece, Highlight } from '@/types/game';
import { isInBounds, getPieceAt, isOpponent, forwardDirection } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights: Highlight[] = [];
  const dir = forwardDirection(piece.color);
  const startRow = piece.color === 'White' ? 1 : 6;

  const forward1 = { row: piece.row + dir, col: piece.col };
  if (isInBounds(forward1) && !getPieceAt(forward1, pieces)) {
    highlights.push({ ...forward1, color: 'move' });

    if (!piece.hasMoved) {
      const forward2 = { row: piece.row + 2 * dir, col: piece.col };
      if (isInBounds(forward2) && !getPieceAt(forward2, pieces)) {
        highlights.push({ ...forward2, color: 'move' });
      }
    }
  }

  for (const dc of [-1, 1]) {
    const diag = { row: piece.row + dir, col: piece.col + dc };
    if (isInBounds(diag) && isOpponent(diag, piece.color, pieces)) {
      highlights.push({ ...diag, color: 'capture' });
    }
  }

  return highlights;
}
