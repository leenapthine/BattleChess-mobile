import type { Piece, Highlight, Square } from '@/types/game';
import { getKnightMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, getPieceAt, updatePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKnightMoves(piece, pieces);
}

// Enemy-occupied adjacent squares that a GhostKnight move will stun.
// Used by the turn manager to drive the stun visual effect.
export function getStunnedSquares(movedPiece: Piece, pieces: Piece[]): Square[] {
  if (movedPiece.type !== 'GhostKnight') return [];

  const affected: Square[] = [];
  for (const sq of getAdjacentSquares(movedPiece)) {
    const target = getPieceAt(sq, pieces);
    if (target && target.color !== movedPiece.color) {
      affected.push({ row: sq.row, col: sq.col });
    }
  }
  return affected;
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
