import {
  isInBounds,
  getPieceAt,
  isOpponent,
  isFriendly,
  isEmpty,
  getAdjacentSquares,
  getAllAdjacentSquares,
  isPathClear,
  squaresEqual,
  forwardDirection,
  pawnStartRow,
  removePiece,
  updatePiece,
  findKing,
} from '@/engine/utils';
import { makePiece, resetIds } from './testHelpers';

beforeEach(() => resetIds());

describe('isInBounds', () => {
  it('accepts valid squares', () => {
    expect(isInBounds({ row: 0, col: 0 })).toBe(true);
    expect(isInBounds({ row: 7, col: 7 })).toBe(true);
    expect(isInBounds({ row: 3, col: 4 })).toBe(true);
  });

  it('rejects out-of-bounds squares', () => {
    expect(isInBounds({ row: -1, col: 0 })).toBe(false);
    expect(isInBounds({ row: 0, col: 8 })).toBe(false);
    expect(isInBounds({ row: 8, col: 0 })).toBe(false);
    expect(isInBounds({ row: 0, col: -1 })).toBe(false);
  });
});

describe('getPieceAt', () => {
  it('returns piece at position', () => {
    const p = makePiece('Pawn', 'White', 3, 4);
    expect(getPieceAt({ row: 3, col: 4 }, [p])).toBe(p);
  });

  it('returns null for empty square', () => {
    const p = makePiece('Pawn', 'White', 3, 4);
    expect(getPieceAt({ row: 0, col: 0 }, [p])).toBeNull();
  });

  it('returns null for empty board', () => {
    expect(getPieceAt({ row: 0, col: 0 }, [])).toBeNull();
  });
});

describe('isOpponent / isFriendly / isEmpty', () => {
  const white = makePiece('Pawn', 'White', 1, 0);
  const black = makePiece('Pawn', 'Black', 6, 0);
  const pieces = [white, black];

  it('isOpponent detects enemy', () => {
    expect(isOpponent({ row: 6, col: 0 }, 'White', pieces)).toBe(true);
    expect(isOpponent({ row: 1, col: 0 }, 'White', pieces)).toBe(false);
    expect(isOpponent({ row: 3, col: 3 }, 'White', pieces)).toBe(false);
  });

  it('isFriendly detects ally', () => {
    expect(isFriendly({ row: 1, col: 0 }, 'White', pieces)).toBe(true);
    expect(isFriendly({ row: 6, col: 0 }, 'White', pieces)).toBe(false);
  });

  it('isEmpty detects empty squares', () => {
    expect(isEmpty({ row: 3, col: 3 }, pieces)).toBe(true);
    expect(isEmpty({ row: 1, col: 0 }, pieces)).toBe(false);
  });
});

describe('getAdjacentSquares', () => {
  it('returns 4 orthogonal neighbors in center', () => {
    const adj = getAdjacentSquares({ row: 4, col: 4 });
    expect(adj).toHaveLength(4);
  });

  it('returns 2 in corner', () => {
    const adj = getAdjacentSquares({ row: 0, col: 0 });
    expect(adj).toHaveLength(2);
  });
});

describe('getAllAdjacentSquares', () => {
  it('returns 8 neighbors in center', () => {
    expect(getAllAdjacentSquares({ row: 4, col: 4 })).toHaveLength(8);
  });

  it('returns 3 in corner', () => {
    expect(getAllAdjacentSquares({ row: 0, col: 0 })).toHaveLength(3);
  });
});

describe('isPathClear', () => {
  it('returns true on empty path', () => {
    expect(isPathClear({ row: 0, col: 0 }, { row: 0, col: 7 }, [])).toBe(true);
  });

  it('returns false when blocked', () => {
    const blocker = makePiece('Pawn', 'White', 0, 3);
    expect(isPathClear({ row: 0, col: 0 }, { row: 0, col: 7 }, [blocker])).toBe(false);
  });

  it('does not count destination as blocking', () => {
    const target = makePiece('Pawn', 'Black', 0, 7);
    expect(isPathClear({ row: 0, col: 0 }, { row: 0, col: 7 }, [target])).toBe(true);
  });
});

describe('squaresEqual', () => {
  it('matches identical squares', () => {
    expect(squaresEqual({ row: 2, col: 3 }, { row: 2, col: 3 })).toBe(true);
  });

  it('rejects different squares', () => {
    expect(squaresEqual({ row: 2, col: 3 }, { row: 3, col: 2 })).toBe(false);
  });
});

describe('forwardDirection / pawnStartRow', () => {
  it('White moves forward (increasing row)', () => {
    expect(forwardDirection('White')).toBe(1);
    expect(pawnStartRow('White')).toBe(1);
  });

  it('Black moves forward (decreasing row)', () => {
    expect(forwardDirection('Black')).toBe(-1);
    expect(pawnStartRow('Black')).toBe(6);
  });
});

describe('removePiece', () => {
  it('removes by id', () => {
    const a = makePiece('Pawn', 'White', 0, 0);
    const b = makePiece('Pawn', 'White', 1, 0);
    const result = removePiece([a, b], a.id);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(b.id);
  });
});

describe('updatePiece', () => {
  it('updates only the target piece', () => {
    const a = makePiece('Pawn', 'White', 0, 0);
    const b = makePiece('Pawn', 'White', 1, 0);
    const result = updatePiece([a, b], a.id, { row: 5 });
    expect(result.find(p => p.id === a.id)!.row).toBe(5);
    expect(result.find(p => p.id === b.id)!.row).toBe(1);
  });
});

describe('findKing', () => {
  it('finds standard King', () => {
    const king = makePiece('King', 'White', 0, 4);
    expect(findKing('White', [king])).toBe(king);
  });

  it('finds guild kings', () => {
    const gk = makePiece('GhoulKing', 'White', 0, 4);
    expect(findKing('White', [gk])).toBe(gk);
  });

  it('returns undefined when no king exists', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    expect(findKing('White', [pawn])).toBeUndefined();
  });
});
