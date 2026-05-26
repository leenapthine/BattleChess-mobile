import type { Piece, Highlight, Square } from '@/types/game';
import { getStepMoves } from '@/engine/helpers/moveHelpers';

const EXTENDED_L_OFFSETS: Square[] = [
  { row: 3, col: 1 },  { row: 3, col: -1 },
  { row: -3, col: 1 }, { row: -3, col: -1 },
  { row: 1, col: 3 },  { row: 1, col: -3 },
  { row: -1, col: 3 }, { row: -1, col: -3 },
];

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getStepMoves(piece, pieces, EXTENDED_L_OFFSETS);
}
