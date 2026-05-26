import type { Piece, Highlight, GameState } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';
import { getPieceAt, removePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getKingMoves(piece, pieces);

  for (const dir of [-1, 1]) {
    let row = piece.row + dir;
    while (row >= 0 && row < 8) {
      const occupant = getPieceAt({ row, col: piece.col }, pieces);
      if (occupant) {
        if (occupant.color !== piece.color) {
          const exists = highlights.find(h => h.row === row && h.col === piece.col);
          if (!exists) {
            highlights.push({ row, col: piece.col, color: 'capture' });
          }
        }
        break;
      }
      row += dir;
    }
  }

  return highlights;
}

export function performRangedCapture(
  king: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === king.color || target.isStone) return state;

  const isAdjacent =
    Math.abs(target.row - king.row) <= 1 &&
    Math.abs(target.col - king.col) <= 1;

  if (isAdjacent) return state;

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
