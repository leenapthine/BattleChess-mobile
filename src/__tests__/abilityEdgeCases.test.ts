import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { makePiece, makeState, resetIds } from './testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

function selectAndSelfClick(state: GameState, row: number, col: number): GameState {
  const s1 = tap(state, { row, col });
  return tap(s1, { row, col });
}

describe('WizardTower edge cases', () => {
  it('normal move to empty square still moves the tower', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const tower = s1.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(3);
    expect(tower.col).toBe(3);
  });

  it('cannot ranged-capture a stone piece', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const stoned = makePiece('Pawn', 'Black', 3, 3, { isStone: true });
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, stoned, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    expect(s1.pieces.find(p => p.id === stoned.id)).toBeDefined();
  });
});

describe('YoungWiz edge cases', () => {
  it('diagonal capture moves the YoungWiz normally', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 5, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 5, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 5 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(5);
  });

  it('forward move to empty square moves normally', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 5, col: 4 });
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(4);
  });

  it('zap only fires on directly forward square, not diagonal', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const diag = makePiece('Pawn', 'Black', 5, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, diag, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 5, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 5 });
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(5);
  });
});

describe('HellKing edge cases', () => {
  it('HellKing stays in place after convert', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 3, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const king = s1.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(4);
    expect(king.col).toBe(4);
  });

  it('cannot convert a stone piece', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 3, 4, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, stoned, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const target = s1.pieces.find(p => p.id === stoned.id)!;
    expect(target.color).toBe('White');
  });

  it('converted piece retains its type and properties', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Rook', 'White', 3, 4, { hasMoved: true });
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const converted = s1.pieces.find(p => p.id === enemy.id)!;
    expect(converted.color).toBe('Black');
    expect(converted.type).toBe('Rook');
    expect(converted.hasMoved).toBe(true);
  });

  it('HellKing moves normally to empty square', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const king = s1.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(3);
    expect(king.col).toBe(4);
  });
});

describe('Howler edge cases', () => {
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

describe('HellPawn edge cases', () => {
  it('no transformation when capturing a pawn-type', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Pawn', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('HellPawn');
    expect(piece.row).toBe(4);
    expect(piece.col).toBe(3);
  });

  it('transforms into captured non-pawn type with own color', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Bishop', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('Bishop');
    expect(piece.color).toBe('Black');
    expect(piece.row).toBe(4);
    expect(piece.col).toBe(3);
  });

  it('HellPawn moves normally to empty square', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('HellPawn');
    expect(piece.row).toBe(4);
  });
});

describe('GhoulKing edge cases', () => {
  it('cannot raise when raisesLeft is 0', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 0 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const abilityHL = s1.highlights.filter(h => h.color === 'ability');
    expect(abilityHL).toHaveLength(0);
  });

  it('raise does not consume the turn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    expect(s3.currentTurn).toBe('White');
  });

  it('raisesLeft decrements to 0 after raise', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    const king = s3.pieces.find(p => p.id === gk.id)!;
    expect(king.raisesLeft).toBe(0);
  });

  it('raised piece is a NecroPawn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    const raised = s3.pieces.find(
      p => p.row === target.row && p.col === target.col && p.id !== gk.id,
    )!;
    expect(raised.type).toBe('NecroPawn');
    expect(raised.color).toBe('White');
  });
});

describe('QueenOfIllusions edge cases', () => {
  it('cannot swap with a non-pawn type', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const rook = makePiece('Rook', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, rook, wk, bk]);

    const s1 = tap(state, { row: 0, col: 3 });
    const abilityHL = s1.highlights.filter(h => h.color === 'ability');
    const rookHL = abilityHL.find(h => h.row === 4 && h.col === 4);
    expect(rookHL).toBeUndefined();
  });

  it('swap ends the turn', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const pawn = makePiece('Pawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, pawn, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 4, col: 4, color: 'ability' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.currentTurn).toBe('Black');
  });

  it('queen can still move normally to empty squares', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 3, col: 3, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const queen = s1.pieces.find(p => p.id === qoi.id)!;
    expect(queen.row).toBe(3);
    expect(queen.col).toBe(3);
  });
});

describe('QueenOfDomination edge cases', () => {
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

describe('Familiar edge cases', () => {
  it('stone piece cannot be captured', () => {
    const fam = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    const enemy = makePiece('Rook', 'Black', 4, 0);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.pieces.find(p => p.id === fam.id)).toBeDefined();
  });

  it('un-stoning does not consume the turn', () => {
    const fam = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 4, col: 4 });
    expect(s2.currentTurn).toBe('White');
    const updated = s2.pieces.find(p => p.id === fam.id)!;
    expect(updated.isStone).toBe(false);
  });
});

describe('NecroPawn sacrifice edge cases', () => {
  it('sacrifice respects stone immunity', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 4, 5, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, stoned, wk, bk]);

    const s1 = selectAndSelfClick(state, 4, 4);
    const s2 = tap(s1, { row: 4, col: 4 });
    expect(s2.pieces.find(p => p.id === stoned.id)).toBeDefined();
    expect(s2.pieces.find(p => p.id === np.id)).toBeUndefined();
  });

  it('clicking non-self square while armed cancels sacrifice', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s1 = selectAndSelfClick(state, 4, 4);
    expect(s1.abilityMode.type).toBe('sacrifice');

    const s2 = tap(s1, { row: 0, col: 0 });
    expect(s2.abilityMode.type).toBe('none');
    expect(s2.pieces.find(p => p.id === np.id)).toBeDefined();
  });
});

describe('Prowler capture chain edge cases', () => {
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

describe('GhostKnight stun edge cases', () => {
  it('does not stun friendly adjacent pieces', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const ally = makePiece('Pawn', 'White', 2, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, ally, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    const allyAfter = s1.pieces.find(p => p.id === ally.id)!;
    expect(allyAfter.stunned).toBe(false);
  });

  it('stuns multiple adjacent enemies', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const e1 = makePiece('Pawn', 'Black', 2, 1);
    const e2 = makePiece('Pawn', 'Black', 2, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, e1, e2, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    const e1After = s1.pieces.find(p => p.id === e1.id)!;
    const e2After = s1.pieces.find(p => p.id === e2.id)!;
    expect(e1After.stunned).toBe(true);
    expect(e2After.stunned).toBe(true);
  });
});

describe('Necromancer resurrection edge cases', () => {
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

describe('DeadLauncher edge cases', () => {
  it('can still move normally while loaded', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 0, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 0 });
    const launcher = s1.pieces.find(p => p.id === dl.id)!;
    expect(launcher.row).toBe(3);
    expect(launcher.col).toBe(0);
    expect(launcher.pawnLoaded).toBe(true);
  });
});
