import type { Piece, Highlight, GameState } from '@/types/game';
import { getKnightMoves } from '@/engine/helpers/moveHelpers';
import { updatePiece } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKnightMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, _pieces: Piece[]): Highlight[] {
  if (piece.isStone) return [];
  return [{ row: piece.row, col: piece.col, color: 'ability' }];
}

export function toggleStone(
  familiar: Piece,
  state: GameState,
): GameState {
  const wasStone = familiar.isStone;
  const updatedPieces = updatePiece(state.pieces, familiar.id, {
    isStone: !wasStone,
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: wasStone ? state.currentTurn : opponentColor(state.currentTurn),
  };
}
