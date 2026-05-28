import { BOARD_SLOTS, createDefaultArmy } from '@/types/army';

describe('BOARD_SLOTS', () => {
  it('has 16 slots in board order', () => {
    expect(BOARD_SLOTS).toHaveLength(16);
  });

  it('back row matches chess layout', () => {
    expect(BOARD_SLOTS.slice(0, 8)).toEqual([
      'Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook',
    ]);
  });

  it('pawn row is 8 pawns', () => {
    expect(BOARD_SLOTS.slice(8)).toEqual(Array(8).fill('Pawn'));
  });
});

describe('createDefaultArmy', () => {
  it('creates army with all slots un-upgraded', () => {
    const army = createDefaultArmy('Necro');
    expect(army.guild).toBe('Necro');
    expect(army.slots).toHaveLength(16);
    expect(army.slots.every(s => !s.upgraded)).toBe(true);
  });

  it('slot roles match BOARD_SLOTS', () => {
    const army = createDefaultArmy('Demon');
    expect(army.slots.map(s => s.role)).toEqual(BOARD_SLOTS);
  });

  it('works for all 4 guilds', () => {
    for (const guild of ['Necro', 'Demon', 'Beast', 'Wizard'] as const) {
      const army = createDefaultArmy(guild);
      expect(army.guild).toBe(guild);
      expect(army.slots).toHaveLength(16);
    }
  });
});
