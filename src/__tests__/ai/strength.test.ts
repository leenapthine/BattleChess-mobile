import { playGameVs, randomCap, type CapRange } from '@/ai/selfPlay';
import { randomAIArmy } from '@/ai/buildArmy';

// AI-strength probe — skipped in the normal suite. Run with:
//   npm run strength            (defaults)
//   D12=120 D23=40 npm run strength
// Pits search depths head-to-head with IDENTICAL armies on both sides, so the
// only difference is how far each looks ahead. A win rate well above 50% means
// the extra ply is worth a lot (i.e. there's real tactical headroom to grow).
const RUN = process.env.RUN_STRENGTH === '1';
const CAP: CapRange = { min: Number(process.env.CAP_MIN ?? 30), max: Number(process.env.CAP_MAX ?? 90) };
const MAX_PLIES = Number(process.env.MAX_PLIES ?? 160);

function depthMatch(high: number, low: number, games: number) {
  let score = 0;
  let draws = 0;
  for (let i = 0; i < games; i += 1) {
    const army = randomAIArmy(randomCap(CAP)); // same composition for both sides
    const highIsWhite = i % 2 === 0;
    const out = playGameVs(
      army,
      army,
      { depth: highIsWhite ? high : low },
      { depth: highIsWhite ? low : high },
      MAX_PLIES,
    );
    if (out.winner === null) { score += 0.5; draws += 1; }
    else if ((out.winner === 'White') === highIsWhite) score += 1;
  }
  return { rate: score / games, draws, games };
}

(RUN ? describe : describe.skip)('AI strength — value of search depth', () => {
  it('measures higher-depth score% vs lower depth', () => {
    const g12 = Number(process.env.D12 ?? 80);
    const t1 = Date.now();
    const d12 = depthMatch(2, 1, g12);
    // eslint-disable-next-line no-console
    console.log(`depth 2 vs depth 1:  ${(d12.rate * 100).toFixed(1)}%  (${d12.games} games, ${d12.draws} draws, ${((Date.now() - t1) / 1000).toFixed(1)}s)`);

    const g23 = Number(process.env.D23 ?? 24);
    const t2 = Date.now();
    const d23 = depthMatch(3, 2, g23);
    // eslint-disable-next-line no-console
    console.log(`depth 3 vs depth 2:  ${(d23.rate * 100).toFixed(1)}%  (${d23.games} games, ${d23.draws} draws, ${((Date.now() - t2) / 1000).toFixed(1)}s)`);
    expect(true).toBe(true);
  }, 2 * 60 * 60 * 1000);
});
