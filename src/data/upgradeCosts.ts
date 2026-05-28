import type { Guild, BasicRole } from '@/types/army';
import type { PieceType } from '@/types/game';

export const UPGRADE_COSTS: Record<Guild, Record<BasicRole, number>> = {
  Necro:  { Pawn: 8,  Knight: 18, Bishop: 10, Rook: 12, Queen: 28, King: 12 },
  Demon:  { Pawn: 10, Knight: 26, Bishop: 20, Rook: 20, Queen: 32, King: 20 },
  Beast:  { Pawn: 7,  Knight: 10, Bishop: 15, Rook: 16, Queen: 30, King: 18 },
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
