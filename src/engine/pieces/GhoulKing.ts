import type { Piece, Highlight, Square, GameState, GainedAbilities } from '@/types/game';
import { getKingMoves } from '@/engine/helpers/moveHelpers';
import { getAllAdjacentSquares, isEmpty, updatePiece, generateId } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKingMoves(piece, pieces);
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  if (piece.raisesLeft <= 0) return [];

  return getAllAdjacentSquares(piece)
    .filter(sq => isEmpty(sq, pieces))
    .map(sq => ({ ...sq, color: 'ability' as const }));
}

const DEFAULT_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

export function performRaise(
  ghoulKing: Piece,
  target: Square,
  state: GameState,
): GameState {
  const newNecroPawn: Piece = {
    id: generateId(),
    type: 'NecroPawn',
    color: ghoulKing.color,
    row: target.row,
    col: target.col,
    hasMoved: false,
    stunned: false,
    isStone: false,
    pawnLoaded: false,
    pieceLoaded: null,
    raisesLeft: 0,
    gainedAbilities: { ...DEFAULT_ABILITIES },
  };

  const updatedPieces = updatePiece(state.pieces, ghoulKing.id, { raisesLeft: 0 });

  return {
    ...state,
    pieces: [...updatedPieces, newNecroPawn],
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
  };
}
