import { playGame, runMatchup, randomArmy } from '@/ai/selfPlay';
import { calculatePointsSpent } from '@/screens/ArmyBuilder/armyLogic';
import { createDefaultArmy } from '@/types/army';
import { DIFFICULTIES } from '@/ai/chooseTurn';

describe('self-play harness', () => {
  it('plays a full game to a terminal state within the ply cap', () => {
    const out = playGame(createDefaultArmy('Necro'), createDefaultArmy('Wizard'), {
      difficulty: DIFFICULTIES.easy,
      maxPlies: 120,
    });
    expect(out.plies).toBeLessThanOrEqual(120);
    expect(['kingCapture', 'noMoves', 'plyCap']).toContain(out.reason);
    if (out.reason === 'kingCapture') expect(['White', 'Black']).toContain(out.winner);
    if (out.reason === 'plyCap') expect(out.winner).toBeNull();
  });

  it('respects a tiny ply cap (draws if nobody has won yet)', () => {
    const out = playGame(createDefaultArmy('Beast'), createDefaultArmy('Beast'), { maxPlies: 4 });
    expect(out.plies).toBeLessThanOrEqual(4);
  });

  it('runMatchup tallies to the number of games played', () => {
    const m = runMatchup(
      () => createDefaultArmy('Necro'),
      () => createDefaultArmy('Beast'),
      6,
      { maxPlies: 60 },
    );
    expect(m.games).toBe(6);
    expect(m.aWins + m.bWins + m.draws).toBe(6);
  });

  it('randomArmy stays within budget', () => {
    for (let i = 0; i < 10; i++) {
      expect(calculatePointsSpent(randomArmy('Wizard', 50))).toBeLessThanOrEqual(50);
    }
  });
});
