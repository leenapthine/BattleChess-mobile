import type { Piece, Highlight, Square } from '@/types/game';
import { getQueenMoves } from '@/engine/helpers/moveHelpers';
import { getAllAdjacentSquares, getPieceAt, removePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getQueenMoves(piece, pieces);
}

export function triggerDetonation(
  qod: Piece,
  pieces: Piece[],
  capturingPiece: Piece | null,
): Piece[] {
  let updatedPieces = pieces;

  for (const sq of getAllAdjacentSquares(qod)) {
    const victim = getPieceAt(sq, updatedPieces);
    if (victim && !victim.isStone && victim.id !== capturingPiece?.id) {
      updatedPieces = removePiece(updatedPieces, victim.id);
    }
  }

  return updatedPieces;
}
