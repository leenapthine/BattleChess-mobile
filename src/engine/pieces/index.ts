import type { Piece, PieceType, Highlight } from '@/types/game';
import * as Pawn from './Pawn';
import * as Knight from './Knight';
import * as Bishop from './Bishop';
import * as Rook from './Rook';
import * as Queen from './Queen';
import * as King from './King';
import * as NecroPawn from './NecroPawn';
import * as GhostKnight from './GhostKnight';
import * as Necromancer from './Necromancer';
import * as DeadLauncher from './DeadLauncher';
import * as GhoulKing from './GhoulKing';
import * as QueenOfBones from './QueenOfBones';
import * as HellPawn from './HellPawn';
import * as Prowler from './Prowler';
import * as Howler from './Howler';
import * as Beholder from './Beholder';
import * as HellKing from './HellKing';
import * as QueenOfDestruction from './QueenOfDestruction';
import * as PawnHopper from './PawnHopper';
import * as BeastKnight from './BeastKnight';
import * as BeastDruid from './BeastDruid';
import * as BoulderThrower from './BoulderThrower';
import * as FrogKing from './FrogKing';
import * as QueenOfDomination from './QueenOfDomination';

export type PieceModule = {
  getValidMoves: (piece: Piece, pieces: Piece[]) => Highlight[];
  getAbilityTargets?: (piece: Piece, pieces: Piece[]) => Highlight[];
};

const registry: Partial<Record<PieceType, PieceModule>> = {
  Pawn,
  Knight,
  Bishop,
  Rook,
  Queen,
  King,
  NecroPawn,
  GhostKnight,
  Necromancer,
  DeadLauncher,
  GhoulKing,
  QueenOfBones,
  HellPawn,
  Prowler,
  Howler,
  Beholder,
  HellKing,
  QueenOfDestruction,
  PawnHopper,
  BeastKnight,
  BeastDruid,
  BoulderThrower,
  FrogKing,
  QueenOfDomination,
};

export function getPieceModule(type: PieceType): PieceModule | undefined {
  return registry[type];
}

export function registerPiece(type: PieceType, module: PieceModule): void {
  registry[type] = module;
}
