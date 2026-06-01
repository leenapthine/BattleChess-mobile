import type { Piece, GameState, Color } from '@/types/game';
import { applyStunEffect, getStunnedSquares } from '@/engine/pieces/GhostKnight';

export function switchTurn(state: GameState): GameState {
  const nextTurn: Color = state.currentTurn === 'White' ? 'Black' : 'White';
  const pieces = clearStuns(state.pieces, state.currentTurn);

  return {
    ...state,
    pieces,
    currentTurn: nextTurn,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
  };
}

function clearStuns(pieces: Piece[], colorToUnstun: Color): Piece[] {
  return pieces.map(p =>
    p.color === colorToUnstun && p.stunned ? { ...p, stunned: false } : p,
  );
}

export function applyPostMoveEffects(
  movedPiece: Piece,
  state: GameState,
): GameState {
  const piecesAfterStun = applyStunEffect(movedPiece, state.pieces);
  const stunned = getStunnedSquares(movedPiece, state.pieces);
  return {
    ...state,
    pieces: piecesAfterStun,
    lastEffect:
      stunned.length > 0
        ? { type: 'stun', from: { row: movedPiece.row, col: movedPiece.col }, affected: stunned }
        : state.lastEffect,
  };
}
