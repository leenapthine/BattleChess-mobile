import type { Piece, Highlight, GameState } from '@/types/game';
import { getBishopMoves } from '@/engine/helpers/moveHelpers';
import { getPieceAt, removePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getBishopMoves(piece, pieces);
}

export function performRangedCapture(
  tower: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === tower.color || target.isStone) return state;

  const updatedPieces = removePiece(state.pieces, target.id);

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}
