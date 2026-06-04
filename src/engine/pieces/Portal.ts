import type { Piece, Highlight, Square, GameState } from '@/types/game';
import { getRookMoves } from '@/engine/helpers/moveHelpers';
import { getAdjacentSquares, getPieceAt, isEmpty, updatePiece } from '@/engine/utils';

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

  // Loading no longer ends the turn (it's a free pre-action). The portal stays
  // selected, showing its moves, so the same turn can be finished by ejecting
  // (self-click) or moving the portal. The turn ends on eject/move, not here.
  const loadedPortal = updatedPieces.find(p => p.id === portal.id) ?? portal;
  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: { row: portal.row, col: portal.col },
    highlights: getRookMoves(loadedPortal, updatedPieces),
    abilityMode: { type: 'none' },
  };
}

export function performEject(
  portal: Piece,
  targetSquare: Square,
  state: GameState,
): GameState {
  if (!portal.pieceLoaded) return state;
  // Never drop onto an occupied square (incl. the portal's own square). The
  // handler already validates against getEjectTargets; this guards direct calls.
  if (!isEmpty(targetSquare, state.pieces)) return state;

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

  // Unloading is a FREE action — it does not end the turn (the portal's move
  // does). The portal stays selected, showing its moves, so the player can
  // still move it (or another piece) to finish the turn. So a turn can be
  // load → unload → move, all in one. (See GAME_OVERVIEW "Loaders".)
  const portalAfter = updatedPieces.find(p => p.id === portal.id) ?? portal;
  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: { row: portal.row, col: portal.col },
    highlights: getRookMoves(portalAfter, updatedPieces),
    abilityMode: { type: 'none' },
    lastEffect: {
      type: 'portalOut',
      from: { row: portal.row, col: portal.col },
      to: { row: targetSquare.row, col: targetSquare.col },
    },
  };
}
