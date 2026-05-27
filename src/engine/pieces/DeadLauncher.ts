import type { Piece, Highlight, Square, Color } from '@/types/game';
import { getRookMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, isInBounds, getPieceAt, isOpponent } from '@/engine/utils';

const PAWN_TYPES = ['Pawn', 'NecroPawn', 'HellPawn', 'YoungWiz', 'PawnHopper'] as const;

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getRookMoves(piece, pieces);
}

export function getLoadTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return getAdjacentSquares(piece).filter(sq => {
    const target = getPieceAt(sq, pieces);
    return (
      target !== null &&
      target.color === piece.color &&
      (PAWN_TYPES as readonly string[]).includes(target.type)
    );
  }).map(sq => ({ ...sq, color: 'capture' as const }));
}

export function getLaunchTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      if (Math.abs(dx) + Math.abs(dy) !== 3) continue;
      const sq: Square = { row: piece.row + dy, col: piece.col + dx };
      if (!isInBounds(sq)) continue;
      if (isOpponent(sq, piece.color, pieces)) {
        targets.push({ ...sq, color: 'capture' });
      }
    }
  }

  return targets;
}
