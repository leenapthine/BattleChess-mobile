import type { Piece, Highlight, Square, GameState, GainedAbilities } from '@/types/game';
import { getQueenMoves } from '@/engine/helpers/moveHelpers';
import { getPieceAt, removePiece, generateId } from '@/engine/utils';

const PAWN_TYPES = ['Pawn', 'NecroPawn', 'HellPawn', 'YoungWiz', 'PawnHopper'] as const;

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  return getQueenMoves(piece, pieces);
}

export function getEligibleSacrifices(color: Piece['color'], pieces: Piece[]): Piece[] {
  return pieces.filter(
    p => p.color === color && (PAWN_TYPES as readonly string[]).includes(p.type),
  );
}

export function canRevive(color: Piece['color'], pieces: Piece[]): boolean {
  return getEligibleSacrifices(color, pieces).length >= 2;
}

const DEFAULT_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

export function performRevival(
  sacrificeIds: [string, string],
  queenColor: Piece['color'],
  state: GameState,
): GameState {
  const spawnRow = queenColor === 'White' ? 0 : 7;
  const spawnCol = 3;
  const spawnSquare: Square = { row: spawnRow, col: spawnCol };

  let updatedPieces = state.pieces;
  updatedPieces = removePiece(updatedPieces, sacrificeIds[0]);
  updatedPieces = removePiece(updatedPieces, sacrificeIds[1]);

  if (getPieceAt(spawnSquare, updatedPieces)) {
    return { ...state, pieces: updatedPieces };
  }

  // BALANCE (2026-06-04): the queen revives as a *plain* Queen, not another
  // QueenOfBones. The original recursive phoenix — it returned as a QoB and
  // could revive again and again for 2 pawns each time — made it a near-immortal
  // queen that won ~81% of self-play games at any affordable price (see
  // sim-results/results.md). Reviving as a mortal Queen keeps the one-time
  // second life and its flavour, but a plain Queen has no revival, so it can't
  // come back a second time.
  const revivedQueen: Piece = {
    id: generateId(),
    type: 'Queen',
    color: queenColor,
    row: spawnRow,
    col: spawnCol,
    hasMoved: false,
    stunned: false,
    isStone: false,
    pawnLoaded: false,
    pieceLoaded: null,
    raisesLeft: 0,
    gainedAbilities: { ...DEFAULT_ABILITIES },
  };

  return {
    ...state,
    pieces: [...updatedPieces, revivedQueen],
    abilityMode: { type: 'none' },
    lastEffect: { type: 'revive', at: { row: spawnRow, col: spawnCol } },
  };
}
