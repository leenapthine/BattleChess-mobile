import type { Piece, GameState, Color, Square } from '@/types/game';
import { getPieceAt, removePiece, findKing } from '@/engine/utils';
import { triggerDetonation } from '@/engine/pieces/QueenOfDestruction';
import { canRevive, getEligibleSacrifices } from '@/engine/pieces/QueenOfBones';
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
    const beforeDetonation = pieces;
    pieces = triggerDetonation(capturedPiece, pieces, capturingPiece);
    if (capturingPiece) {
      const stillExists = pieces.find(p => p.id === capturingPiece.id);
      if (!stillExists) {
        const afterPieces = removePiece(pieces, capturedPiece.id);
        const detonationKilledQoB = beforeDetonation.find(
          p => p.type === 'QueenOfBones' && !afterPieces.find(ap => ap.id === p.id),
        );
        return {
          state: { ...state, pieces: afterPieces },
          captured: capturedPiece,
          triggerResurrection: false,
          triggerRevival: !!detonationKilledQoB && canRevive(detonationKilledQoB.color, afterPieces),
        };
      }
    }
  }

  pieces = removePiece(pieces, capturedPiece.id);

  let triggerRevival =
    capturedPiece.type === 'QueenOfBones' &&
    canRevive(capturedPiece.color, pieces);

  if (!triggerRevival && capturedPiece.type === 'QueenOfDestruction') {
    const detonationKilledQoB = state.pieces.find(
      p => p.type === 'QueenOfBones' && !pieces.find(ap => ap.id === p.id),
    );
    if (detonationKilledQoB) {
      triggerRevival = canRevive(detonationKilledQoB.color, pieces);
    }
  }

  const triggerResurrection =
    capturingPiece?.type === 'Necromancer' &&
    capturedPiece.color !== capturingPiece.color &&
    capturedPiece.type !== 'QueenOfDestruction';

  return {
    state: { ...state, pieces },
    captured: capturedPiece,
    triggerResurrection,
    triggerRevival,
  };
}

export function checkQoBRevival(
  capturedPiece: { type: string; color: string },
  result: GameState,
  pendingSecondMove: string | null,
): GameState | null {
  if (capturedPiece.type !== 'QueenOfBones') return null;
  const color = capturedPiece.color as Color;
  if (!canRevive(color, result.pieces)) return null;

  const eligible = getEligibleSacrifices(color, result.pieces);
  return {
    ...result,
    selectedSquare: null,
    highlights: eligible.map(p => ({ row: p.row, col: p.col, color: 'ability' as const })),
    abilityMode: { type: 'sacrificeSelection', queenColor: color, sacrificeIds: [], pendingSecondMove },
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
