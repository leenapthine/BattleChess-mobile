import * as fs from 'fs';
import * as path from 'path';
import type { Guild } from '@/types/army';
import {
  runArchetypeTournament,
  runBalanceReport,
  formatArchetypeStandings,
  formatBalanceReport,
} from '@/ai/balance';
import type { CapRange } from '@/ai/selfPlay';

// Heavy analysis run — skipped in the normal suite. Run it on demand:
//   npm run selfplay                          (all guilds, defaults)
//   GAMES=400 CAP_MIN=20 CAP_MAX=100 npm run selfplay
// Each run APPENDS a timestamped section to sim-results/results.md so findings
// accumulate over time. Tunable env: GUILD, CAP_MIN, CAP_MAX, GAMES, DEPTH,
// MAX_PLIES.
const RUN = process.env.RUN_TOURNAMENT === '1';

const GUILDS_TO_RUN: Guild[] = process.env.GUILD
  ? [process.env.GUILD as Guild]
  : ['Necro', 'Demon', 'Beast', 'Wizard'];
const CAP_RANGE: CapRange = {
  min: Number(process.env.CAP_MIN ?? 20),
  max: Number(process.env.CAP_MAX ?? 100),
};
const GAMES = Number(process.env.GAMES ?? 60);
const DEPTH = Number(process.env.DEPTH ?? 1);
const MAX_PLIES = Number(process.env.MAX_PLIES ?? 160);

const RESULTS_DIR = path.join(process.cwd(), 'sim-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'results.md');

function appendResults(markdown: string) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(
      RESULTS_FILE,
      '# BattleChess self-play results\n\n' +
        'Appended by `npm run selfplay`. Each section is one run. Score% ~50% = fairly priced.\n',
    );
  }
  fs.appendFileSync(RESULTS_FILE, markdown);
}

(RUN ? describe : describe.skip)('self-play analysis', () => {
  const opts = { difficulty: { depth: DEPTH }, maxPlies: MAX_PLIES };

  it('ranks archetypes + per-unit balance per guild, and records it', () => {
    const stamp = new Date().toISOString();
    // Write the run header first, then append each guild as it finishes — so an
    // interrupted overnight run still keeps every guild that completed.
    appendResults(
      `\n## ${stamp}\n\n` +
        `params: games=${GAMES}, cap=${CAP_RANGE.min}–${CAP_RANGE.max} (random/game), depth=${DEPTH}, maxPlies=${MAX_PLIES}\n`,
    );

    for (const guild of GUILDS_TO_RUN) {
      const standings = runArchetypeTournament(guild, CAP_RANGE, GAMES, opts);
      const balance = runBalanceReport(guild, CAP_RANGE, GAMES * 4, opts);

      const block =
        '\n```\n' +
        formatArchetypeStandings(guild, standings) +
        '\n\n' +
        formatBalanceReport(guild, balance) +
        '\n```\n';

      // eslint-disable-next-line no-console
      console.log(block);
      appendResults(block); // persist this guild before moving on
    }

    // eslint-disable-next-line no-console
    console.log(`\nresults appended to ${RESULTS_FILE}`);
    expect(true).toBe(true);
  }, 12 * 60 * 60 * 1000); // up to 12h — safe for an overnight run
});
