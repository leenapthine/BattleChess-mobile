import type { Piece, Highlight, GameState } from '@/types/game';
import { getKnightMoves } from '@/engine/helpers/moveHelpers';
import { getPieceAt, removePiece, updatePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getKnightMoves(piece, pieces);
}

export function performCapture(
  prowler: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === prowler.color) return state;

  if (target.type === 'QueenOfDestruction') {
    return handleQoDCapture(prowler, target, state);
  }

  const updatedPieces = removePiece(state.pieces, target.id);
  const movedPieces = updatePiece(updatedPieces, prowler.id, {
    row: targetSquare.row,
    col: targetSquare.col,
    hasMoved: true,
  });

  const movedProwler = { ...prowler, row: targetSquare.row, col: targetSquare.col };
  const secondMoves = getKnightMoves(movedProwler, movedPieces);

  if (secondMoves.length === 0) {
    return {
      ...state,
      pieces: movedPieces,
      selectedSquare: null,
      highlights: [],
      abilityMode: { type: 'none' },
      currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
    };
  }

  return {
    ...state,
    pieces: movedPieces,
    selectedSquare: targetSquare,
    highlights: secondMoves,
    abilityMode: { type: 'secondMove', pieceId: prowler.id },
  };
}

export function performSecondMove(
  prowler: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  let pieces = state.pieces;

  const target = getPieceAt(targetSquare, pieces);
  if (target && target.color !== prowler.color && !target.isStone) {
    pieces = removePiece(pieces, target.id);
  }

  pieces = updatePiece(pieces, prowler.id, {
    row: targetSquare.row,
    col: targetSquare.col,
  });

  return {
    ...state,
    pieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}

function handleQoDCapture(
  prowler: Piece,
  qod: Piece,
  state: GameState,
): GameState {
  let updatedPieces = removePiece(state.pieces, qod.id);

  for (const sq of getDetonationSquares(qod)) {
    const victim = getPieceAt(sq, updatedPieces);
    if (victim && !victim.isStone) {
      updatedPieces = removePiece(updatedPieces, victim.id);
    }
  }

  updatedPieces = updatePiece(updatedPieces, prowler.id, {
    row: qod.row,
    col: qod.col,
    hasMoved: true,
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}

function getDetonationSquares(piece: Piece) {
  const offsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 },                        { row: 0, col: 1 },
    { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
  ];
  return offsets.map(o => ({ row: piece.row + o.row, col: piece.col + o.col }));
}
