import type { BasicRole, Guild } from '@/types/army';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';
import { ARCHETYPES, PRIORITIES, spendByPriority, type Archetype } from './buildArmy';
import { runMatchup, randomArmy, playGame, randomCap, type PlayOptions, type CapRange } from './selfPlay';

const ROLES: BasicRole[] = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

// ── Archetype ranking ──────────────────────────────────────────────────────

export type ArchetypeStanding = { archetype: Archetype; score: number; games: number; winRate: number };

/**
 * Round-robin the archetypes against each other (same guild + budget) and rank
 * them by overall score (win = 1, draw = 0.5). Answers "which build wins?".
 */
export function runArchetypeTournament(
  guild: Guild,
  capRange: CapRange,
  gamesPerPair: number,
  opts?: PlayOptions,
): ArchetypeStanding[] {
  const score: Record<string, number> = {};
  const games: Record<string, number> = {};
  for (const a of ARCHETYPES) { score[a] = 0; games[a] = 0; }

  for (let i = 0; i < ARCHETYPES.length; i += 1) {
    for (let j = i + 1; j < ARCHETYPES.length; j += 1) {
      const a = ARCHETYPES[i];
      const b = ARCHETYPES[j];
      const r = runMatchup(
        (cap) => spendByPriority(guild, cap, PRIORITIES[a]),
        (cap) => spendByPriority(guild, cap, PRIORITIES[b]),
        gamesPerPair,
        capRange,
        opts,
      );
      score[a] += r.aWins + r.draws * 0.5;
      score[b] += r.bWins + r.draws * 0.5;
      games[a] += r.games;
      games[b] += r.games;
    }
  }

  return ARCHETYPES
    .map((archetype) => ({
      archetype,
      score: score[archetype],
      games: games[archetype],
      winRate: games[archetype] ? score[archetype] / games[archetype] : 0,
    }))
    .sort((x, y) => y.winRate - x.winRate);
}

// ── Per-unit balance report ──────────────────────────────────────────────────

export type CountBucket = { count: number; scoreRate: number; sample: number };

export type BalanceRow = {
  role: BasicRole;
  cost: number;
  scoreRate: number; // overall (any number upgraded): win=1, draw=0.5
  sample: number;
  // Dose-response: score% split by *how many* of this unit were upgraded
  // (e.g. 3 pawns vs 6 pawns). One bucket per observed count ≥ 1.
  byCount: CountBucket[];
  suggestion: 'raise cost' | 'lower cost' | 'ok';
};

const MAX_PER_ROLE = 8; // 8 pawns is the most of any single role

/**
 * Play random-army vs random-army games and measure, per upgrade, how often the
 * side that bought it scored — broken down by *how many* of that unit it ran.
 * A unit scoring well above 50% is underpriced (→ raise cost); below, overpriced
 * (→ lower it). The per-count breakdown shows whether stacking it helps (a
 * swarm synergy) or has diminishing returns.
 *
 * Caveat: this measures balance *as the bot plays*. If the AI under-uses an
 * ability, that unit looks weak even if it's strong for a human — so treat
 * findings as a strong signal, not gospel, and cross-check the units that matter.
 */
export function runBalanceReport(
  guild: Guild,
  capRange: CapRange,
  games: number,
  opts?: PlayOptions,
): BalanceRow[] {
  // score[role][count] / sample[role][count], indexed by how many were upgraded.
  const score: Record<string, number[]> = {};
  const sample: Record<string, number[]> = {};
  for (const role of ROLES) {
    score[role] = new Array(MAX_PER_ROLE + 1).fill(0);
    sample[role] = new Array(MAX_PER_ROLE + 1).fill(0);
  }

  for (let i = 0; i < games; i += 1) {
    const cap = randomCap(capRange);
    const white = randomArmy(guild, cap);
    const black = randomArmy(guild, cap);
    const outcome = playGame(white, black, opts);

    for (const [army, color] of [[white, 'White'], [black, 'Black']] as const) {
      const sideScore = outcome.winner === null ? 0.5 : outcome.winner === color ? 1 : 0;
      const counts: Record<string, number> = {};
      for (const slot of army.slots) {
        if (slot.upgraded) counts[slot.role] = (counts[slot.role] ?? 0) + 1;
      }
      for (const role of ROLES) {
        const c = counts[role] ?? 0;
        if (c >= 1) {
          score[role][c] += sideScore;
          sample[role][c] += 1;
        }
      }
    }
  }

  return ROLES.map((role) => {
    const byCount: CountBucket[] = [];
    let totalScore = 0;
    let totalSample = 0;
    for (let c = 1; c <= MAX_PER_ROLE; c += 1) {
      const n = sample[role][c];
      if (n > 0) {
        byCount.push({ count: c, scoreRate: score[role][c] / n, sample: n });
        totalScore += score[role][c];
        totalSample += n;
      }
    }
    const scoreRate = totalSample ? totalScore / totalSample : 0;
    const suggestion = scoreRate > 0.55 ? 'raise cost' : scoreRate < 0.45 ? 'lower cost' : 'ok';
    return { role, cost: UPGRADE_COSTS[guild][role], scoreRate, sample: totalSample, byCount, suggestion };
  });
}

// ── Console formatting (for the gated tournament runner) ─────────────────────

export function formatArchetypeStandings(guild: Guild, rows: ArchetypeStanding[]): string {
  const lines = [`Archetype ranking — ${guild}`];
  for (const r of rows) {
    lines.push(`  ${r.archetype.padEnd(9)} ${(r.winRate * 100).toFixed(1).padStart(5)}%  (${r.games} games)`);
  }
  return lines.join('\n');
}

// Only show per-count buckets with enough games to be meaningful.
const MIN_BUCKET_SAMPLE = 20;

export function formatBalanceReport(guild: Guild, rows: BalanceRow[]): string {
  const lines = [`Balance report — ${guild}   (score% by upgraded unit; ~50% = fairly priced)`];
  for (const r of rows) {
    const pct = (r.scoreRate * 100).toFixed(1).padStart(5);
    lines.push(`  ${r.role.padEnd(7)} cost ${String(r.cost).padStart(3)}  ${pct}%  n=${String(r.sample).padStart(4)}  → ${r.suggestion}`);
    // Dose-response line (only for roles that can have more than one, and only
    // counts with enough sample) — e.g. how 3 pawns compares to 6.
    const buckets = r.byCount.filter((b) => b.sample >= MIN_BUCKET_SAMPLE);
    if (buckets.length > 1) {
      const parts = buckets.map(
        (b) => `×${b.count} ${(b.scoreRate * 100).toFixed(0)}%(${b.sample})`,
      );
      lines.push(`            by count: ${parts.join('  ')}`);
    }
  }
  return lines.join('\n');
}
