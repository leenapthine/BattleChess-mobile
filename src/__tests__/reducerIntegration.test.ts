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

describe('handleMove capture dispatch', () => {
  it('WizardTower captures without moving', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, enemy, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 0, col: 0 }, to: { row: 3, col: 3 } });
    expect(s.pieces.find(p => p.id === wt.id)!.row).toBe(0);
    expect(s.pieces.find(p => p.id === enemy.id)).toBeUndefined();
  });

  it('HellKing converts instead of capturing', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Rook', 'White', 3, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
    const converted = s.pieces.find(p => p.id === enemy.id)!;
    expect(converted.color).toBe('Black');
    expect(converted.type).toBe('Rook');
  });

  it('Prowler enters secondMove after capture', () => {
    const pr = makePiece('Prowler', 'Black', 7, 1);
    const enemy = makePiece('Pawn', 'White', 5, 2);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([pr, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 1 },
      highlights: [{ row: 5, col: 2, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
    expect(s.abilityMode.type).toBe('secondMove');
    expect(s.highlights.length).toBeGreaterThan(0);
  });

  it('Howler absorbs ability on capture', () => {
    const howler = makePiece('Howler', 'Black', 5, 5);
    const enemy = makePiece('Knight', 'White', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([howler, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 5 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 5, col: 5 }, to: { row: 3, col: 3 } });
    expect(s.pieces.find(p => p.id === howler.id)!.gainedAbilities.knight).toBe(true);
  });

  it('HellPawn transforms on non-pawn capture', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Bishop', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 5, col: 4 }, to: { row: 4, col: 3 } });
    expect(s.pieces.find(p => p.id === hp.id)!.type).toBe('Bishop');
  });

  it('YoungWiz zaps without moving', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 5, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 4, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 4, col: 4 }, to: { row: 5, col: 4 } });
    expect(s.pieces.find(p => p.id === yw.id)!.row).toBe(4);
    expect(s.pieces.find(p => p.id === enemy.id)).toBeUndefined();
  });

  it('generic capture moves piece and removes target', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const enemy = makePiece('Pawn', 'Black', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([rook, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 4, col: 0 }, to: { row: 4, col: 5 } });
    expect(s.pieces.find(p => p.id === rook.id)!.row).toBe(4);
    expect(s.pieces.find(p => p.id === rook.id)!.col).toBe(5);
    expect(s.pieces.find(p => p.id === enemy.id)).toBeUndefined();
  });

  it('stone piece blocks capture — attacker stays put', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const stoned = makePiece('Familiar', 'Black', 4, 5, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([rook, stoned, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'capture' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 4, col: 0 }, to: { row: 4, col: 5 } });
    expect(s.pieces.find(p => p.id === stoned.id)).toBeDefined();
    expect(s.pieces.find(p => p.id === rook.id)!.col).toBe(0);
  });
});

describe('QoB revival from all capture paths', () => {
  function qobSetup(attackerType: string, attackerPos: Square, qobPos: Square, captureHL: Square) {
    const qob = makePiece('QueenOfBones', 'White', qobPos.row, qobPos.col);
    const attacker = makePiece(attackerType as any, 'Black', attackerPos.row, attackerPos.col);
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    return makeState([qob, attacker, p1, p2, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: attackerPos,
      highlights: [{ ...captureHL, color: 'capture' as const }],
    });
  }

  it('standard capture triggers revival', () => {
    const state = qobSetup('Rook', { row: 4, col: 0 }, { row: 4, col: 4 }, { row: 4, col: 4 });
    const s = tap(state, { row: 4, col: 4 });
    expect(s.abilityMode.type).toBe('sacrificeSelection');
  });

  it('Prowler capture triggers revival before secondMove', () => {
    const state = qobSetup('Prowler', { row: 7, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 2 });
    const s = tap(state, { row: 5, col: 2 });
    expect(s.abilityMode.type).toBe('sacrificeSelection');
  });

  it('Howler capture triggers revival', () => {
    const state = qobSetup('Howler', { row: 5, col: 5 }, { row: 3, col: 3 }, { row: 3, col: 3 });
    const s = tap(state, { row: 3, col: 3 });
    expect(s.abilityMode.type).toBe('sacrificeSelection');
  });

  it('HellPawn capture triggers revival', () => {
    const state = qobSetup('HellPawn', { row: 5, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 3 });
    const s = tap(state, { row: 4, col: 3 });
    expect(s.abilityMode.type).toBe('sacrificeSelection');
  });

  it('revival does not consume QoB teams turn', () => {
    const state = qobSetup('Rook', { row: 4, col: 0 }, { row: 4, col: 4 }, { row: 4, col: 4 });
    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.currentTurn).toBe('Black');
    const s2 = tap(s1, { row: 1, col: 0 });
    const s3 = tap(s2, { row: 1, col: 1 });
    expect(s3.currentTurn).toBe('White');
    expect(s3.pieces.find(p => p.type === 'QueenOfBones')).toBeDefined();
  });
});

