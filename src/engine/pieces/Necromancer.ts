import type { Piece, Highlight, Square } from '@/types/game';
import { getBishopMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, getPieceAt, isEmpty } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getBishopMoves(piece, pieces);
}

export function getResurrectionTargets(
  captureSquare: Square,
  pieces: Piece[],
): Square[] {
  return getAdjacentSquares(captureSquare).filter(sq => isEmpty(sq, pieces));
}
