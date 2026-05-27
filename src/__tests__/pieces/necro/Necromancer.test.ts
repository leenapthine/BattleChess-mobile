import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getResurrectionTargets } from '@/engine/pieces/Necromancer';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('Necromancer', () => {
  // --- Movement tests ---

  it('moves like a bishop', () => {
    const nec = makePiece('Necromancer', 'White', 4, 4);
    expect(getValidMoves(nec, [nec]).length).toBe(13);
  });

  // --- Unit function tests ---

  it('getResurrectionTargets returns empty adjacent squares', () => {
    const blocker = makePiece('Pawn', 'White', 3, 3);
    const targets = getResurrectionTargets({ row: 3, col: 4 }, [blocker]);
    expect(targets.length).toBe(3);
    expect(hasSquare(targets, 3, 3)).toBe(false);
  });

  // --- Full tap flow tests ---

  it('capture triggers resurrection targets', () => {
    const nec = makePiece('Necromancer', 'White', 2, 2);
    const enemy = makePiece('Pawn', 'Black', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([nec, enemy, wk, bk], {
      selectedSquare: { row: 2, col: 2 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).toBe('resurrection');
  });

  it('clicking resurrection target places a pawn', () => {
    const nec = makePiece('Necromancer', 'White', 2, 2);
    const enemy = makePiece('Pawn', 'Black', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([nec, enemy, wk, bk], {
      selectedSquare: { row: 2, col: 2 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    if (s1.abilityMode.type !== 'resurrection') {
      throw new Error('Expected resurrection mode');
    }
    const target = s1.highlights.find(h => h.color === 'ability');
    expect(target).toBeDefined();

    const s2 = tap(s1, { row: target!.row, col: target!.col });
    const raised = s2.pieces.find(
      p => p.row === target!.row && p.col === target!.col && p.type === 'Pawn',
    );
    expect(raised).toBeDefined();
    expect(s2.currentTurn).toBe('Black');
  });

  // --- Edge case tests ---

  it('does not trigger resurrection when capturing QoD', () => {
    const nec = makePiece('Necromancer', 'White', 2, 2);
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([nec, qod, wk, bk], {
      selectedSquare: { row: 2, col: 2 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).not.toBe('resurrection');
  });
});
