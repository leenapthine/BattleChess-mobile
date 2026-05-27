import type { Piece, Highlight, GameState } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';
import { isInBounds, getPieceAt, removePiece } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKingMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (const dir of [-1, 1]) {
    let row = piece.row + dir;
    while (row >= 0 && row < 8) {
      const sq = { row, col: piece.col };
      const occupant = getPieceAt(sq, pieces);
      if (occupant) {
        if (occupant.color !== piece.color && !occupant.isStone) {
          targets.push({ ...sq, color: 'capture' });
        } else {
          targets.push({ ...sq, color: 'range' });
        }
        break;
      }
      targets.push({ ...sq, color: 'range' });
      row += dir;
    }
  }

  return targets;
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
    currentTurn: opponentColor(state.currentTurn),
  };
}
