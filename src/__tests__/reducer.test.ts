import { gameReducer } from '@/engine/gameReducer';
import { handleCapture, checkWinCondition } from '@/engine/helpers/captureHandler';
import { switchTurn } from '@/engine/helpers/turnManager';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { makePiece, makeState, resetIds, hasSquare } from './testHelpers';
import type { GameState } from '@/types/game';

beforeEach(() => resetIds());

describe('captureHandler', () => {
  it('stone pieces cannot be captured', () => {
    const target = makePiece('Pawn', 'Black', 4, 4, { isStone: true });
    const attacker = makePiece('Rook', 'White', 4, 0);
    const state = makeState([target, attacker]);
    const result = handleCapture(target, attacker, state);
    expect(result.captured).toBeNull();
    expect(result.state.pieces.find(p => p.id === target.id)).toBeDefined();
  });

  it('removes captured piece', () => {
    const target = makePiece('Pawn', 'Black', 4, 4);
    const attacker = makePiece('Rook', 'White', 4, 0);
    const state = makeState([target, attacker]);
    const result = handleCapture(target, attacker, state);
    expect(result.captured!.id).toBe(target.id);
    expect(result.state.pieces.find(p => p.id === target.id)).toBeUndefined();
  });

  it('triggers QoD detonation on capture', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const adj = makePiece('Pawn', 'White', 4, 5);
    const attacker = makePiece('Rook', 'White', 4, 0);
    const state = makeState([qod, adj, attacker]);
    const result = handleCapture(qod, attacker, state);
    expect(result.state.pieces.find(p => p.id === qod.id)).toBeUndefined();
    expect(result.state.pieces.find(p => p.id === adj.id)).toBeUndefined();
    expect(result.state.pieces.find(p => p.id === attacker.id)).toBeDefined();
  });

  it('triggers resurrection flag for Necromancer capture', () => {
    const enemy = makePiece('Pawn', 'Black', 4, 4);
    const nec = makePiece('Necromancer', 'White', 2, 2);
    const state = makeState([enemy, nec]);
    const result = handleCapture(enemy, nec, state);
    expect(result.triggerResurrection).toBe(true);
  });

  it('triggers revival flag for QueenOfBones capture', () => {
    const qob = makePiece('QueenOfBones', 'White', 0, 3);
    const attacker = makePiece('Rook', 'Black', 0, 0);
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    const state = makeState([qob, attacker, p1, p2]);
    const result = handleCapture(qob, attacker, state);
    expect(result.triggerRevival).toBe(true);
  });
});

describe('checkWinCondition', () => {
  it('declares Black winner when White king is missing', () => {
    const state = makeState([makePiece('HellKing', 'Black', 7, 4)]);
    const result = checkWinCondition(state);
    expect(result.status).toEqual({ type: 'won', winner: 'Black' });
  });

  it('declares White winner when Black king is missing', () => {
    const state = makeState([makePiece('GhoulKing', 'White', 0, 4)]);
    const result = checkWinCondition(state);
    expect(result.status).toEqual({ type: 'won', winner: 'White' });
  });

  it('game stays active when both kings present', () => {
    const state = makeState([
      makePiece('King', 'White', 0, 4),
      makePiece('King', 'Black', 7, 4),
    ]);
    expect(checkWinCondition(state).status.type).toBe('active');
  });
});

describe('turnManager', () => {
  it('BUG #1 REGRESSION: switchTurn clears stuns for outgoing player', () => {
    const stunnedWhite = makePiece('Pawn', 'White', 1, 0, { stunned: true });
    const stunnedBlack = makePiece('Pawn', 'Black', 6, 0, { stunned: true });
    const state = makeState([stunnedWhite, stunnedBlack], { currentTurn: 'White' });
    const result = switchTurn(state);
    expect(result.currentTurn).toBe('Black');
    const black = result.pieces.find(p => p.id === stunnedBlack.id)!;
    const white = result.pieces.find(p => p.id === stunnedWhite.id)!;
    expect(white.stunned).toBe(false);
    expect(black.stunned).toBe(true);
  });

  it('switchTurn clears selection and highlights', () => {
    const state = makeState([], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 1, col: 0, color: 'move' }],
    });
    const result = switchTurn(state);
    expect(result.selectedSquare).toBeNull();
    expect(result.highlights).toHaveLength(0);
  });
});

