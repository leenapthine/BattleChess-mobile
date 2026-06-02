// The board never flips: White is always the host's seat and Black the
// guest's, for players and spectators alike. So the per-color clocks map
// straight from the host/guest time banks regardless of who is viewing.
// (Previously this branched on isHost, which swapped the clocks for the guest.)
export function colorTimes(
  hostTimeMs: number | null,
  guestTimeMs: number | null,
): { whiteTimeMs: number | null; blackTimeMs: number | null } {
  return { whiteTimeMs: hostTimeMs, blackTimeMs: guestTimeMs };
}
