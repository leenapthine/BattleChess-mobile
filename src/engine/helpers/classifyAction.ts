import type { GameState, GameAction, Square } from '@/types/game';
import { getPieceAt, squaresEqual } from '@/engine/utils';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

export function classifyAction(
  square: Square,
  state: GameState,
): GameAction {
  const { selectedSquare, highlights, abilityMode, currentTurn, pieces } = state;
  const clickedPiece = getPieceAt(square, pieces);

  if (abilityMode.type !== 'none') {
    return { type: 'ABILITY_ACTION', square };
  }

  if (selectedSquare) {
    if (squaresEqual(square, selectedSquare)) {
      const piece = getPieceAt(selectedSquare, pieces);
      if (piece && hasSelfClickAbility(piece.type)) {
        return { type: 'ABILITY_ACTION', square };
      }
      return { type: 'DESELECT' };
    }

    const isHighlighted = highlights.some(
      h => h.row === square.row && h.col === square.col,
    );

    if (isHighlighted) {
      const highlight = highlights.find(
        h => h.row === square.row && h.col === square.col,
      );

      if (highlight?.color === 'ability') {
        return { type: 'ABILITY_ACTION', square };
      }

      return { type: 'MOVE_PIECE', from: selectedSquare, to: square };
    }

    if (clickedPiece && clickedPiece.color === currentTurn) {
      return { type: 'SELECT_SQUARE', square };
    }

    return { type: 'DESELECT' };
  }

  if (clickedPiece) {
    return { type: 'SELECT_SQUARE', square };
  }

  return { type: 'DESELECT' };
}

