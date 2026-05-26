import type { Piece, Highlight } from '@/types/game';
import { getBishopMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getBishopMoves(piece, pieces);
}
