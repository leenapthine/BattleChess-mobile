import { createInitialState } from '@/engine/initialBoard';
import { createDefaultArmy } from '@/types/army';
import { makeFullyUpgradedArmy } from './testHelpers';

describe('createInitialState — army configs to board', () => {
  it('all-basic army produces standard chess pieces', () => {
    const p1 = createDefaultArmy('Necro');
    const p2 = createDefaultArmy('Demon');
    const state = createInitialState(p1, p2);
    const types = new Set(state.pieces.map(p => p.type));
    expect(types.has('Pawn')).toBe(true);
    expect(types.has('Rook')).toBe(true);
    expect(types.has('Knight')).toBe(true);
    expect(types.has('Bishop')).toBe(true);
    expect(types.has('Queen')).toBe(true);
    expect(types.has('King')).toBe(true);
    expect(types.has('NecroPawn')).toBe(false);
    expect(types.has('HellPawn')).toBe(false);
  });

  it('fully upgraded Necro produces all Necro pieces', () => {
    const state = createInitialState(
      makeFullyUpgradedArmy('Necro'),
      createDefaultArmy('Demon'),
    );
    const whites = state.pieces.filter(p => p.color === 'White');
    const whiteTypes = whites.map(p => p.type);
    expect(whiteTypes).toContain('NecroPawn');
    expect(whiteTypes).toContain('GhostKnight');
    expect(whiteTypes).toContain('Necromancer');
    expect(whiteTypes).toContain('DeadLauncher');
    expect(whiteTypes).toContain('QueenOfBones');
    expect(whiteTypes).toContain('GhoulKing');
  });

  it('mixed army keeps basic pieces basic, upgraded pieces guild', () => {
    const army = createDefaultArmy('Beast');
    army.slots[3].upgraded = true;  // Queen → QueenOfDomination
    army.slots[8].upgraded = true;  // First pawn → PawnHopper
    const state = createInitialState(army, createDefaultArmy('Wizard'));
    const whites = state.pieces.filter(p => p.color === 'White');

    expect(whites.find(p => p.row === 0 && p.col === 3)!.type).toBe('QueenOfDomination');
    expect(whites.find(p => p.row === 0 && p.col === 0)!.type).toBe('Rook');
    expect(whites.find(p => p.row === 1 && p.col === 0)!.type).toBe('PawnHopper');
    expect(whites.find(p => p.row === 1 && p.col === 1)!.type).toBe('Pawn');
  });

  it('upgraded GhoulKing has raisesLeft: 1', () => {
    const army = createDefaultArmy('Necro');
    army.slots[4].upgraded = true; // King → GhoulKing
    const state = createInitialState(army, createDefaultArmy('Demon'));
    const king = state.pieces.find(p => p.type === 'GhoulKing')!;
    expect(king.raisesLeft).toBe(1);
  });

  it('non-upgraded King has raisesLeft: 0', () => {
    const state = createInitialState(
      createDefaultArmy('Necro'),
      createDefaultArmy('Demon'),
    );
    const king = state.pieces.find(p => p.type === 'King' && p.color === 'White')!;
    expect(king.raisesLeft).toBe(0);
  });

  it('White on rows 0-1, Black on rows 6-7 regardless of guild', () => {
    const state = createInitialState(
      makeFullyUpgradedArmy('Wizard'),
      makeFullyUpgradedArmy('Beast'),
    );
    const whites = state.pieces.filter(p => p.color === 'White');
    const blacks = state.pieces.filter(p => p.color === 'Black');
    expect(whites.every(p => p.row <= 1)).toBe(true);
    expect(blacks.every(p => p.row >= 6)).toBe(true);
  });

  it('stores army configs in state for RESET_GAME', () => {
    const p1 = makeFullyUpgradedArmy('Necro');
    const p2 = createDefaultArmy('Demon');
    const state = createInitialState(p1, p2);
    expect(state.armyConfigs).toBeDefined();
    expect(state.armyConfigs!.p1.guild).toBe('Necro');
    expect(state.armyConfigs!.p2.guild).toBe('Demon');
  });

  it('always produces 32 pieces total', () => {
    const state = createInitialState(
      createDefaultArmy('Necro'),
      createDefaultArmy('Wizard'),
    );
    expect(state.pieces).toHaveLength(32);
  });

  it('different guilds produce different upgraded pieces', () => {
    const necroState = createInitialState(
      makeFullyUpgradedArmy('Necro'),
      createDefaultArmy('Demon'),
    );
    const demonState = createInitialState(
      makeFullyUpgradedArmy('Demon'),
      createDefaultArmy('Necro'),
    );
    expect(necroState.pieces.find(p => p.color === 'White' && p.row === 1 && p.col === 0)!.type).toBe('NecroPawn');
    expect(demonState.pieces.find(p => p.color === 'White' && p.row === 1 && p.col === 0)!.type).toBe('HellPawn');
  });
});
