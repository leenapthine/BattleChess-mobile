import type { Piece, Highlight } from '@/types/game';
import { getQueenMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getQueenMoves(piece, pieces);
}
