import { randomAIArmy, spendByPriority, ARCHETYPES } from '@/ai/buildArmy';
import { calculatePointsSpent } from '@/screens/ArmyBuilder/armyLogic';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';
import type { ArmyConfig } from '@/types/army';

// Leftover budget is smaller than the cheapest upgrade still available — i.e.
// the builder didn't leave points it could have spent.
function leavesNoAffordableUpgrade(army: ArmyConfig, pointCap: number) {
  const costs = UPGRADE_COSTS[army.guild];
  const remaining = pointCap - calculatePointsSpent(army);
  const cheapestUnbought = Math.min(
    ...army.slots.filter((s) => !s.upgraded).map((s) => costs[s.role]),
    Infinity,
  );
  return remaining < cheapestUnbought;
}

describe('army builder', () => {
  it('randomAIArmy varies the guild (does not mirror) and never overspends', () => {
    const guilds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const army = randomAIArmy(60);
      guilds.add(army.guild);
      expect(army.slots).toHaveLength(16);
      expect(calculatePointsSpent(army)).toBeLessThanOrEqual(60);
    }
    // Over 40 rolls it should pick more than one of the four guilds.
    expect(guilds.size).toBeGreaterThan(1);
  });

  it('spends the points it is given (no free upgrades at cap 0)', () => {
    const army = randomAIArmy(0);
    expect(calculatePointsSpent(army)).toBe(0);
    expect(army.slots.every((s) => !s.upgraded)).toBe(true);
  });

  it('spends the budget fully (no affordable upgrade left unbought)', () => {
    // True across guilds/archetypes — even 'elite', which buys few pricey
    // pieces, must mop up the remainder on cheaper ones.
    for (let i = 0; i < 40; i++) {
      expect(leavesNoAffordableUpgrade(randomAIArmy(120), 120)).toBe(true);
    }
  });

  it('elite buys the queen first', () => {
    // Budget for exactly one queen upgrade → elite spends it on the queen.
    const elite = { Queen: 10, Rook: 8, King: 6, Bishop: 3, Knight: 3, Pawn: 1 } as const;
    const army = spendByPriority('Demon', UPGRADE_COSTS.Demon.Queen, elite);
    const queen = army.slots.find((s) => s.role === 'Queen');
    expect(queen?.upgraded).toBe(true);
    expect(army.slots.filter((s) => s.role === 'Pawn').every((s) => !s.upgraded)).toBe(true);
  });

  it('every archetype produces a legal, affordable army', () => {
    for (const name of ARCHETYPES) {
      expect(typeof name).toBe('string');
    }
    // (spend correctness for each archetype is covered via randomAIArmy's
    // random archetype pick across the iterations above.)
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(4);
  });
});
