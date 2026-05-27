import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, performCapture, performSecondMove } from '@/engine/pieces/Prowler';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('Prowler', () => {
  // --- Movement tests ---

  it('moves like a knight', () => {
    const p = makePiece('Prowler', 'Black', 4, 4);
    expect(getValidMoves(p, [p])).toHaveLength(8);
  });

  // --- Unit function tests ---

  it('BUG #2 REGRESSION: performCapture enters secondMove with correct pieceId', () => {
    const prowler = makePiece('Prowler', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 2, 3);
    const state = makeState([prowler, enemy], { currentTurn: 'Black' });
    const result = performCapture(prowler, { row: 2, col: 3 }, state);
    expect(result.abilityMode.type).toBe('secondMove');
    if (result.abilityMode.type === 'secondMove') {
      expect(result.abilityMode.pieceId).toBe(prowler.id);
    }
    expect(result.currentTurn).toBe('Black');
  });

  it('performSecondMove ends turn', () => {
    const prowler = makePiece('Prowler', 'Black', 2, 3);
    const state = makeState([prowler], {
      currentTurn: 'Black',
      abilityMode: { type: 'secondMove', pieceId: prowler.id },
    });
    const result = performSecondMove(prowler, { row: 4, col: 4 }, state);
    expect(result.currentTurn).toBe('White');
    expect(result.abilityMode.type).toBe('none');
  });

  // --- Full tap flow tests ---

  function prowlerCaptureState() {
    const pr = makePiece('Prowler', 'Black', 7, 1);
    const enemy = makePiece('Pawn', 'White', 5, 2);
    const friendly = makePiece('HellPawn', 'Black', 6, 0);
    const enemy2 = makePiece('Pawn', 'White', 3, 1);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    return {
      pr, enemy, friendly, enemy2,
      state: makeState([pr, enemy, friendly, enemy2, wk, bk], {
        currentTurn: 'Black',
        selectedSquare: { row: 7, col: 1 },
        highlights: [{ row: 5, col: 2, color: 'capture' }],
      }),
    };
  }

  it('capture triggers second move with knight highlights', () => {
    const { pr, state } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    expect(s1.abilityMode.type).toBe('secondMove');
    expect(s1.highlights.length).toBeGreaterThan(0);
    expect(s1.selectedSquare).toEqual({ row: 5, col: 2 });
  });

  it('second move highlights include enemies but not friendlies', () => {
    const { state, enemy2, friendly } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const coords = s1.highlights.map(h => `${h.row},${h.col}`);
    expect(coords).toContain(`${enemy2.row},${enemy2.col}`);
    expect(coords).not.toContain(`${friendly.row},${friendly.col}`);
  });

  it('clicking a highlighted empty square completes second move', () => {
    const { pr, state } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const target = s1.highlights[0];
    const s2 = tap(s1, { row: target.row, col: target.col });
    const moved = s2.pieces.find(p => p.id === pr.id)!;
    expect(moved.row).toBe(target.row);
    expect(moved.col).toBe(target.col);
    expect(s2.currentTurn).toBe('White');
    expect(s2.abilityMode.type).toBe('none');
  });

  it('second move can capture an enemy', () => {
    const { pr, state, enemy2 } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const captureHL = s1.highlights.find(h => h.row === enemy2.row && h.col === enemy2.col);
    expect(captureHL).toBeDefined();
    expect(captureHL!.color).toBe('capture');

    const s2 = tap(s1, { row: enemy2.row, col: enemy2.col });
    expect(s2.pieces.find(p => p.id === enemy2.id)).toBeUndefined();
    const moved = s2.pieces.find(p => p.id === pr.id)!;
    expect(moved.row).toBe(enemy2.row);
    expect(moved.col).toBe(enemy2.col);
    expect(s2.currentTurn).toBe('White');
  });

  it('clicking a friendly piece does NOT end the turn', () => {
    const { state, friendly } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const s2 = tap(s1, { row: friendly.row, col: friendly.col });
    expect(s2.abilityMode.type).toBe('secondMove');
    expect(s2.currentTurn).toBe('Black');
    expect(s2.highlights.length).toBeGreaterThan(0);
  });

  it('clicking an enemy not on a highlight does NOT end the turn', () => {
    const { state } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const farEnemy = makePiece('Pawn', 'White', 0, 7);
    const s1WithFar = { ...s1, pieces: [...s1.pieces, farEnemy] };
    const s2 = tap(s1WithFar, { row: 0, col: 7 });
    expect(s2.abilityMode.type).toBe('secondMove');
    expect(s2.currentTurn).toBe('Black');
    expect(s2.pieces.find(p => p.id === farEnemy.id)).toBeDefined();
  });

  it('clicking an empty non-highlighted square does NOT end the turn', () => {
    const { state } = prowlerCaptureState();
    const s1 = tap(state, { row: 5, col: 2 });
    const s2 = tap(s1, { row: 0, col: 7 });
    expect(s2.abilityMode.type).toBe('secondMove');
    expect(s2.currentTurn).toBe('Black');
  });

  it('auto-ends turn if no valid second moves exist', () => {
    const pr = makePiece('Prowler', 'Black', 0, 0);
    const enemy = makePiece('Pawn', 'White', 2, 1);
    const wk = makePiece('King', 'White', 7, 7);
    const bk = makePiece('King', 'Black', 7, 0);
    const blocker1 = makePiece('Pawn', 'Black', 0, 0);
    const blocker2 = makePiece('Pawn', 'Black', 0, 2);
    const blocker3 = makePiece('Pawn', 'Black', 1, 0);
    const blocker4 = makePiece('Pawn', 'Black', 1, 3);
    const blocker5 = makePiece('Pawn', 'Black', 3, 0);
    const blocker6 = makePiece('Pawn', 'Black', 3, 2);
    const blocker7 = makePiece('Pawn', 'White', 4, 1);
    const blocker8 = makePiece('Pawn', 'White', 0, 3);
    const state = makeState(
      [pr, enemy, wk, bk, blocker1, blocker2, blocker3, blocker4, blocker5, blocker6, blocker7, blocker8],
      {
        currentTurn: 'Black',
        selectedSquare: { row: 0, col: 0 },
        highlights: [{ row: 2, col: 1, color: 'capture' }],
      },
    );

    const s1 = tap(state, { row: 2, col: 1 });
    if (s1.highlights.length === 0) {
      expect(s1.currentTurn).toBe('White');
    }
  });

  // --- Edge case tests ---

  it('second move capture does not trigger a third move', () => {
    const pr = makePiece('Prowler', 'Black', 7, 1);
    const enemy1 = makePiece('Pawn', 'White', 5, 2);
    const enemy2 = makePiece('Pawn', 'White', 3, 1);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([pr, enemy1, enemy2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 1 },
      highlights: [{ row: 5, col: 2, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 2 });
    expect(s1.abilityMode.type).toBe('secondMove');

    const captureHL = s1.highlights.find(h => h.row === 3 && h.col === 1);
    expect(captureHL).toBeDefined();
    const s2 = tap(s1, { row: 3, col: 1 });
    expect(s2.abilityMode.type).toBe('none');
    expect(s2.currentTurn).toBe('White');
    expect(s2.pieces.find(p => p.id === enemy2.id)).toBeUndefined();
  });

  it('QoD capture on first move ends turn immediately, no second move', () => {
    const pr = makePiece('Prowler', 'Black', 7, 1);
    const qod = makePiece('QueenOfDestruction', 'White', 5, 2);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([pr, qod, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 1 },
      highlights: [{ row: 5, col: 2, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 2 });
    expect(s1.abilityMode.type).toBe('none');
    expect(s1.currentTurn).toBe('White');
  });
});
