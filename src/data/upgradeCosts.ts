import type { Guild, BasicRole } from '@/types/army';
import type { PieceType } from '@/types/game';

export const UPGRADE_COSTS: Record<Guild, Record<BasicRole, number>> = {
  // Self-play balancing (see sim-results/results.md):
  // - Iter 1 (2026-06-03): Necro Knight 18→16, Necro Queen 28→34,
  //   Beast Queen 30→32, Demon King 20→22.
  // - Iter 2 (2026-06-04): Necro Queen 34→30 (revive-as-plain-Queen nerf).
  // - Iter 3 (2026-06-04): manual tuning pass —
  //   Necro King 12→11, Queen 30→31, Knight 16→15;
  //   Demon Queen 32→31, King 22→23, Knight 26→27, Rook 20→18;
  //   Beast King 18→17, Rook 16→15, Queen 32→33;
  //   Wizard Queen 26→25, King 24→25.
  // - Iter 4 (2026-06-04): first pass with the QueenOfBones-capture bug fixed
  //   (the AI can finally take a QoB, so its 80% artifact collapsed to ~50%).
  //   Necro King 11→10; Beast Queen 33→35 (genuinely strong, 56.8%);
  //   Demon Queen 31→29 (now underperforms at 42.8%).
  Necro:  { Pawn: 8,  Knight: 15, Bishop: 10, Rook: 12, Queen: 31, King: 10 },
  Demon:  { Pawn: 10, Knight: 27, Bishop: 20, Rook: 18, Queen: 29, King: 23 },
  Beast:  { Pawn: 7,  Knight: 10, Bishop: 15, Rook: 15, Queen: 35, King: 17 },
  Wizard: { Pawn: 7,  Knight: 12, Bishop: 16, Rook: 16, Queen: 25, King: 25 },
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
