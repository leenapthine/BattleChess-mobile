import type { Piece, PieceType } from '@/types/game';
import type { BasicRole, Guild } from '@/types/army';
import { GUILD_PIECES, UPGRADE_COSTS } from '@/data/upgradeCosts';

// Classic relative values for the basic roles. The King is enormous so the
// search treats losing/taking a king as decisive (the game ends on king
// capture — there is no checkmate).
const ROLE_VALUE: Record<BasicRole, number> = {
  Pawn: 1,
  Knight: 3,
  Bishop: 3,
  Rook: 5,
  Queen: 9,
  King: 1000,
};

// Reverse the GUILD_PIECES map: upgraded PieceType → { guild, role } so an
// upgraded piece's value can fold in its army-builder upgrade cost.
const UPGRADED_INFO: Partial<Record<PieceType, { guild: Guild; role: BasicRole }>> = {};
for (const guild of Object.keys(GUILD_PIECES) as Guild[]) {
  for (const role of Object.keys(GUILD_PIECES[guild]) as BasicRole[]) {
    UPGRADED_INFO[GUILD_PIECES[guild][role]] = { guild, role };
  }
}

const BASIC_ROLES = new Set<string>(['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);

// Upgrade points are an army-builder currency; scale them down into the same
// ballpark as the role values so an upgraded pawn is worth a bit more than a
// plain one without dwarfing a queen.
const UPGRADE_SCALE = 0.1;

/** Heuristic worth of a single piece (always positive). */
export function pieceValue(piece: Piece): number {
  if (BASIC_ROLES.has(piece.type)) {
    return ROLE_VALUE[piece.type as BasicRole];
  }
  const info = UPGRADED_INFO[piece.type];
  if (!info) return 3; // unknown type — treat as a minor piece
  return ROLE_VALUE[info.role] + UPGRADE_COSTS[info.guild][info.role] * UPGRADE_SCALE;
}
