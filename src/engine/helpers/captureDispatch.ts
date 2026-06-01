import type { Piece, GameState, Square } from '@/types/game';
import { forwardDirection, removePiece } from '@/engine/utils';
import { checkWinCondition, checkQoBRevival } from './captureHandler';
import { switchTurn } from './turnManager';
import { performRangedCapture } from '@/engine/pieces/WizardTower';
import { performConvert } from '@/engine/pieces/HellKing';
import { performCapture as performProwlerCapture } from '@/engine/pieces/Prowler';
import { performCapture as performHowlerCapture } from '@/engine/pieces/Howler';
import { performCapture as performHellPawnCapture } from '@/engine/pieces/HellPawn';
import { opponentColor } from '@/engine/pieceTraits';

// Pieces with custom capture behavior that bypasses the generic
// handleCapture path. Each returns a full GameState or null to
// fall through to generic capture.
export function dispatchPieceCapture(
  piece: Piece,
  target: Piece,
  to: Square,
  state: GameState,
): GameState | null {
  switch (piece.type) {
    // WizardTower: ranged capture — stays in place, fires a laser
    case 'WizardTower': {
      const result = performRangedCapture(piece, to, state);
      if (result === state) return null; // capture rejected — fall through
      const withEffect: GameState = {
        ...result,
        lastEffect: {
          type: 'towerShot',
          from: { row: piece.row, col: piece.col },
          to,
        },
      };
      return maybeQoBRevival(target, withEffect, null);
    }
    // HellKing: converts enemy color instead of removing
    case 'HellKing':
      return checkWinCondition(performConvert(piece, to, state));
    // Prowler: captures then gets a second knight move
    case 'Prowler': {
      const result = performProwlerCapture(piece, to, state);
      const pendingSecond = result.abilityMode.type === 'secondMove' ? piece.id : null;
      return maybeQoBRevival(target, result, pendingSecond);
    }
    // Howler: captures and absorbs the target's movement type
    case 'Howler':
      return maybeQoBRevival(target, performHowlerCapture(piece, to, state), null);
    // HellPawn: captures and transforms into the target's type (non-pawns only)
    case 'HellPawn':
      return maybeQoBRevival(target, performHellPawnCapture(piece, to, state), null);
    // YoungWiz: zaps enemy directly ahead without moving
    case 'YoungWiz': {
      const dir = forwardDirection(piece.color);
      if (to.row === piece.row + dir && to.col === piece.col) {
        const zapResult: GameState = {
          ...state,
          pieces: removePiece(state.pieces, target.id),
          selectedSquare: null,
          highlights: [],
          abilityMode: { type: 'none' },
          lastEffect: {
            type: 'zap',
            from: { row: piece.row, col: piece.col },
            to,
          },
        };
        return checkQoBRevival(target, zapResult, null)
          ?? checkWinCondition(switchTurn(zapResult));
      }
      return null; // diagonal capture — fall through to generic
    }
    default:
      return null; // no special handling — use generic capture
  }
}

// Piece-specific captures switch the turn internally. QoB revival
// must happen before the turn switch, so we temporarily revert it.
function maybeQoBRevival(
  captured: Piece,
  result: GameState,
  pendingSecondMove: string | null,
): GameState {
  const preSwitch: GameState = {
    ...result,
    currentTurn: opponentColor(result.currentTurn),
  };
  return checkQoBRevival(captured, preSwitch, pendingSecondMove)
    ?? checkWinCondition(result);
}
