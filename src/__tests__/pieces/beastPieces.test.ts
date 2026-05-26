import { getValidMoves as getPHMoves, applyHopCapture } from '@/engine/pieces/PawnHopper';
import { getValidMoves as getBKMoves } from '@/engine/pieces/BeastKnight';
import { getValidMoves as getBDMoves } from '@/engine/pieces/BeastDruid';
import { getValidMoves as getBTMoves, getAbilityTargets as getBTTargets } from '@/engine/pieces/BoulderThrower';
import { getValidMoves as getFKMoves } from '@/engine/pieces/FrogKing';
import { getValidMoves as getQoDomMoves, getAbilityTargets as getQoDomTargets, applyDomination, revertDomination } from '@/engine/pieces/QueenOfDomination';
import { makePiece, makeState, resetIds, hasSquare } from '../testHelpers';

beforeEach(() => resetIds());

describe('PawnHopper', () => {
  it('always has 2-step forward regardless of hasMoved', () => {
    const ph = makePiece('PawnHopper', 'White', 3, 3, { hasMoved: true });
    const moves = getPHMoves(ph, [ph]);
    expect(hasSquare(moves, 5, 3)).toBe(true);
  });

  it('marks 2-step as capture when enemy is in between', () => {
    const ph = makePiece('PawnHopper', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const moves = getPHMoves(ph, [ph, enemy]);
    const twoStep = moves.find(m => m.row === 5 && m.col === 3);
    expect(twoStep).toBeDefined();
    expect(twoStep!.color).toBe('capture');
  });

  it('applyHopCapture removes hopped enemy', () => {
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const ph = makePiece('PawnHopper', 'White', 5, 3);
    const result = applyHopCapture({ row: 3, col: 3 }, { row: 5, col: 3 }, [ph, enemy], 'White');
    expect(result.captured).toBeDefined();
    expect(result.captured!.id).toBe(enemy.id);
    expect(result.pieces.find(p => p.id === enemy.id)).toBeUndefined();
  });

  it('applyHopCapture does nothing on same-column single step', () => {
    const ph = makePiece('PawnHopper', 'White', 4, 3);
    const result = applyHopCapture({ row: 3, col: 3 }, { row: 4, col: 3 }, [ph], 'White');
    expect(result.captured).toBeNull();
  });
});

describe('BeastKnight', () => {
  it('has extended 3+1 L-shape', () => {
    const bk = makePiece('BeastKnight', 'White', 4, 4);
    const moves = getBKMoves(bk, [bk]);
    expect(hasSquare(moves, 7, 5)).toBe(true);
    expect(hasSquare(moves, 7, 3)).toBe(true);
    expect(hasSquare(moves, 5, 7)).toBe(true);
    expect(hasSquare(moves, 3, 7)).toBe(true);
  });

  it('does not have standard 2+1 knight squares', () => {
    const bk = makePiece('BeastKnight', 'White', 4, 4);
    const moves = getBKMoves(bk, [bk]);
    expect(hasSquare(moves, 6, 5)).toBe(false);
    expect(hasSquare(moves, 6, 3)).toBe(false);
  });
});

describe('BeastDruid', () => {
  it('combines bishop and king moves', () => {
    const bd = makePiece('BeastDruid', 'White', 4, 4);
    const moves = getBDMoves(bd, [bd]);
    expect(hasSquare(moves, 7, 7)).toBe(true);
    expect(hasSquare(moves, 5, 4)).toBe(true);
    expect(hasSquare(moves, 4, 5)).toBe(true);
  });

  it('deduplicates overlapping squares', () => {
    const bd = makePiece('BeastDruid', 'White', 4, 4);
    const moves = getBDMoves(bd, [bd]);
    const keys = moves.map(m => `${m.row},${m.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('BoulderThrower', () => {
  it('moves along orthogonal lines (empty only)', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const moves = getBTMoves(bt, [bt]);
    expect(moves.length).toBe(14);
    expect(moves.every(m => m.color === 'move')).toBe(true);
  });

  it('stops at any piece (no capture via movement)', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 6);
    const moves = getBTMoves(bt, [bt, enemy]);
    expect(hasSquare(moves, 4, 5)).toBe(true);
    expect(hasSquare(moves, 4, 6)).toBe(false);
  });

  it('getAbilityTargets shows enemies at manhattan-3', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getBTTargets(bt, [bt, enemy]);
    expect(hasSquare(targets, 4, 7)).toBe(true);
  });
});

describe('FrogKing', () => {
  it('has king moves plus 2-tile orthogonal hops', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const moves = getFKMoves(fk, [fk]);
    expect(hasSquare(moves, 6, 4)).toBe(true);
    expect(hasSquare(moves, 2, 4)).toBe(true);
    expect(hasSquare(moves, 4, 6)).toBe(true);
    expect(hasSquare(moves, 4, 2)).toBe(true);
  });

  it('hops can capture enemies', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 6, 4);
    const moves = getFKMoves(fk, [fk, enemy]);
    const hop = moves.find(m => m.row === 6 && m.col === 4);
    expect(hop!.color).toBe('capture');
  });

  it('hops jump over intervening pieces', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const blocker = makePiece('Pawn', 'White', 5, 4);
    const moves = getFKMoves(fk, [fk, blocker]);
    expect(hasSquare(moves, 6, 4)).toBe(true);
  });

  it('no diagonal hops', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const moves = getFKMoves(fk, [fk]);
    expect(hasSquare(moves, 6, 6)).toBe(false);
    expect(hasSquare(moves, 2, 2)).toBe(false);
  });
});

describe('QueenOfDomination', () => {
  it('moves like a queen', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    expect(getQoDomMoves(q, [q]).length).toBe(27);
  });

  it('getAbilityTargets shows adjacent friendly (not self)', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const targets = getQoDomTargets(q, [q, ally, enemy]);
    expect(targets).toHaveLength(1);
    expect(hasSquare(targets, 4, 5)).toBe(true);
  });

  it('no ability targets when pieceLoaded already set', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const q = makePiece('QueenOfDomination', 'White', 4, 4, { pieceLoaded: loaded });
    const ally = makePiece('Pawn', 'White', 4, 5);
    expect(getQoDomTargets(q, [q, ally])).toHaveLength(0);
  });

  it('applyDomination transforms target into Queen', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const state = makeState([q, ally]);
    const result = applyDomination(q, ally.id, state);
    const dominated = result.pieces.find(p => p.id === ally.id)!;
    expect(dominated.type).toBe('Queen');
    expect(result.abilityMode.type).toBe('domination');
  });

  it('revertDomination restores original piece at new position', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    const original = makePiece('Pawn', 'White', 4, 5);
    const queenWithLoaded = { ...q, pieceLoaded: { ...original } };
    const movedDominated = { ...original, type: 'Queen' as const, row: 6, col: 5 };
    const state = makeState([queenWithLoaded, movedDominated]);
    const result = revertDomination(queenWithLoaded, movedDominated, state);
    const restored = result.pieces.find(p => p.id === original.id)!;
    expect(restored.type).toBe('Pawn');
    expect(restored.row).toBe(6);
    expect(restored.col).toBe(5);
    const updatedQueen = result.pieces.find(p => p.id === q.id)!;
    expect(updatedQueen.pieceLoaded).toBeNull();
  });
});
