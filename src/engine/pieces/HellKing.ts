import type { Piece, Highlight, GameState } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';
import { getPieceAt, updatePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKingMoves(piece, pieces);
}

export function performConvert(
  hellKing: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === hellKing.color || target.isStone) return state;

  const updatedPieces = updatePiece(state.pieces, target.id, {
    color: hellKing.color,
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}
