import type { Color } from '@/types/game';

/**
 * Resolve the winner of an online game from the loser's color and the seat
 * ids. The board never flips: the host is always White and the guest always
 * Black, so the winning user id follows directly from the winning color.
 * `winnerId` is null when that seat is empty (e.g. guest never joined).
 */
export function winnerOf(
  loserColor: Color,
  hostId: string,
  guestId: string | null,
): { winnerColor: Color; winnerId: string | null } {
  const winnerColor: Color = loserColor === 'White' ? 'Black' : 'White';
  const winnerId = winnerColor === 'White' ? hostId : guestId;
  return { winnerColor, winnerId };
}
