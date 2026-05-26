import type { Piece, Highlight } from '@/types/game';
import { getKnightMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKnightMoves(piece, pieces);
}
