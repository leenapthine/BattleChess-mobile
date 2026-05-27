import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, canRevive, performRevival } from '@/engine/pieces/QueenOfBones';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('QueenOfBones', () => {
  // --- Movement tests ---

  it('moves like a queen', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    expect(getValidMoves(qob, [qob]).length).toBe(27);
  });

  // --- Unit function tests ---

  it('canRevive true when 2+ friendly pawns exist', () => {
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    expect(canRevive('White', [p1, p2])).toBe(true);
  });

  it('canRevive false when fewer than 2 pawns', () => {
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    expect(canRevive('White', [p1])).toBe(false);
  });

  it('performRevival spawns queen at d1 and removes sacrifices', () => {
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    const state = makeState([p1, p2]);
    const result = performRevival([p1.id, p2.id], 'White', state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].type).toBe('QueenOfBones');
    expect(result.pieces[0].row).toBe(0);
    expect(result.pieces[0].col).toBe(3);
  });

  it('performRevival fails silently when spawn occupied', () => {
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    const blocker = makePiece('Rook', 'White', 0, 3);
    const state = makeState([p1, p2, blocker]);
    const result = performRevival([p1.id, p2.id], 'White', state);
    expect(result.pieces.find(p => p.type === 'QueenOfBones')).toBeUndefined();
    expect(result.pieces).toHaveLength(1);
  });

  // --- Full revival tap flow ---

  it('capturing QoB enters sacrifice selection with pawn highlights', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    const attacker = makePiece('Rook', 'Black', 4, 0);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, attacker, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');
    expect(s1.highlights.length).toBe(2);
  });

  it('selecting 2 pawns completes revival', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    const attacker = makePiece('Rook', 'Black', 4, 0);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, attacker, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 1, col: 0 });
    expect(s2.abilityMode.type).toBe('sacrificeSelection');

    const s3 = tap(s2, { row: 1, col: 1 });
    expect(s3.abilityMode.type).toBe('none');
    expect(s3.pieces.find(p => p.id === p1.id)).toBeUndefined();
    expect(s3.pieces.find(p => p.id === p2.id)).toBeUndefined();
    const revived = s3.pieces.find(p => p.type === 'QueenOfBones');
    expect(revived).toBeDefined();
    expect(revived!.row).toBe(0);
    expect(revived!.col).toBe(3);
  });

  it('no revival when fewer than 2 pawns remain', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    const attacker = makePiece('Rook', 'Black', 4, 0);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, attacker, p1, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).not.toBe('sacrificeSelection');
  });

  it('Prowler capture of QoB triggers revival then second move', () => {
    const qob = makePiece('QueenOfBones', 'White', 5, 2);
    const prowler = makePiece('Prowler', 'Black', 7, 1);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, prowler, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 1 },
      highlights: [{ row: 5, col: 2, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 2 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');

    const s2 = tap(s1, { row: 1, col: 0 });
    const s3 = tap(s2, { row: 1, col: 1 });
    expect(s3.abilityMode.type).toBe('secondMove');
    expect(s3.highlights.length).toBeGreaterThan(0);
  });

  it('clicking non-highlighted square during sacrifice selection is ignored', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    const attacker = makePiece('Rook', 'Black', 4, 0);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, attacker, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 7, col: 7 });
    expect(s2.abilityMode.type).toBe('sacrificeSelection');
  });

  // --- Revival from all kill paths ---

  it('WizardTower ranged capture triggers revival', () => {
    const qob = makePiece('QueenOfBones', 'White', 3, 3);
    const wt = makePiece('WizardTower', 'Black', 0, 0);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, wt, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');
  });

  it('YoungWiz zap triggers revival', () => {
    const qob = makePiece('QueenOfBones', 'Black', 4, 4);
    const yw = makePiece('YoungWiz', 'White', 3, 4);
    const p1 = makePiece('HellPawn', 'Black', 6, 0);
    const p2 = makePiece('HellPawn', 'Black', 6, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, yw, p1, p2, wk, bk], {
      selectedSquare: { row: 3, col: 4 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');
  });

  it('Boulder throw triggers revival', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 7);
    const bt = makePiece('BoulderThrower', 'Black', 4, 4);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, bt, p1, p2, wk, bk], {
      currentTurn: 'Black',
      abilityMode: { type: 'boulder', pieceId: bt.id },
      highlights: [{ row: 4, col: 7, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 7 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');
  });

  it('NecroPawn sacrifice killing QoB triggers revival', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 5);
    const np = makePiece('NecroPawn', 'Black', 4, 4);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([qob, np, p1, p2, wk, bk], {
      currentTurn: 'Black',
      abilityMode: { type: 'sacrifice', pieceId: np.id, armed: true },
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.abilityMode.type).toBe('sacrificeSelection');
  });

  it('HellKing convert does NOT trigger revival', () => {
    const qob = makePiece('QueenOfBones', 'White', 3, 4);
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const state = makeState([qob, hk, p1, p2], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    expect(s1.abilityMode.type).toBe('none');
    const converted = s1.pieces.find(p => p.id === qob.id)!;
    expect(converted.color).toBe('Black');
  });
});
