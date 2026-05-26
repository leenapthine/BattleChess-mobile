import { getAbilityTargets as getNecroPawnAbility } from '@/engine/pieces/NecroPawn';
import { getAbilityTargets as getBeholderAbility } from '@/engine/pieces/Beholder';
import { getAbilityTargets as getBoulderAbility } from '@/engine/pieces/BoulderThrower';
import { makePiece, resetIds } from './testHelpers';

beforeEach(() => resetIds());

describe('NecroPawn ability highlights', () => {
  it('blast zone uses ability color', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const targets = getNecroPawnAbility(np, [np]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });
});

describe('Beholder ability highlights', () => {
  it('ranged targets use ability color', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const targets = getBeholderAbility(beholder, [beholder, enemy]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });

  it('does not target friendly pieces', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 3, 3);
    const targets = getBeholderAbility(beholder, [beholder, ally]);
    expect(targets).toHaveLength(0);
  });

  it('does not target stone pieces', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 3, 3, { isStone: true });
    const targets = getBeholderAbility(beholder, [beholder, stoned]);
    expect(targets).toHaveLength(0);
  });
});

describe('BoulderThrower ability highlights', () => {
  it('ranged targets use ability color', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getBoulderAbility(bt, [bt, enemy]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });

  it('only targets at exactly manhattan distance 3', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const close = makePiece('Pawn', 'Black', 4, 5);
    const exact = makePiece('Pawn', 'Black', 4, 7);
    const far = makePiece('Pawn', 'Black', 4, 0);
    const targets = getBoulderAbility(bt, [bt, close, exact, far]);
    const coords = targets.map(t => `${t.row},${t.col}`);
    expect(coords).toContain('4,7');
    expect(coords).not.toContain('4,5');
    expect(coords).not.toContain('4,0');
  });
});
