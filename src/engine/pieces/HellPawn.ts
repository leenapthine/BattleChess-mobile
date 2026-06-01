import type { Piece, Highlight, GameState, GainedAbilities } from '@/types/game';
import { getValidMoves as getPawnMoves } from './Pawn';
import { getPieceAt, removePiece } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';

const PAWN_TYPES = ['Pawn', 'NecroPawn', 'HellPawn', 'YoungWiz', 'PawnHopper'] as const;

const DEFAULT_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getPawnMoves(piece, pieces);
}

export function performCapture(
  hellPawn: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === hellPawn.color || target.isStone) return state;

  let updatedPieces = removePiece(state.pieces, target.id);

  const isPawnType = (PAWN_TYPES as readonly string[]).includes(target.type);
  if (isPawnType) {
    updatedPieces = updatedPieces.map(p =>
      p.id === hellPawn.id
        ? { ...p, row: targetSquare.row, col: targetSquare.col, hasMoved: true }
        : p,
    );
  } else {
    updatedPieces = removePiece(updatedPieces, hellPawn.id);
    const transformed: Piece = {
      ...target,
      id: hellPawn.id,
      color: hellPawn.color,
      row: targetSquare.row,
      col: targetSquare.col,
      hasMoved: true,
      gainedAbilities: { ...DEFAULT_ABILITIES },
    };
    updatedPieces = [...updatedPieces, transformed];
  }

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: opponentColor(state.currentTurn),
    lastEffect: isPawnType
      ? state.lastEffect
      : { type: 'transform', at: { row: targetSquare.row, col: targetSquare.col } },
  };
}
