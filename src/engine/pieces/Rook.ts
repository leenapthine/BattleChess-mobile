import type { Piece, Highlight } from '@/types/game';
import { getRookMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getRookMoves(piece, pieces);
}