describe('classifyAction', () => {
  it('SELECT_SQUARE when clicking a piece with nothing selected', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn]);
    const action = classifyAction({ row: 1, col: 0 }, state);
    expect(action.type).toBe('SELECT_SQUARE');
  });

  it('DESELECT when clicking same selected square', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn], { selectedSquare: { row: 1, col: 0 } });
    const action = classifyAction({ row: 1, col: 0 }, state);
    expect(action.type).toBe('DESELECT');
  });

  it('MOVE_PIECE when clicking a highlighted square', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn], {
      selectedSquare: { row: 1, col: 0 },
      highlights: [{ row: 2, col: 0, color: 'move' }],
    });
    const action = classifyAction({ row: 2, col: 0 }, state);
    expect(action.type).toBe('MOVE_PIECE');
  });

  it('ABILITY_ACTION when clicking ability-highlighted square', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn], {
      selectedSquare: { row: 1, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'ability' }],
    });
    const action = classifyAction({ row: 3, col: 3 }, state);
    expect(action.type).toBe('ABILITY_ACTION');
  });

  it('ABILITY_ACTION when in active ability mode', () => {
    const state = makeState([], {
      abilityMode: { type: 'sacrifice', pieceId: '1', armed: true },
    });
    const action = classifyAction({ row: 4, col: 4 }, state);
    expect(action.type).toBe('ABILITY_ACTION');
  });

  it('DESELECT when clicking empty unhighlighted square', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn], { selectedSquare: { row: 1, col: 0 } });
    const action = classifyAction({ row: 5, col: 5 }, state);
    expect(action.type).toBe('DESELECT');
  });

  it('SELECT_SQUARE when clicking own piece while another is selected', () => {
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Rook', 'White', 0, 0);
    const state = makeState([p1, p2], { selectedSquare: { row: 1, col: 0 } });
    const action = classifyAction({ row: 0, col: 0 }, state);
    expect(action.type).toBe('SELECT_SQUARE');
  });
});

describe('gameReducer', () => {
  it('SELECT_SQUARE generates highlights', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn]);
    const result = gameReducer(state, { type: 'SELECT_SQUARE', square: { row: 1, col: 0 } });
    expect(result.selectedSquare).toEqual({ row: 1, col: 0 });
    expect(result.highlights.length).toBeGreaterThan(0);
  });

  it('SELECT_SQUARE shows preview for opponent pieces', () => {
    const enemy = makePiece('Pawn', 'Black', 6, 0);
    const state = makeState([enemy]);
    const result = gameReducer(state, { type: 'SELECT_SQUARE', square: { row: 6, col: 0 } });
    expect(result.highlights.every(h => h.color === 'preview')).toBe(true);
  });

  it('SELECT_SQUARE rejects stunned own piece', () => {
    const stunned = makePiece('Pawn', 'White', 1, 0, { stunned: true });
    const state = makeState([stunned]);
    const result = gameReducer(state, { type: 'SELECT_SQUARE', square: { row: 1, col: 0 } });
    expect(result.selectedSquare).toBeNull();
  });

  it('MOVE_PIECE moves piece and switches turn', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const king1 = makePiece('King', 'White', 0, 4);
    const king2 = makePiece('King', 'Black', 7, 4);
    const state = makeState([pawn, king1, king2], {
      selectedSquare: { row: 1, col: 0 },
      highlights: [{ row: 2, col: 0, color: 'move' }],
    });
    const result = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
    const moved = result.pieces.find(p => p.id === pawn.id)!;
    expect(moved.row).toBe(2);
    expect(moved.hasMoved).toBe(true);
    expect(result.currentTurn).toBe('Black');
  });

  it('MOVE_PIECE captures enemy and checks win', () => {
    const rook = makePiece('Rook', 'White', 0, 0);
    const enemyKing = makePiece('King', 'Black', 0, 7);
    const whiteKing = makePiece('King', 'White', 7, 0);
    const state = makeState([rook, enemyKing, whiteKing], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 0, col: 7, color: 'capture' }],
    });
    const result = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
    expect(result.status).toEqual({ type: 'won', winner: 'White' });
  });

  it('DESELECT clears state', () => {
    const state = makeState([], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 1, col: 0, color: 'move' }],
    });
    const result = gameReducer(state, { type: 'DESELECT' });
    expect(result.selectedSquare).toBeNull();
    expect(result.highlights).toHaveLength(0);
  });

  it('does nothing when game is already won', () => {
    const state = makeState([], { status: { type: 'won', winner: 'White' } });
    const result = gameReducer(state, { type: 'SELECT_SQUARE', square: { row: 0, col: 0 } });
    expect(result).toBe(state);
  });
});
