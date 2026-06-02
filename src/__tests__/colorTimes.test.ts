import { colorTimes } from '@/screens/OnlineGame/colorTimes';

describe('colorTimes', () => {
  it('maps host time to White and guest time to Black', () => {
    expect(colorTimes(120000, 90000)).toEqual({
      whiteTimeMs: 120000,
      blackTimeMs: 90000,
    });
  });

  it('does not swap clocks (regression: guest saw swapped timers)', () => {
    // The mapping is viewer-independent — host is always White, so the same
    // call returns the same result whether the host or the guest is looking.
    const result = colorTimes(60000, 45000);
    expect(result.whiteTimeMs).toBe(60000); // host
    expect(result.blackTimeMs).toBe(45000); // guest
  });

  it('passes null time banks through (no-timer games)', () => {
    expect(colorTimes(null, null)).toEqual({
      whiteTimeMs: null,
      blackTimeMs: null,
    });
  });

  it('handles a mix of null and numeric banks', () => {
    expect(colorTimes(null, 30000)).toEqual({
      whiteTimeMs: null,
      blackTimeMs: 30000,
    });
  });
});
