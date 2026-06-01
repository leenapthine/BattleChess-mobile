import type { Piece, Highlight, Square, GameState } from '@/types/game';
import { getRookMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, getPieceAt, isEmpty, updatePiece } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getRookMoves(piece, pieces);
}

export function getLoadTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return getAdjacentSquares(piece)
    .filter(sq => {
      const target = getPieceAt(sq, pieces);
      return target !== null && target.color === piece.color;
    })
    .map(sq => ({ ...sq, color: 'ability' as const }));
}

export function getEjectTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  return getAdjacentSquares(piece)
    .filter(sq => isEmpty(sq, pieces))
    .map(sq => ({ ...sq, color: 'ability' as const }));
}

export function performLoad(
  portal: Piece,
  targetId: string,
  state: GameState,
): GameState {
  const target = state.pieces.find(p => p.id === targetId);
  if (!target) return state;

  let updatedPieces = state.pieces.filter(p => p.id !== target.id);

  updatedPieces = updatedPieces.map(p => {
    if (p.type === 'Portal' && p.color === portal.color) {
      return { ...p, pieceLoaded: { ...target } };
    }
    return p;
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: opponentColor(state.currentTurn),
  };
}

export function performEject(
  portal: Piece,
  targetSquare: Square,
  state: GameState,
): GameState {
  if (!portal.pieceLoaded) return state;

  const ejected: Piece = {
    ...portal.pieceLoaded,
    row: targetSquare.row,
    col: targetSquare.col,
  };

  let updatedPieces = state.pieces.map(p => {
    if (p.type === 'Portal' && p.color === portal.color) {
      return { ...p, pieceLoaded: null };
    }
    return p;
  });

  updatedPieces = [...updatedPieces, ejected];

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    lastEffect: {
      type: 'portalOut',
      from: { row: portal.row, col: portal.col },
      to: { row: targetSquare.row, col: targetSquare.col },
    },
  };
}
