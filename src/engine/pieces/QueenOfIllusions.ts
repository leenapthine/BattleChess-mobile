import type { Piece, Highlight, GameState, PieceType } from '@/types/game';
import { getQueenMoves } from '@/engine/helpers/moveHelpers';
import { updatePiece } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';

const SWAP_TYPES: PieceType[] = ['Pawn', 'NecroPawn', 'HellPawn', 'YoungWiz', 'PawnHopper'];

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getQueenMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return pieces
    .filter(p =>
      p.color === piece.color &&
      SWAP_TYPES.includes(p.type) &&
      p.id !== piece.id,
    )
    .map(p => ({ row: p.row, col: p.col, color: 'ability' as const }));
}

export function performSwap(
  queen: Piece,
  targetId: string,
  state: GameState,
): GameState {
  const target = state.pieces.find(p => p.id === targetId);
  if (!target || target.color !== queen.color) return state;
  if (!SWAP_TYPES.includes(target.type)) return state;

  let updatedPieces = updatePiece(state.pieces, queen.id, {
    row: target.row,
    col: target.col,
  });
  updatedPieces = updatePiece(updatedPieces, target.id, {
    row: queen.row,
    col: queen.col,
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: opponentColor(state.currentTurn),
    lastEffect: {
      type: 'swap',
      from: { row: queen.row, col: queen.col },
      to: { row: target.row, col: target.col },
    },
  };
}
