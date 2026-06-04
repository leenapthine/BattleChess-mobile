import type { Guild, BasicRole } from '@/types/army';
import type { PieceType } from '@/types/game';

export const UPGRADE_COSTS: Record<Guild, Record<BasicRole, number>> = {
  // Self-play balancing (see sim-results/results.md):
  // - Iter 1 (2026-06-03): Necro Knight 18→16, Necro Queen 28→34,
  //   Beast Queen 30→32, Demon King 20→22.
  // - Iter 2 (2026-06-04): Necro Queen 34→30, now that the revive-as-plain-Queen
  //   nerf removed the near-immortality the price hike was compensating for.
  Necro:  { Pawn: 8,  Knight: 16, Bishop: 10, Rook: 12, Queen: 30, King: 12 },
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
