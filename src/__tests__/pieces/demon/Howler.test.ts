import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityGain, performCapture } from '@/engine/pieces/Howler';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('Howler', () => {
  // --- Movement tests ---

  it('starts with bishop moves', () => {
    const h = makePiece('Howler', 'Black', 4, 4);
    const moves = getValidMoves(h, [h]);
    expect(moves.length).toBe(13);
  });

  it('gains knight moves after capturing a knight-type', () => {
    const h = makePiece('Howler', 'Black', 4, 4, {
      gainedAbilities: { knight: true, rook: false, queen: false, pawn: false },
    });
    const moves = getValidMoves(h, [h]);
    expect(moves.length).toBeGreaterThan(13);
  });

  // --- Unit function tests ---

  it('getAbilityGain classifies correctly', () => {
    expect(getAbilityGain('Knight')).toBe('knight');
    expect(getAbilityGain('Rook')).toBe('rook');
    expect(getAbilityGain('Queen')).toBe('queen');
    expect(getAbilityGain('Pawn')).toBe('pawn');
    expect(getAbilityGain('BeastKnight')).toBe('knight');
    expect(getAbilityGain('Portal')).toBe('rook');
  });

  it('BUG #10: king-type captures grant no ability', () => {
    expect(getAbilityGain('King')).toBeNull();
    expect(getAbilityGain('HellKing')).toBeNull();
    expect(getAbilityGain('GhoulKing')).toBeNull();
    expect(getAbilityGain('WizardKing')).toBeNull();
    expect(getAbilityGain('FrogKing')).toBeNull();
  });

  it('performCapture updates gainedAbilities', () => {
    const h = makePiece('Howler', 'Black', 4, 4);
    const enemy = makePiece('Knight', 'White', 3, 3);
    const state = makeState([h, enemy], { currentTurn: 'Black' });
    const result = performCapture(h, { row: 3, col: 3 }, state);
    const updated = result.pieces.find(p => p.id === h.id)!;
    expect(updated.gainedAbilities.knight).toBe(true);
  });

  // --- Full tap flow tests ---

  it('capturing a knight-type gains knight ability', () => {
    const howler = makePiece('Howler', 'Black', 5, 5);
    const enemy = makePiece('Knight', 'White', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const updated = s1.pieces.find(p => p.id === howler.id)!;
    expect(updated.gainedAbilities.knight).toBe(true);
  });

  // --- Edge case tests ---

  it('gains rook ability from rook-type capture', () => {
    const howler = makePiece('Howler', 'Black', 5, 5);
    const enemy = makePiece('Rook', 'White', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const updated = s1.pieces.find(p => p.id === howler.id)!;
    expect(updated.gainedAbilities.rook).toBe(true);
  });

  it('gains no ability from king-type capture', () => {
    const howler = makePiece('Howler', 'Black', 5, 5);
    const enemy = makePiece('King', 'White', 4, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const updated = s1.pieces.find(p => p.id === howler.id)!;
    expect(updated.gainedAbilities).toEqual({
      knight: false, rook: false, queen: false, pawn: false,
    });
  });

  it('abilities are cumulative across captures', () => {
    const howler = makePiece('Howler', 'Black', 5, 5, {
      gainedAbilities: { knight: true, rook: false, queen: false, pawn: false },
    });
    const enemy = makePiece('Rook', 'White', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const updated = s1.pieces.find(p => p.id === howler.id)!;
    expect(updated.gainedAbilities.knight).toBe(true);
    expect(updated.gainedAbilities.rook).toBe(true);
  });

  it('moves to capture square after absorbing', () => {
    const howler = makePiece('Howler', 'Black', 5, 5);
    const enemy = makePiece('Knight', 'White', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const updated = s1.pieces.find(p => p.id === howler.id)!;
    expect(updated.row).toBe(3);
    expect(updated.col).toBe(3);
  });
});
