import { UPGRADE_COSTS, GUILD_PIECES, GUILDS } from '@/data/upgradeCosts';
import type { BasicRole } from '@/types/army';

const ROLES: BasicRole[] = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

describe('UPGRADE_COSTS', () => {
  it('all 4 guilds present', () => {
    expect(Object.keys(UPGRADE_COSTS).sort()).toEqual(['Beast', 'Demon', 'Necro', 'Wizard']);
  });

  it('every guild × role has a positive cost', () => {
    for (const guild of GUILDS) {
      for (const role of ROLES) {
        expect(UPGRADE_COSTS[guild][role]).toBeGreaterThan(0);
      }
    }
  });

  it('Necro costs match spec', () => {
    expect(UPGRADE_COSTS.Necro).toEqual({
      Pawn: 8, Knight: 18, Bishop: 10, Rook: 12, Queen: 28, King: 12,
    });
  });

  it('Demon costs match spec', () => {
    expect(UPGRADE_COSTS.Demon).toEqual({
      Pawn: 10, Knight: 26, Bishop: 20, Rook: 20, Queen: 32, King: 20,
    });
  });

  it('Beast costs match spec', () => {
    expect(UPGRADE_COSTS.Beast).toEqual({
      Pawn: 7, Knight: 10, Bishop: 15, Rook: 16, Queen: 30, King: 18,
    });
  });

  it('Wizard costs match spec', () => {
    expect(UPGRADE_COSTS.Wizard).toEqual({
      Pawn: 7, Knight: 12, Bishop: 16, Rook: 16, Queen: 26, King: 24,
    });
  });
});

describe('GUILD_PIECES', () => {
  it('every guild × role maps to a piece type', () => {
    for (const guild of GUILDS) {
      for (const role of ROLES) {
        expect(GUILD_PIECES[guild][role]).toBeTruthy();
      }
    }
  });

  it('Necro mapping', () => {
    expect(GUILD_PIECES.Necro).toEqual({
      Pawn: 'NecroPawn', Knight: 'GhostKnight', Bishop: 'Necromancer',
      Rook: 'DeadLauncher', Queen: 'QueenOfBones', King: 'GhoulKing',
    });
  });

  it('Demon mapping', () => {
    expect(GUILD_PIECES.Demon).toEqual({
      Pawn: 'HellPawn', Knight: 'Prowler', Bishop: 'Howler',
      Rook: 'Beholder', Queen: 'QueenOfDestruction', King: 'HellKing',
    });
  });

  it('Beast mapping', () => {
    expect(GUILD_PIECES.Beast).toEqual({
      Pawn: 'PawnHopper', Knight: 'BeastKnight', Bishop: 'BeastDruid',
      Rook: 'BoulderThrower', Queen: 'QueenOfDomination', King: 'FrogKing',
    });
  });

  it('Wizard mapping', () => {
    expect(GUILD_PIECES.Wizard).toEqual({
      Pawn: 'YoungWiz', Knight: 'Familiar', Bishop: 'WizardTower',
      Rook: 'Portal', Queen: 'QueenOfIllusions', King: 'WizardKing',
    });
  });
});

describe('GUILDS list', () => {
  it('contains exactly 4 guilds', () => {
    expect(GUILDS).toHaveLength(4);
    expect(GUILDS).toEqual(['Necro', 'Demon', 'Beast', 'Wizard']);
  });
});
