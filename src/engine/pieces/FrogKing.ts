import type { Piece, Highlight, Square } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';
import { isInBounds, getPieceAt } from '@/engine/utils';

const HOP_OFFSETS: Square[] = [
  { row: 2, col: 0 },
  { row: -2, col: 0 },
  { row: 0, col: 2 },
  { row: 0, col: -2 },
];

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getKingMoves(piece, pieces);

  for (const offset of HOP_OFFSETS) {
    const target: Square = { row: piece.row + offset.row, col: piece.col + offset.col };
    if (!isInBounds(target)) continue;

    const occupant = getPieceAt(target, pieces);
    if (occupant && (occupant.color === piece.color || occupant.isStone)) continue;

    const existing = highlights.find(h => h.row === target.row && h.col === target.col);
    if (!existing) {
      highlights.push({
        ...target,
        color: occupant ? 'capture' : 'move',
      });
    }
  }

  return highlights;
}
