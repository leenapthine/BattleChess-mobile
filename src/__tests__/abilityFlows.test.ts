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

describe('NecroPawn sacrifice flow', () => {
  it('tap1: select shows moves + ability targets', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.selectedSquare).toEqual({ row: 4, col: 4 });
    expect(s1.highlights.length).toBeGreaterThan(0);
  });

  it('tap2: self-click arms sacrifice', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('sacrifice');
  });

  it('tap3: self-click again detonates', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, ally, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 4, col: 4 });
    expect(s3.abilityMode.type).toBe('none');
    expect(s3.pieces.find(p => p.id === np.id)).toBeUndefined();
    expect(s3.pieces.find(p => p.id === ally.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });
});

describe('GhoulKing raise flow', () => {
  it('tap1: select shows moves', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.selectedSquare).toEqual({ row: 4, col: 4 });
  });

  it('tap2: self-click shows raise targets', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const abilityHighlights = s2.highlights.filter(h => h.color === 'ability');
    expect(abilityHighlights.length).toBeGreaterThan(0);
  });

  it('tap3: clicking raise target places NecroPawn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability');
    expect(target).toBeDefined();

    const s3 = tap(s2, { row: target!.row, col: target!.col });
    const raised = s3.pieces.find(
      p => p.row === target!.row && p.col === target!.col && p.color === 'White',
    );
    expect(raised).toBeDefined();
  });
});

describe('Familiar stone toggle flow', () => {
  it('tap2: self-click turns to stone', () => {
    const fam = makePiece('Familiar', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const updated = s2.pieces.find(p => p.id === fam.id)!;
    expect(updated.isStone).toBe(true);
  });
});

describe('DeadLauncher load/launch flow', () => {
  it('tap2: self-click enters loading mode', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, pawn, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    expect(s2.abilityMode.type).toBe('loading');
  });

  it('tap3: clicking adjacent pawn loads it', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, pawn, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 0, col: 1 });
    const loader = s3.pieces.find(p => p.id === dl.id)!;
    expect(loader.pawnLoaded).toBe(true);
    expect(s3.pieces.find(p => p.id === pawn.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });

  it('loaded launcher: self-click enters launch mode', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const enemy = makePiece('Pawn', 'Black', 3, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    expect(s2.abilityMode.type).toBe('launch');
  });

  it('tap on launch target fires and captures', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const enemy = makePiece('Pawn', 'Black', 3, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 3, col: 0 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const launcher = s3.pieces.find(p => p.id === dl.id)!;
    expect(launcher.pawnLoaded).toBe(false);
    expect(s3.currentTurn).toBe('Black');
  });
});

describe('Beholder boulder flow', () => {
  it('tap2: self-click enters boulder mode', () => {
    const beh = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([beh, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('boulder');
  });

  it('tap3: clicking enemy target captures it', () => {
    const beh = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([beh, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 3, col: 3 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });
});

describe('BoulderThrower boulder flow', () => {
  it('tap2: self-click enters boulder mode', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('boulder');
  });

  it('tap3: clicking enemy at manhattan-3 captures it', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 4, col: 7 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });
});

describe('Necromancer resurrection flow', () => {
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
});

describe('HellPawn transform flow', () => {
  it('capturing a non-pawn transforms HellPawn', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Knight', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const transformed = s1.pieces.find(p => p.row === 4 && p.col === 3);
    expect(transformed).toBeDefined();
  });
});

describe('Prowler second move flow', () => {
  it('capture triggers second move mode', () => {
    const pr = makePiece('Prowler', 'Black', 7, 1);
    const enemy = makePiece('Pawn', 'White', 5, 2);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([pr, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 1 },
      highlights: [{ row: 5, col: 2, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 2 });
    expect(s1.abilityMode.type).toBe('secondMove');
  });
});

describe('Howler absorb flow', () => {
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
});

describe('HellKing convert flow', () => {
  it('moving onto enemy converts instead of capturing', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 3, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const converted = s1.pieces.find(p => p.id === enemy.id);
    expect(converted).toBeDefined();
    expect(converted!.color).toBe('Black');
  });
});

describe('QueenOfIllusions swap flow', () => {
  it('clicking a friendly pawn swaps positions', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const pawn = makePiece('Pawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, pawn, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 4, col: 4, color: 'ability' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const movedQueen = s1.pieces.find(p => p.id === qoi.id)!;
    const movedPawn = s1.pieces.find(p => p.id === pawn.id)!;
    expect(movedQueen.row).toBe(4);
    expect(movedQueen.col).toBe(4);
    expect(movedPawn.row).toBe(0);
    expect(movedPawn.col).toBe(3);
  });
});

describe('WizardTower ranged capture flow', () => {
  it('clicking enemy on diagonal captures without moving', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, enemy, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const tower = s1.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(0);
    expect(tower.col).toBe(0);
  });
});

describe('YoungWiz zap flow', () => {
  it('clicking enemy ahead zaps without moving', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 5, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 4 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(4);
    expect(wiz.col).toBe(4);
  });
});

describe('QueenOfDomination dominate flow', () => {
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
});
