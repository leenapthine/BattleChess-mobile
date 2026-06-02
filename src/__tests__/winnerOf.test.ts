import { winnerOf } from '@/hooks/winnerOf';

describe('winnerOf', () => {
  const HOST = 'host-uuid';
  const GUEST = 'guest-uuid';

  it('White loses → Black (guest) wins', () => {
    expect(winnerOf('White', HOST, GUEST)).toEqual({
      winnerColor: 'Black',
      winnerId: GUEST,
    });
  });

  it('Black loses → White (host) wins', () => {
    expect(winnerOf('Black', HOST, GUEST)).toEqual({
      winnerColor: 'White',
      winnerId: HOST,
    });
  });

  it('host is always White (winner id follows the color, not the seat)', () => {
    // Regardless of who resigned, a White win always pays out to the host id.
    expect(winnerOf('Black', HOST, GUEST).winnerId).toBe(HOST);
  });

  it('returns null winnerId when the winning seat is empty', () => {
    // Guest never joined: a White loss has no Black winner to credit.
    expect(winnerOf('White', HOST, null)).toEqual({
      winnerColor: 'Black',
      winnerId: null,
    });
  });
});
