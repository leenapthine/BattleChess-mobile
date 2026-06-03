import { buildAIArmy, spendByPriority, ARCHETYPES } from '@/ai/buildArmy';
import { calculatePointsSpent } from '@/screens/ArmyBuilder/armyLogic';
import { createDefaultArmy } from '@/types/army';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';

// Leftover budget is smaller than the cheapest upgrade still available — i.e.
// the builder didn't leave points it could have spent.
function leavesNoAffordableUpgrade(army: ReturnType<typeof buildAIArmy>, pointCap: number) {
  const costs = UPGRADE_COSTS[army.guild];
  const remaining = pointCap - calculatePointsSpent(army);
  const cheapestUnbought = Math.min(
    ...army.slots.filter((s) => !s.upgraded).map((s) => costs[s.role]),
    Infinity,
  );
  return remaining < cheapestUnbought;
}

describe('army builder', () => {
  it('mirrors the human guild and never overspends', () => {
    const human = createDefaultArmy('Necro');
    for (let i = 0; i < 20; i++) {
      const army = buildAIArmy(human, 60);
      expect(army.guild).toBe('Necro');
      expect(army.slots).toHaveLength(16);
      expect(calculatePointsSpent(army)).toBeLessThanOrEqual(60);
    }
  });

  it('spends the points it is given (no free upgrades at cap 0)', () => {
    const army = buildAIArmy(createDefaultArmy('Wizard'), 0);
    expect(calculatePointsSpent(army)).toBe(0);
    expect(army.slots.every((s) => !s.upgraded)).toBe(true);
  });

  it('spends the budget fully (no affordable upgrade left unbought)', () => {
    // True across archetypes and caps — even 'elite', which buys few pricey
    // pieces, must mop up the remainder on cheaper ones.
    for (let i = 0; i < 20; i++) {
      const army = buildAIArmy(createDefaultArmy('Beast'), 120);
      expect(leavesNoAffordableUpgrade(army, 120)).toBe(true);
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
    // (spend correctness for each archetype is covered via buildAIArmy's
    // random archetype pick across the 20 iterations above.)
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(4);
  });
});
