import type { Piece, Square, Color, Highlight } from '@/types/game';
import { isInBounds, getPieceAt } from '@/engine/utils';

type Direction = { dRow: number; dCol: number };

const ORTHOGONAL: Direction[] = [
  { dRow: -1, dCol: 0 },
  { dRow: 1, dCol: 0 },
  { dRow: 0, dCol: -1 },
  { dRow: 0, dCol: 1 },
];

const DIAGONAL: Direction[] = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 1 },
  { dRow: 1, dCol: -1 },
  { dRow: 1, dCol: 1 },
];

const ALL_DIRECTIONS: Direction[] = [...ORTHOGONAL, ...DIAGONAL];

export function getSlidingMoves(
  piece: Piece,
  pieces: Piece[],
  directions: Direction[],
): Highlight[] {
  const highlights: Highlight[] = [];

  for (const dir of directions) {
    let current: Square = {
      row: piece.row + dir.dRow,
      col: piece.col + dir.dCol,
    };

    while (isInBounds(current)) {
      const occupant = getPieceAt(current, pieces);
      if (occupant) {
        if (occupant.color !== piece.color) {
          highlights.push({ ...current, color: 'capture' });
        }
        break;
      }
      highlights.push({ ...current, color: 'move' });
      current = {
        row: current.row + dir.dRow,
        col: current.col + dir.dCol,
      };
    }
  }

  return highlights;
}

export function getStepMoves(
  piece: Piece,
  pieces: Piece[],
  offsets: Square[],
): Highlight[] {
  const highlights: Highlight[] = [];

  for (const offset of offsets) {
    const target: Square = {
      row: piece.row + offset.row,
      col: piece.col + offset.col,
    };
    if (!isInBounds(target)) continue;

    const occupant = getPieceAt(target, pieces);
    if (!occupant) {
      highlights.push({ ...target, color: 'move' });
    } else if (occupant.color !== piece.color) {
      highlights.push({ ...target, color: 'capture' });
    }
  }

  return highlights;
}

export function getRookMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getSlidingMoves(piece, pieces, ORTHOGONAL);
}

export function getBishopMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getSlidingMoves(piece, pieces, DIAGONAL);
}

export function getQueenMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getSlidingMoves(piece, pieces, ALL_DIRECTIONS);
}

export function getKingMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const offsets: Square[] = ALL_DIRECTIONS.map(d => ({ row: d.dRow, col: d.dCol }));
  return getStepMoves(piece, pieces, offsets);
}

export function getKnightMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const offsets: Square[] = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 },  { row: 1, col: 2 },
    { row: 2, col: -1 },  { row: 2, col: 1 },
  ];
  return getStepMoves(piece, pieces, offsets);
}

export {
  ORTHOGONAL,
  DIAGONAL,
  ALL_DIRECTIONS,
  type Direction,
};