describe('selfClickTypes consistency', () => {
  const selfClickPieces = [
    'NecroPawn', 'GhoulKing', 'DeadLauncher',
    'Beholder', 'BoulderThrower', 'Familiar', 'Portal', 'WizardKing',
  ];

  for (const type of selfClickPieces) {
    it(`${type}: self-click triggers ABILITY_ACTION`, () => {
      const piece = makePiece(type as any, 'White', 4, 4);
      const wk = type.includes('King') ? piece : makePiece('King', 'White', 0, 0);
      const bk = makePiece('King', 'Black', 7, 7);
      const pieces = type.includes('King') ? [piece, bk] : [piece, wk, bk];
      const state = makeState(pieces, { selectedSquare: { row: 4, col: 4 } });
      const action = classifyAction({ row: 4, col: 4 }, state);
      expect(action.type).toBe('ABILITY_ACTION');
    });

    it(`${type}: ability targets hidden on initial select`, () => {
      const overrides: any = {};
      if (type === 'GhoulKing') overrides.raisesLeft = 1;
      const piece = makePiece(type as any, 'White', 4, 4, overrides);
      const wk = type.includes('King') ? piece : makePiece('King', 'White', 0, 0);
      const bk = makePiece('King', 'Black', 7, 7);
      const pieces = type.includes('King') ? [piece, bk] : [piece, wk, bk];
      const state = makeState(pieces);
      const s = tap(state, { row: 4, col: 4 });
      const abilityHL = s.highlights.filter(h => h.color === 'ability' || h.color === 'capture');
      const moveHL = s.highlights.filter(h => h.color === 'move');
      expect(abilityHL.length).toBe(0);
    });
  }
});

describe('post-move effects', () => {
  it('GhostKnight stuns adjacent enemies after move', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const enemy = makePiece('Pawn', 'Black', 2, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });
    const s = tap(state, { row: 2, col: 2 });
    expect(s.pieces.find(p => p.id === enemy.id)!.stunned).toBe(true);
  });

  it('PawnHopper hop captures intermediate enemy', () => {
    const ph = makePiece('PawnHopper', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([ph, enemy, wk, bk], {
      selectedSquare: { row: 3, col: 3 },
      highlights: [{ row: 5, col: 3, color: 'capture' }],
    });
    const s = tap(state, { row: 5, col: 3 });
    expect(s.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s.pieces.find(p => p.id === ph.id)!.row).toBe(5);
  });

  it('dominated piece reverts after move', () => {
    const qod = makePiece('QueenOfDomination', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qod, ally, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 4, col: 5 });
    if (s2.abilityMode.type === 'domination' && s2.highlights.length > 0) {
      const target = s2.highlights.find(h => h.color === 'move')!;
      const s3 = tap(s2, { row: target.row, col: target.col });
      const reverted = s3.pieces.find(p => p.id === ally.id)!;
      expect(reverted.type).toBe('Pawn');
    }
  });
});

describe('graveyard tracking', () => {
  it('portal load does not add to graveyard', () => {
    const portal = makePiece('Portal', 'Black', 7, 0);
    const ally = makePiece('YoungWiz', 'Black', 7, 1);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, ally, wk, bk], {
      currentTurn: 'Black',
      abilityMode: { type: 'loading', pieceId: portal.id },
      highlights: [{ row: 7, col: 1, color: 'capture' }],
    });
    const s = tap(state, { row: 7, col: 1 });
    expect(s.capturedPieces.find(p => p.id === ally.id)).toBeUndefined();
  });

  it('last portal captured adds loaded piece to graveyard', () => {
    const loaded = makePiece('YoungWiz', 'Black', 0, 0);
    const portal = makePiece('Portal', 'Black', 4, 4, { pieceLoaded: loaded });
    const attacker = makePiece('Rook', 'White', 4, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, attacker, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });
    const s = tap(state, { row: 4, col: 4 });
    expect(s.capturedPieces.find(p => p.id === loaded.id)).toBeDefined();
  });

  it('standard capture adds to graveyard', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const enemy = makePiece('Pawn', 'Black', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([rook, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'capture' }],
    });
    const s = tap(state, { row: 4, col: 5 });
    expect(s.capturedPieces).toHaveLength(1);
    expect(s.capturedPieces[0].id).toBe(enemy.id);
  });
});

describe('turn management', () => {
  it('stuns clear for outgoing player, persist for incoming', () => {
    const stunnedWhite = makePiece('Pawn', 'White', 1, 0, { stunned: true });
    const stunnedBlack = makePiece('Pawn', 'Black', 6, 0, { stunned: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([stunnedWhite, stunnedBlack, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 0, col: 1, color: 'move' }],
    });
    const s = tap(state, { row: 0, col: 1 });
    expect(s.pieces.find(p => p.id === stunnedWhite.id)!.stunned).toBe(false);
    expect(s.pieces.find(p => p.id === stunnedBlack.id)!.stunned).toBe(true);
  });

  it('stone piece cannot be selected for movement', () => {
    const fam = makePiece('Familiar', 'Black', 4, 4, { isStone: true });
    const bk = makePiece('King', 'Black', 7, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([fam, bk, wk], { currentTurn: 'Black' });
    const s = tap(state, { row: 4, col: 4 });
    expect(s.selectedSquare).toEqual({ row: 4, col: 4 });
    expect(s.highlights).toHaveLength(0);
  });

  it('stone piece blocks MOVE_PIECE', () => {
    const fam = makePiece('Familiar', 'Black', 4, 4, { isStone: true });
    const bk = makePiece('King', 'Black', 7, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([fam, bk, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 2, col: 3, color: 'move' }],
    });
    const s = gameReducer(state, { type: 'MOVE_PIECE', from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
    expect(s.pieces.find(p => p.id === fam.id)!.row).toBe(4);
  });
});
