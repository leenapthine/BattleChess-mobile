import { getValidMoves as getHellPawnMoves, performCapture as hellPawnCapture } from '@/engine/pieces/HellPawn';
import { getValidMoves as getProwlerMoves, performCapture as prowlerCapture, performSecondMove } from '@/engine/pieces/Prowler';
import { getValidMoves as getHowlerMoves, getAbilityGain, performCapture as howlerCapture } from '@/engine/pieces/Howler';
import { getValidMoves as getBeholderMoves, getAbilityTargets as getBeholderTargets } from '@/engine/pieces/Beholder';
import { getValidMoves as getHellKingMoves, performConvert } from '@/engine/pieces/HellKing';
import { getValidMoves as getQoDMoves, triggerDetonation } from '@/engine/pieces/QueenOfDestruction';
import { makePiece, makeState, resetIds, hasSquare } from '../testHelpers';

beforeEach(() => resetIds());

describe('HellPawn', () => {
  it('moves like a pawn', () => {
    const hp = makePiece('HellPawn', 'Black', 6, 3);
    const moves = getHellPawnMoves(hp, [hp]);
    expect(hasSquare(moves, 5, 3)).toBe(true);
  });

  it('transforms into captured non-pawn piece', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 3);
    const enemy = makePiece('Rook', 'White', 4, 4);
    const state = makeState([hp, enemy], { currentTurn: 'Black' });
    const result = hellPawnCapture(hp, { row: 4, col: 4 }, state);
    const transformed = result.pieces.find(p => p.id === hp.id);
    expect(transformed!.type).toBe('Rook');
    expect(transformed!.color).toBe('Black');
  });

  it('does not transform when capturing a pawn', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 3);
    const enemy = makePiece('Pawn', 'White', 4, 4);
    const state = makeState([hp, enemy], { currentTurn: 'Black' });
    const result = hellPawnCapture(hp, { row: 4, col: 4 }, state);
    const piece = result.pieces.find(p => p.id === hp.id);
    expect(piece!.type).toBe('HellPawn');
    expect(piece!.row).toBe(4);
  });
});

describe('Prowler', () => {
  it('moves like a knight', () => {
    const p = makePiece('Prowler', 'Black', 4, 4);
    expect(getProwlerMoves(p, [p])).toHaveLength(8);
  });

  it('BUG #2 REGRESSION: performCapture enters secondMove with correct pieceId', () => {
    const prowler = makePiece('Prowler', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 2, 3);
    const state = makeState([prowler, enemy], { currentTurn: 'Black' });
    const result = prowlerCapture(prowler, { row: 2, col: 3 }, state);
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
});

describe('Howler', () => {
  it('starts with bishop moves', () => {
    const h = makePiece('Howler', 'Black', 4, 4);
    const moves = getHowlerMoves(h, [h]);
    expect(moves.length).toBe(13);
  });

  it('gains knight moves after capturing a knight-type', () => {
    const h = makePiece('Howler', 'Black', 4, 4, {
      gainedAbilities: { knight: true, rook: false, queen: false, pawn: false },
    });
    const moves = getHowlerMoves(h, [h]);
    expect(moves.length).toBeGreaterThan(13);
  });

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
    const result = howlerCapture(h, { row: 3, col: 3 }, state);
    const updated = result.pieces.find(p => p.id === h.id)!;
    expect(updated.gainedAbilities.knight).toBe(true);
  });
});

describe('Beholder', () => {
  it('moves 1 cardinal step to empty squares only', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const moves = getBeholderMoves(b, [b]);
    expect(moves).toHaveLength(4);
    expect(moves.every(m => m.color === 'move')).toBe(true);
  });

  it('cannot move onto occupied square', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const occ = makePiece('Pawn', 'White', 4, 5);
    const moves = getBeholderMoves(b, [b, occ]);
    expect(hasSquare(moves, 4, 5)).toBe(false);
  });

  it('getAbilityTargets shows enemies within manhattan-3', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 4, 7);
    const targets = getBeholderTargets(b, [b, enemy]);
    expect(hasSquare(targets, 4, 7)).toBe(true);
  });

  it('getAbilityTargets excludes stone pieces', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 4, 7, { isStone: true });
    const targets = getBeholderTargets(b, [b, stoned]);
    expect(hasSquare(targets, 4, 7)).toBe(false);
  });
});

describe('HellKing', () => {
  it('moves like a king', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    expect(getHellKingMoves(hk, [hk])).toHaveLength(8);
  });

  it('performConvert flips enemy color without moving king', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Rook', 'White', 4, 5);
    const state = makeState([hk, enemy], { currentTurn: 'Black' });
    const result = performConvert(hk, { row: 4, col: 5 }, state);
    const converted = result.pieces.find(p => p.id === enemy.id)!;
    expect(converted.color).toBe('Black');
    expect(converted.type).toBe('Rook');
    const king = result.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(4);
    expect(king.col).toBe(4);
  });

  it('performConvert respects isStone', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const stoned = makePiece('Rook', 'White', 4, 5, { isStone: true });
    const state = makeState([hk, stoned], { currentTurn: 'Black' });
    const result = performConvert(hk, { row: 4, col: 5 }, state);
    expect(result.pieces.find(p => p.id === stoned.id)!.color).toBe('White');
  });
});

describe('QueenOfDestruction', () => {
  it('moves like a queen', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    expect(getQoDMoves(qod, [qod]).length).toBe(27);
  });

  it('triggerDetonation removes adjacent non-stone pieces', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const adj = makePiece('Pawn', 'White', 4, 5);
    const far = makePiece('Pawn', 'White', 0, 0);
    const result = triggerDetonation(qod, [qod, adj, far], null);
    expect(result.find(p => p.id === adj.id)).toBeUndefined();
    expect(result.find(p => p.id === far.id)).toBeDefined();
  });

  it('triggerDetonation skips stone pieces', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 4, 5, { isStone: true });
    const result = triggerDetonation(qod, [qod, stoned], null);
    expect(result.find(p => p.id === stoned.id)).toBeDefined();
  });

  it('BUG #14 REGRESSION: triggerDetonation skips capturingPiece', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const attacker = makePiece('Rook', 'White', 4, 5);
    const result = triggerDetonation(qod, [qod, attacker], attacker);
    expect(result.find(p => p.id === attacker.id)).toBeDefined();
  });
});
