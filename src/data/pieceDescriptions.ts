import type { PieceType } from '@/types/game';

export const pieceDescriptions: Record<PieceType, string> = {
  Pawn: 'Moves forward 1 tile; captures diagonally. Can move 2 on first move.',
  Knight: 'Moves in an L-shape (2+1). Jumps over all pieces.',
  Bishop: 'Moves diagonally any number of tiles. Blocked by pieces.',
  Rook: 'Moves horizontally or vertically any distance. Blocked by pieces.',
  Queen: 'Combines Rook and Bishop. Moves in all 8 directions.',
  King: 'Moves 1 tile in any direction.',

  NecroPawn: 'Standard pawn moves. Self-destruct: click 3x to detonate, destroying all adjacent pieces.',
  GhostKnight: 'Knight movement. After moving, stuns all adjacent enemies for one turn.',
  Necromancer: 'Bishop movement. After capturing, raise a Pawn on an adjacent empty tile.',
  DeadLauncher: 'Rook movement. Load an adjacent pawn, then launch it to destroy a target at range 3.',
  GhoulKing: 'King movement. Once per game, raise a NecroPawn on an adjacent empty tile (free action).',
  QueenOfBones: 'Queen movement. When captured, sacrifice 2 friendly pawns to revive at spawn.',

  HellPawn: 'Standard pawn. Capturing a non-pawn transforms HellPawn into that piece type.',
  Prowler: 'Knight movement. After capturing, makes a mandatory second knight move.',
  Howler: 'Bishop movement. Permanently gains the movement type of each piece it captures.',
  Beholder: 'Moves 1 cardinal step (empty only). Ranged attack hits enemies within distance 3.',
  HellKing: 'King movement. Converts enemies instead of capturing — flips their color.',
  QueenOfDestruction: 'Queen movement. When captured, detonates and destroys all adjacent pieces.',

  PawnHopper: 'Always moves 1-2 forward. Hop-captures by jumping over an adjacent enemy.',
  BeastKnight: 'Extended L-shape: 3+1 instead of 2+1. Jumps over pieces.',
  BeastDruid: 'Combines Bishop and King movement. Diagonal range plus 1-step any direction.',
  BoulderThrower: 'Rook movement (no capture). Throws boulder to kill enemies at exact distance 3.',
  FrogKing: 'King movement plus 2-tile orthogonal hops that jump over pieces.',
  QueenOfDomination: 'Queen movement. Dominate an adjacent friendly — it moves as a Queen for one turn.',

  YoungWiz: 'Standard pawn. Zaps enemy directly ahead without moving.',
  Familiar: 'Knight movement. Turn to stone: immune to all capture. Un-stone is a free action.',
  WizardTower: 'Bishop movement. Captures at range — does not move into the target square.',
  Portal: 'Rook movement. Store a friendly piece, teleport it out from any friendly Portal.',
  WizardKing: 'King movement. Activate to shoot vertically — kills first enemy in line of sight.',
  QueenOfIllusions: 'Queen movement. Swap positions with any friendly pawn-type on the board.',
};
