import type { Piece, Highlight } from '@/types/game';
import { getKnightMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, getPieceAt, updatePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKnightMoves(piece, pieces);
}

export function applyStunEffect(movedPiece: Piece, pieces: Piece[]): Piece[] {
  if (movedPiece.type !== 'GhostKnight') return pieces;

  let updatedPieces = pieces;
  for (const sq of getAdjacentSquares(movedPiece)) {
    const target = getPieceAt(sq, updatedPieces);
    if (target && target.color !== movedPiece.color) {
      updatedPieces = updatePiece(updatedPieces, target.id, { stunned: true });
    }
  }
  return updatedPieces;
}
