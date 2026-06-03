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

// Generic ability-target hook, read by the AI eval to value a loaded launcher's
// threat (only meaningful once a pawn is loaded). The reducer drives loading/
// firing through getLoadTargets/getLaunchTargets directly, and gameReducer skips
// getAbilityTargets for self-click pieces, so exposing this is inert to gameplay.
export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return piece.pawnLoaded ? getLaunchTargets(piece, pieces) : [];
}

export function getLaunchTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      if (Math.abs(dx) + Math.abs(dy) !== 3) continue;
      const sq: Square = { row: piece.row + dy, col: piece.col + dx };
      if (!isInBounds(sq)) continue;
      const occupant = getPieceAt(sq, pieces);
      if (occupant && occupant.color !== piece.color) {
        targets.push({ ...sq, color: 'capture' });
      } else {
        targets.push({ ...sq, color: 'range' });
      }
    }
  }

  return targets;
}
