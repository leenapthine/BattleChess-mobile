import {
  calculatePointsSpent,
  toggleSlotAt,
  upgradeAllSlots,
  clearAllSlots,
  getSlotPieceType,
  getSlotCost,
  canAffordSlot,
} from '@/screens/ArmyBuilder/armyLogic';
import { createDefaultArmy } from '@/types/army';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';

describe('calculatePointsSpent', () => {
  it('returns 0 for an empty army', () => {
    expect(calculatePointsSpent(createDefaultArmy('Necro'))).toBe(0);
  });

  it('sums upgraded slot costs', () => {
    const army = createDefaultArmy('Necro');
    army.slots[0].upgraded = true; // Rook → DeadLauncher: 12
    army.slots[3].upgraded = true; // Queen → QueenOfBones: 31
    expect(calculatePointsSpent(army)).toBe(12 + 31);
  });

  it('full upgrade matches sum of all costs', () => {
    const army = createDefaultArmy('Beast');
    army.slots.forEach(s => { s.upgraded = true; });
    const expected =
      UPGRADE_COSTS.Beast.Rook * 2 +
      UPGRADE_COSTS.Beast.Knight * 2 +
      UPGRADE_COSTS.Beast.Bishop * 2 +
      UPGRADE_COSTS.Beast.Queen +
      UPGRADE_COSTS.Beast.King +
      UPGRADE_COSTS.Beast.Pawn * 8;
    expect(calculatePointsSpent(army)).toBe(expected);
  });
});

describe('toggleSlotAt', () => {
  it('upgrades a slot if affordable', () => {
    const army = createDefaultArmy('Necro');
    const next = toggleSlotAt(army, 0, 100);
    expect(next.slots[0].upgraded).toBe(true);
  });

  it('un-upgrades an upgraded slot', () => {
    const army = createDefaultArmy('Necro');
    army.slots[0].upgraded = true;
    const next = toggleSlotAt(army, 0, 100);
    expect(next.slots[0].upgraded).toBe(false);
  });

  it('rejects upgrade if unaffordable', () => {
    const army = createDefaultArmy('Demon');
    // Queen costs 32 in Demon
    const next = toggleSlotAt(army, 3, 30);
    expect(next.slots[3].upgraded).toBe(false);
    expect(next).toBe(army);
  });

  it('always allows un-upgrade even when over budget', () => {
    const army = createDefaultArmy('Demon');
    army.slots.forEach(s => { s.upgraded = true; });
    const next = toggleSlotAt(army, 0, 0);
    expect(next.slots[0].upgraded).toBe(false);
  });

  it('does not mutate input army', () => {
    const army = createDefaultArmy('Necro');
    const before = JSON.stringify(army);
    toggleSlotAt(army, 0, 100);
    expect(JSON.stringify(army)).toBe(before);
  });
});

describe('upgradeAllSlots', () => {
  it('upgrades everything when budget is unlimited', () => {
    const next = upgradeAllSlots(createDefaultArmy('Beast'), 10000);
    expect(next.slots.every(s => s.upgraded)).toBe(true);
  });

  it('upgrades slots in order until budget runs out', () => {
    const army = createDefaultArmy('Necro');
    // Necro: Rook=12, Knight=18, Bishop=10, Queen=28, King=12, Bishop=10, Knight=18, Rook=12
    // Cumulative: 12, 30, 40, 68, 80, 90, 108, 120
    const next = upgradeAllSlots(army, 50);
    expect(next.slots[0].upgraded).toBe(true);  // Rook
    expect(next.slots[1].upgraded).toBe(true);  // Knight
    expect(next.slots[2].upgraded).toBe(true);  // Bishop
    expect(next.slots[3].upgraded).toBe(false); // Queen 28 > 10 left
  });

  it('upgrades nothing if budget is 0', () => {
    const next = upgradeAllSlots(createDefaultArmy('Necro'), 0);
    expect(next.slots.every(s => !s.upgraded)).toBe(true);
  });
});

describe('clearAllSlots', () => {
  it('un-upgrades every slot', () => {
    const army = createDefaultArmy('Wizard');
    army.slots.forEach(s => { s.upgraded = true; });
    const next = clearAllSlots(army);
    expect(next.slots.every(s => !s.upgraded)).toBe(true);
  });

  it('preserves guild', () => {
    const army = createDefaultArmy('Wizard');
    const next = clearAllSlots(army);
    expect(next.guild).toBe('Wizard');
  });
});

describe('getSlotPieceType', () => {
  it('returns basic type when not upgraded', () => {
    const army = createDefaultArmy('Necro');
    expect(getSlotPieceType(army, 0)).toBe('Rook');
  });

  it('returns guild type when upgraded', () => {
    const army = createDefaultArmy('Necro');
    army.slots[0].upgraded = true;
    expect(getSlotPieceType(army, 0)).toBe('DeadLauncher');
  });

  it('respects guild on upgrade', () => {
    const army = createDefaultArmy('Demon');
    army.slots[3].upgraded = true;
    expect(getSlotPieceType(army, 3)).toBe('QueenOfDestruction');
  });
});

describe('getSlotCost', () => {
  it('returns guild-specific cost', () => {
    expect(getSlotCost(createDefaultArmy('Necro'), 0)).toBe(12);
    expect(getSlotCost(createDefaultArmy('Demon'), 0)).toBe(20);
  });
});

describe('canAffordSlot', () => {
  it('always returns true for upgraded slots', () => {
    const army = createDefaultArmy('Demon');
    army.slots[3].upgraded = true;
    expect(canAffordSlot(army, 3, 0)).toBe(true);
  });

  it('returns true when budget covers cost', () => {
    expect(canAffordSlot(createDefaultArmy('Beast'), 0, 16)).toBe(true);
  });

  it('returns false when budget less than cost', () => {
    expect(canAffordSlot(createDefaultArmy('Beast'), 0, 15)).toBe(false);
  });

  it('factors in already-spent points', () => {
    const army = createDefaultArmy('Necro');
    army.slots[0].upgraded = true; // spent 12
    // Trying to upgrade Queen (28) with cap 30 → only 18 left
    expect(canAffordSlot(army, 3, 30)).toBe(false);
  });
});
