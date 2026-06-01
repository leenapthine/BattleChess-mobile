import type { Piece, Highlight, GameState } from '@/types/game';
import { getQueenMoves } from '@/engine/helpers/moveHelpers';
import { getAllAdjacentSquares, getPieceAt, updatePiece } from '@/engine/utils';
import { getPieceModule } from './index';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getQueenMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  if (piece.pieceLoaded) return [];

  return getAllAdjacentSquares(piece)
    .filter(sq => {
      const target = getPieceAt(sq, pieces);
      return target !== null && target.color === piece.color && target.id !== piece.id;
    })
    .map(sq => ({ ...sq, color: 'ability' as const }));
}

export function applyDomination(
  queen: Piece,
  targetId: string,
  state: GameState,
): GameState {
  if (queen.pieceLoaded) return state;

  const target = state.pieces.find(p => p.id === targetId);
  if (!target) return state;

  const updatedQueen: Piece = { ...queen, pieceLoaded: { ...target } };
  const dominated: Piece = {
    ...target,
    type: 'Queen',
    stunned: false,
    pieceLoaded: null,
  };

  let updatedPieces = state.pieces.map(p => {
    if (p.id === queen.id) return updatedQueen;
    if (p.id === target.id) return dominated;
    return p;
  });

  const queenModule = getPieceModule('Queen');
  const hasMoves = queenModule
    ? queenModule.getValidMoves(dominated, updatedPieces).length > 0
    : false;

  if (!hasMoves) {
    return revertDomination(updatedQueen, dominated, {
      ...state,
      pieces: updatedPieces,
    });
  }

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: { row: dominated.row, col: dominated.col },
    highlights: queenModule ? queenModule.getValidMoves(dominated, updatedPieces) : [],
    abilityMode: { type: 'domination', pieceId: queen.id },
    lastEffect: {
      type: 'dominate',
      from: { row: queen.row, col: queen.col },
      to: { row: target.row, col: target.col },
    },
  };
}

export function revertDomination(
  queen: Piece,
  movedPiece: Piece,
  state: GameState,
): GameState {
  if (!queen.pieceLoaded) return state;

  const restored: Piece = {
    ...queen.pieceLoaded,
    row: movedPiece.row,
    col: movedPiece.col,
  };

  const clearedQueen: Piece = { ...queen, pieceLoaded: null };

  const updatedPieces = state.pieces
    .filter(p => p.id !== movedPiece.id)
    .map(p => (p.id === queen.id ? clearedQueen : p))
    .concat(restored);

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
  };
}
