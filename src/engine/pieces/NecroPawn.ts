import type { Piece, Highlight, Square, GameState } from '@/types/game';
import { getValidMoves as getPawnMoves } from './Pawn';
import { getAllAdjacentSquares, isInBounds, getPieceAt, removePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getPawnMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return getAllAdjacentSquares(piece)
    .filter(isInBounds)
    .map(sq => ({ ...sq, color: 'ability' as const }));
}

export function performSacrifice(
  necroPawn: Piece,
  state: GameState,
): GameState {
  const aoeSquares: Square[] = [
    { row: necroPawn.row, col: necroPawn.col },
    ...getAllAdjacentSquares(necroPawn),
  ];

  let updatedPieces = state.pieces;
  for (const sq of aoeSquares) {
    const victim = getPieceAt(sq, updatedPieces);
    if (victim && !victim.isStone) {
      updatedPieces = removePiece(updatedPieces, victim.id);
    }
  }

  updatedPieces = removePiece(updatedPieces, necroPawn.id);

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}
