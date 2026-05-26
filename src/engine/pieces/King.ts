import type { Piece, Highlight } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKingMoves(piece, pieces);
}
