import type { Piece, Highlight, Square } from '@/types/game';
import { isInBounds, getPieceAt, isEmpty, isOpponent } from '@/engine/utils';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights: Highlight[] = [];
  const directions = [
    { dRow: -1, dCol: 0 },
    { dRow: 1, dCol: 0 },
    { dRow: 0, dCol: -1 },
    { dRow: 0, dCol: 1 },
  ];

  for (const dir of directions) {
    let current: Square = { row: piece.row + dir.dRow, col: piece.col + dir.dCol };
    while (isInBounds(current)) {
      if (!isEmpty(current, pieces)) break;
      highlights.push({ ...current, color: 'move' });
      current = { row: current.row + dir.dRow, col: current.col + dir.dCol };
    }
  }

  return highlights;
}

export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      if (Math.abs(dx) + Math.abs(dy) !== 3) continue;
      const sq: Square = { row: piece.row + dy, col: piece.col + dx };
      if (!isInBounds(sq)) continue;
      if (isOpponent(sq, piece.color, pieces)) {
        const target = getPieceAt(sq, pieces);
        if (target && !target.isStone) {
          targets.push({ ...sq, color: 'ability' });
        }
      }
    }
  }

  return targets;
}
