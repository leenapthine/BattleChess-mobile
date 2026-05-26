import type { Piece, GameState, Color, Square } from '@/types/game';
import { getPieceAt, removePiece, findKing } from '@/engine/utils';
import { triggerDetonation } from '@/engine/pieces/QueenOfDestruction';
import { canRevive } from '@/engine/pieces/QueenOfBones';
import { getResurrectionTargets } from '@/engine/pieces/Necromancer';

export type CaptureResult = {
  state: GameState;
  captured: Piece | null;
  triggerResurrection: boolean;
  triggerRevival: boolean;
};

export function handleCapture(
  capturedPiece: Piece,
  capturingPiece: Piece | null,
  state: GameState,
): CaptureResult {
  const noChange: CaptureResult = {
    state,
    captured: null,
    triggerResurrection: false,
    triggerRevival: false,
  };

  if (!capturedPiece) return noChange;
  if (capturedPiece.isStone) return noChange;

  let pieces = state.pieces;

  if (capturedPiece.type === 'QueenOfDestruction') {
    pieces = triggerDetonation(capturedPiece, pieces, capturingPiece);
    if (capturingPiece) {
      const stillExists = pieces.find(p => p.id === capturingPiece.id);
      if (!stillExists) {
        return {
          state: { ...state, pieces: removePiece(pieces, capturedPiece.id) },
          captured: capturedPiece,
          triggerResurrection: false,
          triggerRevival: false,
        };
      }
    }
  }

  pieces = removePiece(pieces, capturedPiece.id);

  const triggerResurrection =
    capturingPiece?.type === 'Necromancer' &&
    capturedPiece.color !== capturingPiece.color &&
    capturedPiece.type !== 'QueenOfDestruction';

  const triggerRevival =
    capturedPiece.type === 'QueenOfBones' &&
    canRevive(capturedPiece.color, pieces);

  return {
    state: { ...state, pieces },
    captured: capturedPiece,
    triggerResurrection,
    triggerRevival,
  };
}

export function checkWinCondition(state: GameState): GameState {
  const whiteKing = findKing('White', state.pieces);
  const blackKing = findKing('Black', state.pieces);

  if (!whiteKing) {
    return { ...state, status: { type: 'won', winner: 'Black' } };
  }
  if (!blackKing) {
    return { ...state, status: { type: 'won', winner: 'White' } };
  }
  return state;
}
