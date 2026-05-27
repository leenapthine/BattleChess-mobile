import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets, applyDomination, revertDomination } from '@/engine/pieces/QueenOfDomination';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('QueenOfDomination', () => {
  // --- Movement tests ---

  it('moves like a queen', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    expect(getValidMoves(q, [q]).length).toBe(27);
  });

  // --- Unit function tests ---

  it('getAbilityTargets shows adjacent friendly (not self)', () => {
    const q = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const targets = getAbilityTargets(q, [q, ally, enemy]);
    expect(targets).toHaveLength(1);
    expect(hasSquare(targets, 4, 5)).toBe(true);
  });

  it('no ability targets when pieceLoaded already set', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const q = makePiece('QueenOfDomination', 'White', 4, 4, { pieceLoaded: loaded });
    const ally = makePiece('Pawn', 'White', 4, 5);
    expect(getAbilityTargets(q, [q, ally])).toHaveLength(0);
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

  // --- Full tap flow tests ---

  it('clicking adjacent friendly enters domination mode', () => {
    const qod = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qod, ally, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const abilityHL = s1.highlights.find(h => h.row === 4 && h.col === 5 && h.color === 'ability');
    expect(abilityHL).toBeDefined();

    const s2 = tap(s1, { row: 4, col: 5 });
    expect(s2.abilityMode.type).toBe('domination');
  });

  // --- Edge case tests ---

  it('dominated piece type changes to Queen temporarily', () => {
    const qod = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qod, ally, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 4, col: 5 });
    if (s2.abilityMode.type === 'domination') {
      const dominated = s2.pieces.find(p => p.id === ally.id)!;
      expect(dominated.type).toBe('Queen');
    }
  });

  it('dominated piece reverts after moving', () => {
    const qod = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qod, ally, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 4, col: 5 });
    if (s2.abilityMode.type === 'domination' && s2.highlights.length > 0) {
      const moveTarget = s2.highlights.find(h => h.color === 'move')!;
      const s3 = tap(s2, { row: moveTarget.row, col: moveTarget.col });
      const reverted = s3.pieces.find(p => p.id === ally.id)!;
      expect(reverted.type).toBe('Pawn');
      expect(reverted.row).toBe(moveTarget.row);
      expect(reverted.col).toBe(moveTarget.col);
    }
  });

  it('cannot dominate when already has pieceLoaded', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const qod = makePiece('QueenOfDomination', 'White', 4, 4, { pieceLoaded: loaded });
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qod, ally, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const abilityHL = s1.highlights.filter(h => h.color === 'ability');
    expect(abilityHL).toHaveLength(0);
  });
});
