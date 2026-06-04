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

// "Donut + core" targeting: the BoulderThrower hurls a boulder at Manhattan
// distance 3 (its long lob) OR stomps an adjacent square at distance 1 — but it
// has a blind spot at distance 2. The point-blank stomp means a piece that gets
// adjacent is no longer safe (the long-only version was helpless up close); the
// distance-2 ring stays exploitable, which keeps the unit's distinctive shape.
export function getAbilityTargets(piece: Piece, pieces: Piece[]): Highlight[] {
  const targets: Highlight[] = [];

  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist !== 1 && dist !== 3) continue;
      const sq: Square = { row: piece.row + dy, col: piece.col + dx };
      if (!isInBounds(sq)) continue;
      const occupant = getPieceAt(sq, pieces);
      if (occupant && occupant.color !== piece.color && !occupant.isStone) {
        targets.push({ ...sq, color: 'capture' });
      } else {
        targets.push({ ...sq, color: 'range' });
      }
    }
  }

  return targets;
}
