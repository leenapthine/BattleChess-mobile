import type { PieceType } from '@/types/game';

/**
 * Bulleted breakdowns shown on the title / info cards.
 * First bullet(s) cover movement & capture; later bullets cover special abilities.
 */
export const pieceDetails: Record<PieceType, string[]> = {
  // ── Basic ─────────────────────────────────────────────────
  Pawn: [
    'Moves 1 tile forward (2 on first move).',
    'Captures diagonally one tile.',
  ],
  Knight: [
    'Moves in an L-shape (2+1).',
    'Jumps over all pieces; captures on landing.',
  ],
  Bishop: [
    'Moves diagonally any distance.',
    'Blocked by pieces; captures on landing.',
  ],
  Rook: [
    'Moves orthogonally any distance.',
    'Blocked by pieces; captures on landing.',
  ],
  Queen: [
    'Moves in all 8 directions any distance.',
    'Combines Rook and Bishop range.',
  ],
  King: [
    'Moves 1 tile in any direction.',
    'If captured, you lose the game.',
  ],

  // ── Necro ─────────────────────────────────────────────────
  NecroPawn: [
    'Moves and captures like a Pawn.',
    'Self-destruct: tap 3 times to arm and detonate.',
    'Detonation destroys all 8 adjacent pieces (friend or foe).',
  ],
  GhostKnight: [
    'Moves in an L-shape like a Knight.',
    'After moving, stuns all adjacent enemies for one turn.',
    'Stunned pieces cannot move or use abilities.',
  ],
  Necromancer: [
    'Moves and captures like a Bishop.',
    'After a capture, raise a Pawn on an adjacent empty tile.',
  ],
  DeadLauncher: [
    'Moves and captures like a Rook.',
    'Load an adjacent friendly Pawn into the launcher.',
    'Once loaded, fire to destroy any piece at exactly range 3.',
  ],
  GhoulKing: [
    'Moves 1 tile in any direction like a King.',
    'Once per game, raise a NecroPawn on an adjacent empty tile (free action).',
  ],
  QueenOfBones: [
    'Moves in all 8 directions like a Queen.',
    'When captured, sacrifices 2 friendly Pawns to revive at her spawn tile.',
    'Revives as a plain Queen — a one-time second life, with no further revival.',
  ],

  // ── Demon ─────────────────────────────────────────────────
  HellPawn: [
    'Moves and captures like a Pawn.',
    'Capturing a non-Pawn transforms this piece into the captured type.',
  ],
  Prowler: [
    'Moves in an L-shape like a Knight.',
    'After a capture, must make a mandatory second Knight move.',
  ],
  Howler: [
    'Moves and captures like a Bishop.',
    'Permanently gains the movement type of every piece it captures.',
  ],
  Beholder: [
    'Moves 1 cardinal step into an empty tile only.',
    'Ranged attack hits any enemy within distance 3.',
  ],
  HellKing: [
    'Moves 1 tile in any direction like a King.',
    'Converts enemies instead of capturing — flips their colour to your side.',
  ],
  QueenOfDestruction: [
    'Moves in all 8 directions like a Queen.',
    'When captured, detonates and destroys all 8 adjacent pieces.',
  ],

  // ── Beast ─────────────────────────────────────────────────
  PawnHopper: [
    'Moves 1 or 2 tiles forward at any time.',
    'Captures diagonally one tile like a Pawn.',
    'Hop-captures by jumping straight over an adjacent enemy.',
  ],
  BeastKnight: [
    'Moves in an extended L-shape (3+1).',
    'Jumps over pieces; captures on landing.',
  ],
  BeastDruid: [
    'Moves like a Bishop (diagonal any distance).',
    'Also moves 1 tile in any direction like a King.',
  ],
  BoulderThrower: [
    'Moves like a Rook but cannot capture by moving.',
    'Boulder kills an enemy at distance 1 (point-blank stomp) or distance 3 (long lob).',
    'Has a blind spot at distance 2 — it cannot hit the ring just outside melee.',
  ],
  FrogKing: [
    'Moves 1 tile in any direction like a King.',
    'Also makes 2-tile orthogonal hops that jump over pieces.',
  ],
  QueenOfDomination: [
    'Moves in all 8 directions like a Queen.',
    'Dominate an adjacent friendly piece — it moves as a Queen for one turn.',
  ],

  // ── Wizard ────────────────────────────────────────────────
  YoungWiz: [
    'Moves and captures like a Pawn.',
    'Zaps the enemy directly in front without moving.',
  ],
  Familiar: [
    'Moves in an L-shape like a Knight.',
    'Activate to turn to stone: immune to all capture.',
    'Un-stoning is a free action on a later turn.',
  ],
  WizardTower: [
    'Moves like a Bishop.',
    'Captures at range — the tower stays put and destroys the target.',
  ],
  Portal: [
    'Moves like a Rook.',
    'Store any friendly piece inside the portal.',
    'Teleport the stored piece out from any other friendly Portal.',
  ],
  WizardKing: [
    'Moves 1 tile in any direction like a King.',
    'Activate to fire vertically — kills the first enemy in line of sight.',
  ],
  QueenOfIllusions: [
    'Moves in all 8 directions like a Queen.',
    'Swap positions with any friendly Pawn-type piece on the board.',
  ],
};
