import type { Piece, PieceType, Highlight } from '@/types/game';
import * as Pawn from './Pawn';
import * as Knight from './Knight';
import * as Bishop from './Bishop';
import * as Rook from './Rook';
import * as Queen from './Queen';
import * as King from './King';

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
};

export function getPieceModule(type: PieceType): PieceModule | undefined {
  return registry[type];
}

export function registerPiece(type: PieceType, module: PieceModule): void {
  registry[type] = module;
}
