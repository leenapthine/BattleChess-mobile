import { runBalanceReport } from '@/ai/balance';

describe('runBalanceReport (count-aware)', () => {
  it('breaks each unit down by how many were upgraded, summing to the overall', () => {
    const rows = runBalanceReport('Necro', { min: 30, max: 90 }, 8, {
      difficulty: { depth: 1 },
      maxPlies: 40,
    });

    expect(rows.map((r) => r.role)).toEqual(['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);

    for (const r of rows) {
      // Overall sample is the sum of the per-count buckets.
      const bucketSum = r.byCount.reduce((n, b) => n + b.sample, 0);
      expect(bucketSum).toBe(r.sample);
      // Buckets are positive counts in ascending order.
      for (let i = 1; i < r.byCount.length; i++) {
        expect(r.byCount[i].count).toBeGreaterThan(r.byCount[i - 1].count);
        expect(r.byCount[i].count).toBeGreaterThanOrEqual(1);
      }
    }

    // The Queen has a single slot, so it can never have a >1 bucket.
    const queen = rows.find((r) => r.role === 'Queen')!;
    expect(queen.byCount.every((b) => b.count === 1)).toBe(true);
  });
});
