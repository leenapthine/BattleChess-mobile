import type { Piece, Highlight, Square } from '@/types/game';
import { getStepMoves } from '@/engine/helpers/moveHelpers';
import { isInBounds, getPieceAt, isEmpty } from '@/engine/utils';

const CARDINAL_OFFSETS: Square[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return CARDINAL_OFFSETS
    .map(o => ({ row: piece.row + o.row, col: piece.col + o.col }))
    .filter(sq => isInBounds(sq) && isEmpty(sq, pieces))
    .map(sq => ({ ...sq, color: 'move' as const }));
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist === 0 || dist > 3) continue;
      const sq: Square = { row: piece.row + dy, col: piece.col + dx };
      if (!isInBounds(sq)) continue;
      const occupant = getPieceAt(sq, pieces);
      if (occupant && occupant.color !== piece.color && !occupant.isStone) {
        targets.push({ ...sq, color: 'ability' });
      }
    }
  }

  return targets;
}
