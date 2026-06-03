import type { ArmyConfig, BasicRole, Guild } from '@/types/army';
import { createDefaultArmy } from '@/types/army';
import { UPGRADE_COSTS, GUILDS } from '@/data/upgradeCosts';

export type Archetype = 'elite' | 'swarm' | 'vanguard' | 'balanced' | 'defensive' | 'ranged';

// Per-archetype spending priority over the basic roles. Upgrade costs are
// balanced (cost ≈ power), so the cost-effective play is simply to spend the
// whole budget — the archetype decides *what* gets upgraded, which is where
// guild synergies emerge (e.g. a Necro 'swarm' fills the board with NecroPawns
// alongside the Necromancer that raises them).
//
// These weightings are deliberate guesses for now. Phase 2 (headless AI-vs-AI
// self-play) will rank archetypes by measured win rate and replace the guesses.
export const PRIORITIES: Record<Archetype, Record<BasicRole, number>> = {
  elite:    { Queen: 10, Rook: 8, King: 6, Bishop: 3, Knight: 3, Pawn: 1 },
  swarm:    { Pawn: 9, Knight: 6, Bishop: 5, Queen: 3, Rook: 3, King: 2 },
  vanguard: { Knight: 9, Bishop: 8, Queen: 6, Pawn: 4, Rook: 3, King: 2 },
  balanced: { Queen: 6, Rook: 5, Bishop: 4, Knight: 4, King: 3, Pawn: 2 },
  // Turtle: a hardened back rank + ranged support. The Rook slot is each
  // guild's projectile unit (DeadLauncher / Beholder / BoulderThrower / Portal).
  defensive: { King: 9, Rook: 8, Bishop: 6, Queen: 4, Pawn: 4, Knight: 2 },
  // Lean hard into ranged/projectile power (Rook + Bishop slots).
  ranged:   { Rook: 10, Bishop: 8, Queen: 5, King: 4, Knight: 2, Pawn: 2 },
};

export const ARCHETYPES = Object.keys(PRIORITIES) as Archetype[];

/**
 * Spend `pointCap` upgrading slots in the archetype's priority order (with a
 * little jitter so equal-priority picks vary between games). Buys cheaper
 * pieces with any leftover; never exceeds the budget.
 */
export function spendByPriority(
  guild: Guild,
  pointCap: number,
  priority: Record<BasicRole, number>,
): ArmyConfig {
  const base = createDefaultArmy(guild);
  const costs = UPGRADE_COSTS[guild];
  const slots = base.slots.map((s) => ({ ...s }));

  const order = slots
    .map((slot, index) => ({ index, score: priority[slot.role] + Math.random() }))
    .sort((a, b) => b.score - a.score)
    .map((o) => o.index);

  let remaining = pointCap;
  for (const i of order) {
    const cost = costs[slots[i].role];
    if (cost <= remaining) {
      slots[i].upgraded = true;
      remaining -= cost;
    }
  }

  return { ...base, slots };
}

/**
 * Build the AI's army for a solo game. Because the AI builds *after* the human,
 * it mirrors the human's guild (a fair, comprehensible matchup) and picks a
 * random archetype for variety, spending the same point budget.
 */
export function buildAIArmy(humanArmy: ArmyConfig, pointCap: number): ArmyConfig {
  const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  return spendByPriority(humanArmy.guild, pointCap, PRIORITIES[archetype]);
}

/** A fully self-chosen AI army: random guild + random archetype, full budget.
 *  Used for AI-vs-AI watch games where there's no human army to mirror. */
export function randomAIArmy(pointCap: number): ArmyConfig {
  const guild: Guild = GUILDS[Math.floor(Math.random() * GUILDS.length)];
  const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  return spendByPriority(guild, pointCap, PRIORITIES[archetype]);
}
