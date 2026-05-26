import type { Piece, Highlight, Square } from '@/types/game';
import { getValidMoves as getPawnMoves } from './Pawn';
import { isInBounds, getPieceAt, isOpponent, isEmpty, forwardDirection, removePiece } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getPawnMoves(piece, pieces);
  const dir = forwardDirection(piece.color);
  const twoStep: Square = { row: piece.row + 2 * dir, col: piece.col };

  if (!isInBounds(twoStep)) return highlights;
  if (!isEmpty(twoStep, pieces)) return highlights;

  const oneStep: Square = { row: piece.row + dir, col: piece.col };
  const isHopCapture = isOpponent(oneStep, piece.color, pieces);

  const existing = highlights.find(h => h.row === twoStep.row && h.col === twoStep.col);
  if (!existing) {
    highlights.push({ ...twoStep, color: isHopCapture ? 'capture' : 'move' });
  }

  return highlights;
}

export function applyHopCapture(
  from: Square,
  to: Square,
  pieces: Piece[],
  color: Piece['color'],
): { pieces: Piece[]; captured: Piece | null } {
  const dir = forwardDirection(color);
  const isTwoStep = Math.abs(to.row - from.row) === 2 && to.col === from.col;

  if (!isTwoStep) return { pieces, captured: null };

  const hoppedSquare: Square = { row: from.row + dir, col: from.col };
  const hopped = getPieceAt(hoppedSquare, pieces);

  if (hopped && hopped.color !== color) {
    return { pieces: removePiece(pieces, hopped.id), captured: hopped };
  }

  return { pieces, captured: null };
}
