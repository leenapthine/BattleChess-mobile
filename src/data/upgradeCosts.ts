import type { Guild, BasicRole } from '@/types/army';
import type { PieceType } from '@/types/game';

export const UPGRADE_COSTS: Record<Guild, Record<BasicRole, number>> = {
  // Iteration 1 of self-play balancing (2026-06-03, see sim-results/results.md):
  // Necro Queen 28→34 (won 80.7%), Necro Knight 18→16 (43.5%),
  // Beast Queen 30→32 (56.8%), Demon King 20→22 (55.4%).
  Necro:  { Pawn: 8,  Knight: 16, Bishop: 10, Rook: 12, Queen: 34, King: 12 },
  Demon:  { Pawn: 10, Knight: 26, Bishop: 20, Rook: 20, Queen: 32, King: 22 },
  Beast:  { Pawn: 7,  Knight: 10, Bishop: 15, Rook: 16, Queen: 32, King: 18 },
  Wizard: { Pawn: 7,  Knight: 12, Bishop: 16, Rook: 16, Queen: 26, King: 24 },
};

export const GUILD_PIECES: Record<Guild, Record<BasicRole, PieceType>> = {
  Necro: {
    Pawn: 'NecroPawn', Knight: 'GhostKnight', Bishop: 'Necromancer',
    Rook: 'DeadLauncher', Queen: 'QueenOfBones', King: 'GhoulKing',
  },
  Demon: {
    Pawn: 'HellPawn', Knight: 'Prowler', Bishop: 'Howler',
    Rook: 'Beholder', Queen: 'QueenOfDestruction', King: 'HellKing',
  },
  Beast: {
    Pawn: 'PawnHopper', Knight: 'BeastKnight', Bishop: 'BeastDruid',
    Rook: 'BoulderThrower', Queen: 'QueenOfDomination', King: 'FrogKing',
  },
  Wizard: {
    Pawn: 'YoungWiz', Knight: 'Familiar', Bishop: 'WizardTower',
    Rook: 'Portal', Queen: 'QueenOfIllusions', King: 'WizardKing',
  },
};

export const GUILDS: Guild[] = ['Necro', 'Demon', 'Beast', 'Wizard'];
